// Run with:  node --test tests/
// All of these are AUTOMATED checks of the swing model + a flat-ground mirror of the ball physics (see tests/README.md).
// They do not run the live game (three.js is needed for that), so terrain, trees, water and the real HUD are NOT covered.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, mulberry32, flatShot, SRC } = require('./harness');
const { legacyResolve, legacyClub } = require('./legacy');

const g = loadGame();
const SM = g.SwingModel;
const FULL = g.CLUBS.filter(c => !c.putt);           // Hammer, 3-Wood, Iron, Wedge
const noJit = () => 0.5;                              // rng that switches both jitters off -> pure player-controlled outcome
const swing = (club, offset, rng = noJit, wind) => {
  const m = SM.resolve(club, offset, rng);
  return { m, ...flatShot(g, club, club.v0 * m.speedMult, m.yawErr, m.spinErr, wind) };
};
const grid = (lo, hi, n = 200) => Array.from({ length: n }, (_, i) => lo + (hi - lo) * (i + 0.5) / n); // uniform over a needle range
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };

// ---------------------------------------------------------------- consistency with what the player is shown
test('club buttons show the same yardage the physics produces (full pull, perfect contact, still air, flat)', () => {
  const shown = [...SRC.matchAll(/<span>([\w-]+)<\/span><small>(\d+)y<\/small>/g)].map(m => [m[1], +m[2]]);
  assert.deepEqual(shown.map(s => s[0]), FULL.map(c => c.name));
  for (const [name, yds] of shown) {
    const c = FULL.find(x => x.name === name);
    assert.equal(yds, c.carry, `${name} button text`);
    const r = swing(c, 0);
    assert.ok(Math.abs(r.carry - yds) <= 1, `${name}: shown ${yds}y, simulated carry ${r.carry.toFixed(1)}y`);
  }
});

test('meter is one smooth rainbow (no hard bands): wide sweep, many slices, cyan center to dark ends', () => {
  assert.ok(!/pendHit|pendOk|pendMiss|pendChunk/.test(SRC), 'old hard-edged bands should be gone');
  const sweep = +SRC.match(/const PEND_SWEEP=(\d+);/)[1];
  assert.ok(sweep >= 70 && sweep <= 85, `needle sweep ${sweep} degrees each way`);
  assert.ok(+SRC.match(/const N=(\d+);let h=/)[1] >= 90, 'enough slices to read as a gradient');
  const stops = eval(SRC.match(/const stops=(\[\[0,.*?\]\]);/)[1]);
  assert.equal(stops[0][0], 0); assert.equal(stops[stops.length - 1][0], 1);
  for (let i = 1; i < stops.length; i++) assert.ok(stops[i][0] > stops[i - 1][0], 'stops increase');
  const [r0, , b0] = stops[0][1], [r1, , b1] = stops[stops.length - 1][1];
  assert.ok(b0 > r0, 'center is cyan-ish'); assert.ok(r1 > b1 && r1 < 200, 'ends are deep red/wine');
});

test('rainbow is anchored on the ball and stays on screen', () => {
  const vb = SRC.match(/<svg viewBox="-(\d+) -(\d+) (\d+) (\d+)" aria-hidden="true">\s*<path id="pendBase"/);
  assert.ok(vb, 'meter svg viewBox found');
  const [ox, oy, w, h] = vb.slice(1).map(Number);
  const code = SRC.slice(SRC.indexOf('// <pend-layout>'), SRC.indexOf('// </pend-layout>'));
  const { pendLayout, PEND_VIEW } = new Function('clamp', code + ';return {pendLayout,PEND_VIEW};')(g.clamp);
  assert.deepEqual(PEND_VIEW, { w, h, ox, oy }, 'layout constants match the svg viewBox');
  for (const vw of [340, 360, 390, 430, 820]) for (const bx of [vw * 0.5, vw * 0.4, vw * 0.62]) {
    const L = pendLayout(bx, 500, vw);
    assert.ok(Math.abs(L.left + L.W * ox / w - bx) < 1e-9, `pivot x on the ball (vw ${vw}, ball ${bx})`);
    assert.ok(Math.abs(L.top + L.H * oy / h - 500) < 1e-9, 'pivot y on the ball');
    assert.ok(L.left >= 4 && L.left + L.W <= vw - 4 && L.W <= 262, 'inside the screen');
  }
  const edge = pendLayout(8, 500, 390); assert.equal(edge.left, 4, 'a ball near the screen edge pushes the meter back on screen instead of off it');
});

test('arrow is translucent and starts clear of the ball (no pivot cap on top of it)', () => {
  const g0 = SRC.slice(SRC.indexOf('<g id="pendNeedle"'), SRC.indexOf('</svg></div>'));
  assert.match(g0, /<g id="pendNeedle" opacity="\.[5-9]\d*"/, 'needle group is semi-transparent');
  assert.ok(!/<circle/.test(g0), 'no pivot circle over the ball');
  const ys = [...g0.matchAll(/d="(M[^"]+)"/g)].flatMap(m => [...m[1].matchAll(/-?\d+(?:\.\d+)?\s+(-\d+(?:\.\d+)?)/g)].map(n => +n[1]));
  assert.ok(ys.length > 8 && Math.max(...ys) <= -20, `arrow tail starts at least 20 units above the ball (closest point y=${Math.max(...ys)})`);
});

test('no flat "perfect zone": every step away from dead center costs a little more', () => {
  for (const c of FULL) {
    let prevLoss = -1, prevLat = -1;
    for (let a = 0.01; a <= 1.0001; a += 0.01) {
      const loss = SM.speedLoss(c, a), lat = SM.lateralSev(a);
      assert.ok(loss > prevLoss && lat > prevLat, `${c.name} penalty did not grow at ${a.toFixed(2)}`);
      prevLoss = loss; prevLat = lat;
    }
  }
});

test('closer to the middle is always rewarded: tighter release windows give strictly better expected shots', () => {
  for (const c of FULL) {
    const ref = swing(c, 0).carry;
    const ex = [0.03, 0.06, 0.12, 0.25, 0.5, 1].map(hi => {
      const rs = grid(0, hi).map(a => swing(c, a));
      return { hi, loss: 1 - mean(rs.map(r => r.carry)) / ref, side: mean(rs.map(r => Math.abs(r.lateral))) };
    });
    for (let i = 1; i < ex.length; i++) assert.ok(ex[i].loss > ex[i - 1].loss && ex[i].side > ex[i - 1].side, `${c.name}: window ${ex[i - 1].hi} vs ${ex[i].hi}`);
  }
});

test('lie label (-X% distance) matches the carry actually lost in the rough and the sand', () => {
  for (const c of FULL) for (const [lie, surf] of [[g.ROUGH, g.ROUGH], [g.SAND, g.SAND]]) {
    const pen = g.lieMult(lie, c);
    const label = 1 - SM.carryFactor(c, pen);
    const sim = 1 - flatShot(g, c, c.v0 * pen, 0, 0, undefined, surf).carry / flatShot(g, c, c.v0, 0, 0).carry;
    assert.ok(Math.abs(label - sim) < 0.015, `${c.name} lie ${lie}: label ${(label * 100).toFixed(1)}% vs sim ${(sim * 100).toFixed(1)}%`);
  }
});

// ---------------------------------------------------------------- swing quality matters, and in the right order
test('perfect contact: no distance or direction penalty beyond the small jitter', () => {
  for (const c of FULL) { const r = swing(c, 0); assert.ok(Math.abs(r.lateral) < 0.01 && r.m.speedMult === 1, c.name); }
});

test('worse timing never helps: carry never rises and sideways miss never shrinks as |offset| grows', () => {
  for (const c of FULL) {
    let prevCarry = Infinity, prevLat = -1;
    for (let a = 0; a <= 1.0001; a += 0.02) {
      const r = swing(c, a);
      assert.ok(r.carry <= prevCarry + 0.05, `${c.name} carry rose at ${a.toFixed(2)}`);
      assert.ok(Math.abs(r.lateral) >= prevLat - 0.05, `${c.name} lateral shrank at ${a.toFixed(2)}`);
      prevCarry = r.carry; prevLat = Math.abs(r.lateral);
    }
  }
});

test('left and right misses are mirror images', () => {
  for (const c of FULL) for (const a of [0.2, 0.5, 1]) {
    const L = swing(c, -a), R = swing(c, a);
    assert.ok(Math.abs(L.lateral + R.lateral) < 0.05 && Math.abs(L.carry - R.carry) < 0.05, `${c.name} ${a}`);
  }
});

test('misses are graded: small miss is modest, bad miss is large, worst contact is big but recoverable', () => {
  for (const c of FULL) {
    const ref = swing(c, 0);
    const edgeOfYellow = swing(c, SM.GOOD), worst = swing(c, 1); // GOOD = last offset still called FADE/DRAW
    const loss = r => 1 - r.carry / ref.carry, side = r => Math.abs(r.lateral) / ref.carry;
    assert.ok(loss(edgeOfYellow) <= 0.08 && side(edgeOfYellow) <= 0.08, `${c.name} small-miss edge: -${(loss(edgeOfYellow) * 100).toFixed(1)}% carry, ${(side(edgeOfYellow) * 100).toFixed(1)}% sideways`);
    assert.ok(loss(worst) >= 0.15 && loss(worst) <= 0.42, `${c.name} worst contact loses ${(loss(worst) * 100).toFixed(0)}% carry`);
    assert.ok(side(worst) >= 0.12 && side(worst) <= 0.32, `${c.name} worst contact ${(side(worst) * 100).toFixed(0)}% off line`);
    assert.ok(worst.carry >= 0.6 * ref.carry, `${c.name} worst contact still carries 60%+ (recoverable)`);
  }
});

test('success criterion: a better swing has better expected outcomes (strictly ordered by skill)', () => {
  // three player profiles, each releasing uniformly across a needle range
  const profiles = { sharp: [0, SM.PERFECT], decent: [0, SM.GOOD], loose: [0, 1] };
  for (const c of FULL) {
    const ref = swing(c, 0).carry, ex = {};
    for (const [name, [lo, hi]] of Object.entries(profiles)) {
      const rs = grid(lo, hi).map(a => swing(c, a));
      ex[name] = { carryLoss: 1 - mean(rs.map(r => r.carry)) / ref, side: mean(rs.map(r => Math.abs(r.lateral))) };
    }
    assert.ok(ex.sharp.carryLoss < ex.decent.carryLoss && ex.decent.carryLoss < ex.loose.carryLoss, `${c.name} carry loss ordering`);
    assert.ok(ex.sharp.side < ex.decent.side && ex.decent.side < ex.loose.side, `${c.name} sideways ordering`);
    assert.ok(ex.loose.side > 2.5 * ex.decent.side, `${c.name}: loose play must be clearly worse than decent (${ex.loose.side.toFixed(1)} vs ${ex.decent.side.toFixed(1)} yd)`);
    assert.ok(ex.sharp.side < 0.02 * ref, `${c.name}: sharp play lands within 2% of the intended line`);
  }
});

// ---------------------------------------------------------------- clubs
// Hammer->3-Wood is the tightest gap (12%); the other two gaps are ~28% and ~42%. Reported as a balance note, distances were left alone.
test('club distances are coherent: strictly ordered, each club at least 10% beyond the next', () => {
  const carries = FULL.map(c => swing(c, 0).carry);
  for (let i = 1; i < carries.length; i++) assert.ok(carries[i] <= carries[i - 1] * 0.90, `${FULL[i - 1].name} ${carries[i - 1].toFixed(0)} -> ${FULL[i].name} ${carries[i].toFixed(0)}`);
});

test('longer clubs are less forgiving than shorter ones (distance lost and sideways miss, as a share of carry)', () => {
  const worst = FULL.map(c => { const ref = swing(c, 0).carry, r = swing(c, 1); return { n: c.name, loss: 1 - r.carry / ref, side: Math.abs(r.lateral) / ref }; });
  for (let i = 1; i < worst.length; i++) {
    assert.ok(worst[i].loss < worst[i - 1].loss, `${worst[i].n} should lose less distance than ${worst[i - 1].n}`);
    assert.ok(worst[i].side < worst[i - 1].side, `${worst[i].n} should miss less sideways than ${worst[i - 1].n}`);
  }
});

test('no club dominates: expected sideways error per yard of carry stays within 1.6x across clubs', () => {
  const rel = FULL.map(c => { const ref = swing(c, 0).carry; return mean(grid(0, SM.GOOD).map(a => Math.abs(swing(c, a).lateral))) / ref; });
  assert.ok(Math.max(...rel) / Math.min(...rel) < 1.6, rel.map(x => (x * 100).toFixed(2) + '%').join(' '));
});

// ---------------------------------------------------------------- randomness and fairness
test('randomness is small, does not depend on timing quality, and is reproducible from a seed', () => {
  for (const c of FULL) {
    const run = (a, seed) => { const rng = mulberry32(seed); return Array.from({ length: 400 }, () => swing(c, a, rng)); };
    const perfect = run(0, 7), again = run(0, 7);
    assert.deepEqual(perfect.map(r => r.carry), again.map(r => r.carry), `${c.name} not reproducible`);
    assert.ok(sd(perfect.map(r => r.carry)) < 0.014 * c.carry, `${c.name} perfect-swing carry sd ${sd(perfect.map(r => r.carry)).toFixed(1)}y`);
    assert.ok(sd(perfect.map(r => r.lateral)) < 0.006 * c.carry, `${c.name} perfect-swing lateral sd`);
    // the jitter amplitude is identical at every timing quality (player error is never disguised as luck)
    const amp = a => { const lo = SM.resolve(c, a, () => 0), hi = SM.resolve(c, a, () => 1); return [hi.speedMult / lo.speedMult, hi.yawErr - lo.yawErr]; };
    for (const a of [0, 0.2, 0.5, 0.8, 1]) { const [sp, yw] = amp(a), [sp0, yw0] = amp(0); assert.ok(Math.abs(sp - sp0) < 1e-9 && Math.abs(yw - yw0) < 1e-9, `${c.name} jitter changes at ${a}`); }
  }
});

test('a perfect swing improves the odds without guaranteeing the pin', () => {
  const rng = mulberry32(11);
  for (const c of FULL) {
    const xs = Array.from({ length: 300 }, () => swing(c, 0, rng).carry);
    assert.ok(sd(xs) > 0.3, `${c.name}: perfect swings should still vary a little`);
  }
});

test('environment stays separate from the swing: wind moves the same swing by the same amount at any quality', () => {
  const wind = { x: 0, z: -13 * 0.4889 }; // 13 mph headwind
  for (const c of FULL) {
    const dPerfect = swing(c, 0).carry - swing(c, 0, noJit, wind).carry;
    const dBad = swing(c, 0.8).carry - swing(c, 0.8, noJit, wind).carry;
    assert.ok(dPerfect > 1, `${c.name} headwind should cost carry`);
    assert.ok(Math.abs(dPerfect - dBad) < 0.35 * dPerfect, `${c.name} wind effect should not depend on the swing model`);
  }
});

test('the model draws exactly two random numbers per full swing and none for a putt', () => {
  let n = 0; const rng = () => (n++, 0.5);
  SM.resolve(g.CLUBS[0], 0.6, rng); assert.equal(n, 2);
  n = 0; SM.resolve(g.CLUBS[4], 0.6, rng); assert.equal(n, 0);
});

test('putting behaves exactly as before the change', () => {
  const putter = g.CLUBS[4], old = legacyClub(putter);
  assert.equal(putter.dev, old.dev); assert.equal(putter.curve, old.curve);
  for (const off of [-1, -0.6, -0.39, -0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.2, 0.39, 0.4, 0.6, 1]) {
    const a = SM.resolve(putter, off, () => { throw new Error('putter must not use randomness'); }), b = legacyResolve(old, off, noJit);
    assert.equal(a.speedMult, b.speedMult); assert.equal(a.spinErr, b.spinErr); assert.ok(Math.abs(a.yawErr - b.yawErr) < 1e-12, `offset ${off}`);
  }
});

// ---------------------------------------------------------------- feedback
test('feedback words: one clear word per tier, distance note only when the loss is noticeable', () => {
  const c = g.CLUBS[0], fb = o => SM.resolve(c, o, noJit).feedback;
  assert.equal(fb(0).tag, 'PERFECT!'); assert.equal(fb(0).note, null); assert.equal(fb(0).word, null);
  assert.equal(fb(0.2).tag, 'FADE'); assert.equal(fb(-0.2).tag, 'DRAW'); assert.equal(fb(0.2).note, null);
  assert.equal(fb(0.55).tag, 'SLICE!'); assert.equal(fb(-0.55).tag, 'HOOK!'); assert.match(fb(0.55).note, /^−\d+% DIST$/); assert.equal(fb(0.55).word, null);
  assert.equal(fb(0.9).word, 'CHUNK!'); assert.equal(fb(-0.9).tag, 'HOOK!');
  // the percentage shown is the real still-air carry lost
  for (const o of [0.5, 0.8, 1]) { const m = SM.resolve(c, o, noJit), lost = Math.round((1 - swing(c, o).carry / swing(c, 0).carry) * 100); assert.ok(Math.abs(m.lossPct - lost) <= 1, `offset ${o}: shows ${m.lossPct}%, sim ${lost}%`); }
});
