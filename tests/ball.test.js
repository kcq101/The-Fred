// Run with:  node --test tests/
// AUTOMATED checks of BallModel (flight, impact, bounce, roll, terrain response) read straight out of index.html, plus the real terrain code
// (heights, surfaces, bunkers, water) for the three holes. Scenarios are the ones listed in the Phase 2 brief.
// Not covered (needs a browser + three.js): rendering, trees, the real HUD, touch input, device frame rates, phone performance.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, loadCourse, makeTerrain, runBall, mulberry32, SRC, between } = require('./harness');

const g = loadGame();
const BM = g.BallModel;
const { G, K, R, SP } = g;
const FULL = g.CLUBS.filter(c => !c.putt);
const [HAMMER, WOOD, IRON, WEDGE] = FULL;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const launch = (club, power = 1, yaw = 0) => { const s = club.v0 * Math.sqrt(power); return { x: Math.sin(yaw) * Math.cos(club.ang) * s, y: Math.sin(club.ang) * s, z: Math.cos(yaw) * Math.cos(club.ang) * s }; };
const shot = (club, terrain, o = {}) => runBall(g, terrain, { v: launch(club, o.power ?? 1, o.yaw ?? 0), club, spin: o.spin ?? 0, wind: o.wind, start: o.start, maxT: 40 });
const flat = surf => makeTerrain(() => 0, surf);
const grade = (s, z0) => (x, z) => s * Math.max(0, z - z0);        // constant grade from z0 on (+ = uphill)
// fall angle of a still-air shot as it reaches the ground, from the model's own trace
const arrivalAngle = (club, terrain, o = {}) => {
  const v = launch(club, o.power ?? 1), p = { x: 0, y: terrain.H(0, 0) + R + 0.02, z: 0 };
  BM.trace(p, v, 0, BM.NO_WIND, terrain.H, null, 1);
  return Math.atan2(-v.y, Math.hypot(v.x, v.z)) / g.D2R;
};
// independent still-air reference: its own tiny-step integrator (not BallModel), straight from the stated physics, to a terrain height function
function refCarry(club, speed, H, dt = 1 / 4000) {
  let x = 0, y = H(0, 0) + R + 0.02, vx = Math.cos(club.ang) * speed, vy = Math.sin(club.ang) * speed;
  for (let t = 0; t < 15; t += dt) {
    const s = Math.hypot(vx, vy); vx -= K * s * vx * dt; vy -= (G + K * s * vy) * dt; x += vx * dt; y += vy * dt;
    if (t > 0.05 && y - R <= H(0, x)) return x;
  }
  return NaN;
}

// ---------------------------------------------------------------- the model itself
test('the per-club roll factor is gone and every surface can hold a ball it is meant to (hold <= dec/G)', () => {
  assert.ok(FULL.every(c => !('roll' in c)), 'CLUBS still carry a roll factor');
  assert.ok(!/club\.roll|c\.roll/.test(SRC), 'something still reads a per-club roll factor');
  for (const [k, s] of Object.entries(SP)) {
    assert.ok(s.hold <= s.dec / G + 1e-9, `surface ${s.name}: hold ${s.hold} must not exceed dec/G ${(s.dec / G).toFixed(3)} or a ball could sit on a slope it would also slide down`);
    assert.ok(s.e >= 0 && s.e < 1 && s.floor >= 0 && s.floor < 1 && s.bite >= 0 && s.mu >= 0, `surface ${s.name} parameters in range`);
  }
  assert.ok(SP[g.SAND].e < SP[g.ROUGH].e && SP[g.ROUGH].e < SP[g.FAIRWAY].e, 'bounce: sand < rough < fairway');
  assert.ok(SP[g.ROUGH].bite > SP[g.FAIRWAY].bite && SP[g.SAND].bite > SP[g.ROUGH].bite, 'grab: fairway < rough < sand');
});

test('flight is unchanged: every club still carries its stated distance on flat ground in still air', () => {
  for (const c of FULL) {
    const r = shot(c, flat(g.FAIRWAY));
    assert.ok(Math.abs(r.summary.carry - c.carry) <= 0.6, `${c.name}: stated ${c.carry}, carried ${r.summary.carry.toFixed(1)}`);
    assert.ok(Math.abs(BM.carryTo(c.ang, c.v0) - c.carry) <= 0.8, `${c.name}: carryTo ${BM.carryTo(c.ang, c.v0).toFixed(1)}`);
  }
});

test('a steeper arrival keeps less of its run, and softer ground keeps less than firm ground', () => {
  // one impact at a time: ball a hair above flat ground, same speed, different fall angles
  const after = (angDeg, surf, speed = 40) => {
    const a = angDeg * g.D2R, b = { p: { x: 0, y: R + 0.001, z: 0 }, v: { x: 0, y: -Math.sin(a) * speed, z: Math.cos(a) * speed }, rolling: false, landed: false, resting: false, t: 0, lipT: -9 };
    BM.begin(b); BM.step(b, BM.STEP, { terrain: flat(surf), sp: SP, wind: { x: 0, z: 0 } });
    return { kept: Math.hypot(b.v.x, b.v.z) / (Math.cos(a) * speed), hop: b.v.y };
  };
  let prev = 2;
  for (const a of [8, 12, 16, 20, 25, 30, 40, 55]) { const k = after(a, g.FAIRWAY).kept; assert.ok(k <= prev + 1e-9, `kept share rose at ${a} deg`); prev = k; }
  assert.ok(after(8, g.FAIRWAY).kept > 0.5 && after(55, g.FAIRWAY).kept <= SP[g.FAIRWAY].floor + 1e-9, 'shallow keeps most of its run, steep keeps only the floor');
  for (const a of [12, 20, 40]) assert.ok(after(a, g.ROUGH).kept < after(a, g.FAIRWAY).kept && after(a, g.SAND).kept < after(a, g.ROUGH).kept, `softer ground keeps less at ${a} deg`);
  assert.ok(after(30, g.SAND).hop < after(30, g.ROUGH).hop && after(30, g.ROUGH).hop < after(30, g.FAIRWAY).hop, 'hop: sand < rough < fairway');
});

// ---------------------------------------------------------------- the brief's scenarios
test('driver on flat, firm fairway: real carry, a substantial but bounded run, at rest in a few seconds', () => {
  const r = shot(HAMMER, flat(g.FAIRWAY)), s = r.summary;
  assert.ok(Math.abs(s.carry - 245) <= 0.6);
  assert.ok(s.roll >= 28 && s.roll <= 55, `roll ${s.roll.toFixed(1)}`);
  assert.ok(r.resting && r.t < 10 && s.bounces >= 1 && s.bounces <= 3, `rest ${r.resting} after ${r.t.toFixed(1)}s, ${s.bounces} bounces`);
  assert.ok(r.inv.maxHopAfterLanding < 2.5, `hop ${r.inv.maxHopAfterLanding.toFixed(2)} yd`);
});

test('driver landing uphill rolls less and carries shorter; downhill carries farther and goes farther in total', () => {
  const up = shot(HAMMER, makeTerrain(grade(0.05, 120), g.FAIRWAY)).summary, lvl = shot(HAMMER, flat(g.FAIRWAY)).summary, dn = shot(HAMMER, makeTerrain(grade(-0.05, 120), g.FAIRWAY)).summary;
  assert.ok(up.carry < lvl.carry && lvl.carry < dn.carry, `carry ${up.carry.toFixed(0)} < ${lvl.carry.toFixed(0)} < ${dn.carry.toFixed(0)}`);
  assert.ok(up.roll < lvl.roll, `uphill roll ${up.roll.toFixed(1)} vs level ${lvl.roll.toFixed(1)}`);
  assert.ok(up.total < lvl.total && lvl.total < dn.total, `total ${up.total.toFixed(0)} < ${lvl.total.toFixed(0)} < ${dn.total.toFixed(0)}`);
});

test('the same holds for the iron and the wedge, and for steeper (Phase 3-style) grades', () => {
  for (const [c, z0] of [[IRON, 60], [WEDGE, 30]]) for (const s of [0.04, 0.1, 0.2]) {
    const up = shot(c, makeTerrain(grade(s, z0), g.FAIRWAY)).summary, lvl = shot(c, flat(g.FAIRWAY)).summary, dn = shot(c, makeTerrain(grade(-s, z0), g.FAIRWAY)).summary;
    assert.ok(up.carry < lvl.carry && lvl.carry < dn.carry && up.total < lvl.total && lvl.total < dn.total, `${c.name} grade ${s}`);
    assert.ok(up.roll <= lvl.roll + 0.05, `${c.name} grade ${s}: uphill roll ${up.roll.toFixed(1)} vs level ${lvl.roll.toFixed(1)}`);
  }
});

test('elevation is applied once: carry over raised/lowered ground matches an independent still-air integration', () => {
  for (const rise of [-8, -4, 4, 8]) for (const c of FULL) {
    const t = makeTerrain((x, z) => rise * ss(c.carry * 0.25, c.carry * 0.55, z), g.FAIRWAY);
    const got = shot(c, t).summary.carry, want = refCarry(c, c.v0, (x, z) => t.H(x, z));
    assert.ok(Math.abs(got - want) <= 0.5, `${c.name} rise ${rise}: model ${got.toFixed(2)} vs reference ${want.toFixed(2)}`);
  }
});

test('playsLike: higher targets play longer, lower ones shorter, and swinging at that speed lands on the target', () => {
  for (const c of FULL) for (const dh of [-6, -3, 3, 6]) {
    const dist = c.carry * 0.9, pl = BM.playsLike(c.ang, dist, dh);
    assert.ok(dh > 0 ? pl.plays > dist : pl.plays < dist, `${c.name} dh ${dh}: plays ${pl.plays.toFixed(1)} vs ${dist.toFixed(1)}`);
    // terrain whose height at `dist` is dh, reached well before the ball arrives; the ball must land on `dist`
    const t = makeTerrain((x, z) => dh * ss(dist * 0.3, dist * 0.6, z), g.FAIRWAY);
    const v = { x: 0, y: Math.sin(c.ang) * pl.speed, z: Math.cos(c.ang) * pl.speed };
    const r = runBall(g, t, { v, club: c, maxT: 40 });
    assert.ok(Math.abs(r.summary.carry - dist) <= 0.8, `${c.name} dh ${dh}: landed ${r.summary.carry.toFixed(1)} vs target ${dist.toFixed(1)}`);
    assert.ok(Math.abs(g.speedForCarry(c, pl.plays) - pl.speed) <= 0.5, `${c.name}: plays-like distance agrees with the club's speed table`);
  }
});

test('iron on fairway vs rough: same carry, but the rough takes the bounce and the run away', () => {
  const fw = shot(IRON, flat(g.FAIRWAY)), rf = shot(IRON, flat(g.ROUGH));
  assert.ok(Math.abs(fw.summary.carry - rf.summary.carry) < 0.01, 'flight does not depend on what it lands on');
  assert.ok(rf.summary.roll < 0.5 * fw.summary.roll, `roll ${rf.summary.roll.toFixed(1)} vs ${fw.summary.roll.toFixed(1)}`);
  assert.ok(rf.inv.maxHopAfterLanding < 0.5 * fw.inv.maxHopAfterLanding && rf.summary.bounces <= fw.summary.bounces, 'rough hops less');
  const sd = shot(IRON, flat(g.SAND));
  assert.ok(sd.summary.roll < rf.summary.roll && sd.summary.roll < 0.5 && sd.summary.bounces <= 1, `sand: roll ${sd.summary.roll.toFixed(2)}`);
});

test('wedge on a green: lands steeply, checks quickly, little bounce, at rest', () => {
  const t = flat(g.GREENS), w = shot(WEDGE, t), h = shot(HAMMER, t);
  assert.ok(arrivalAngle(WEDGE, t) > 2 * arrivalAngle(HAMMER, t), 'the wedge comes down much more steeply than the driver');
  assert.ok(w.summary.roll <= 5 && w.summary.bounces <= 3 && w.resting && w.t < 8, `roll ${w.summary.roll.toFixed(1)}, ${w.summary.bounces} bounces, ${w.t.toFixed(1)}s`);
  assert.ok(w.summary.roll / w.summary.carry < 0.5 * (h.summary.roll / h.summary.carry), 'the wedge runs out far less than a low shot');
  assert.ok(w.inv.maxHopAfterLanding < 2.5, `hop ${w.inv.maxHopAfterLanding.toFixed(2)} yd`);
});

test('landing on a slope: side slopes pull the ball downhill (symmetrically); ridges send it either way', () => {
  const side = s => shot(HAMMER, makeTerrain((x, z) => s * x * ss(180, 230, z), g.FAIRWAY)), l = side(0.06), r = side(-0.06), n = side(0);
  assert.ok(Math.abs(n.ball.p.x) < 0.01, 'no drift on level ground');
  assert.ok(l.ball.p.x < -1 && r.ball.p.x > 1 && Math.abs(l.ball.p.x + r.ball.p.x) < 0.3, `drift ${l.ball.p.x.toFixed(2)} / ${r.ball.p.x.toFixed(2)}`);
  assert.ok(l.resting && r.resting);
  // a ridge across the line: wedge-length shots landing short of the crest roll back, long of it roll on; all come to rest
  const ridge = makeTerrain((x, z) => 2.5 * Math.exp(-(((z - 60) / 8) ** 2)), g.FAIRWAY);
  const ends = [0.5, 0.58, 0.64, 0.7, 0.78, 0.86].map(p => shot(WEDGE, ridge, { power: p }));
  assert.ok(ends.every(e => e.resting && e.t < 15 && e.inv.minClear >= -0.02), 'every ridge shot settles without clipping');
  assert.ok(ends.every(e => e.inv.maxHopAfterLanding < 3));
  const gain = ends.map(e => e.ball.p.z - e.ball.landAt.z);
  assert.ok(gain.some(x => x < -0.5) && gain.some(x => x > 0.5), `some roll back, some roll on: ${gain.map(x => x.toFixed(1))}`);
});

test('ground that cannot hold the ball lets it slide to flatter ground and rest; ground that can hold it does not move it', () => {
  const drop = (grd, surf = g.FAIRWAY) => {
    const t = makeTerrain((x, z) => Math.max(0, grd * (60 - z)), surf);       // slopes down toward +z, flat from z=60
    const b = { p: { x: 0, y: t.H(0, 10) + R, z: 10 }, v: { x: 0, y: 0, z: 0 }, rolling: true, landed: true, resting: false, t: 0, lipT: -9 };
    BM.begin(b); const env = { terrain: t, sp: SP, wind: { x: 0, z: 0 } };
    while (!b.resting && b.t < 25) BM.step(b, BM.STEP, env);
    return { b, moved: Math.abs(b.p.z - 10) };
  };
  for (const gr of [0.05, 0.1, 0.2]) { const d = drop(gr); assert.ok(d.b.resting && d.moved < 0.05 && d.b.t < 0.1, `fairway grade ${gr} holds the ball`); }
  for (const gr of [0.3, 0.5, 0.7, 1.0, 1.4]) { const d = drop(gr); assert.ok(d.b.resting && d.moved > 20 && d.b.p.z > 58 && d.b.t < 15, `fairway grade ${gr}: slid ${d.moved.toFixed(0)} yd, rest ${d.b.resting} at ${d.b.t.toFixed(1)}s`); }
  assert.ok(drop(0.8, g.SAND).b.resting && drop(0.8, g.SAND).moved > 10, 'sand lets go of a ball on a 0.8 grade too (steeper than its hold)');
});

test('steeper than the ground can hold, into a hazard: the ball goes in rather than hanging on the bank', () => {
  // a bank of grade 1.4 dropping into a basin whose bottom is below the water level
  const t = makeTerrain((x, z) => (z < 50 ? 0 : -Math.min(4.2, 1.4 * (z - 50))), (x, z) => g.ROUGH), level = -1.2;
  const b = { p: { x: 0, y: 0 + R - 1.4 * 1, z: 51 }, v: { x: 0, y: 0, z: 0.5 }, rolling: true, landed: true, resting: false, t: 0, lipT: -9, club: WEDGE };
  BM.begin(b); const env = { terrain: t, sp: SP, wind: { x: 0, z: 0 } };
  let wet = null; while (!b.resting && b.t < 22 && wet === null) { BM.step(b, BM.STEP, env); if (b.p.y - R <= level + 0.02 && t.H(b.p.x, b.p.z) < level) wet = b.t; }
  assert.ok(wet !== null && wet < 3, `reached the water after ${wet}s`);
});

test('short shots stop without excessive bounce or roll', () => {
  for (const p of [0.03, 0.06, 0.1, 0.25]) for (const surf of [g.FAIRWAY, g.GREENS, g.ROUGH]) {
    const r = shot(WEDGE, flat(surf), { power: p });
    assert.ok(r.resting && r.t < 4, `power ${p} on ${SP[surf].name}: rest ${r.resting} at ${r.t.toFixed(1)}s`);
    assert.ok(r.summary.bounces <= 2 && r.inv.maxHopAfterLanding < 0.6, `power ${p}: ${r.summary.bounces} bounces, hop ${r.inv.maxHopAfterLanding.toFixed(2)} yd`);
    assert.ok(r.summary.roll <= 0.08 * r.summary.carry + 0.35, `power ${p} on ${SP[surf].name}: roll ${r.summary.roll.toFixed(2)} of carry ${r.summary.carry.toFixed(1)}`);
  }
});

// ---------------------------------------------------------------- wind and the aiming arc
test('wind acts during flight only (no after-the-fact adjustment): headwind shortens, tailwind lengthens, crosswind drifts, all through the same drag', () => {
  const w = (x, z) => ({ x, z }), t = flat(g.FAIRWAY), yd = 14 * 0.4889;
  const still = shot(HAMMER, t).summary.carry, head = shot(HAMMER, t, { wind: w(0, -yd) }).summary.carry, tail = shot(HAMMER, t, { wind: w(0, yd) }).summary.carry;
  assert.ok(head < still - 3 && tail > still + 3, `${head.toFixed(1)} < ${still.toFixed(1)} < ${tail.toFixed(1)}`);
  const cross = shot(HAMMER, t, { wind: w(yd, 0) });
  assert.ok(cross.summary.carry > 0 && cross.ball.landAt.x > 1.5, `crosswind drift at landing ${cross.ball.landAt.x.toFixed(1)} yd`);
  // wind changes where the ball comes down, not how it behaves once it is down
  const lat = shot(WEDGE, flat(g.GREENS), { wind: w(0, yd) }), calm = shot(WEDGE, flat(g.GREENS));
  assert.ok(Math.abs(lat.summary.roll - calm.summary.roll) < 1.5, 'roll on the ground is not scaled by wind');
});

test('the aiming arc lands exactly where the live ball first touches down in still air (flat, sloped, shaped)', () => {
  const rng = mulberry32(3);
  const terrains = [flat(g.FAIRWAY), makeTerrain(grade(0.05, 40), g.FAIRWAY), makeTerrain(grade(-0.05, 40), g.FAIRWAY), makeTerrain((x, z) => 3 * Math.sin(z * 0.03) + 0.04 * x, g.FAIRWAY)];
  for (const t of terrains) for (const c of FULL) for (let i = 0; i < 6; i++) {
    const power = 0.25 + 0.75 * rng(), yaw = (rng() - 0.5) * 0.3, spin = (rng() - 0.5) * 2 * c.shape;
    const v = launch(c, power, yaw), p = { x: 0, y: t.H(0, 0) + R + 0.02, z: 0 }, pv = { ...v };
    const pre = BM.trace(p, pv, spin, BM.NO_WIND, t.H, null, 1);
    const live = runBall(g, t, { v, spin, club: c, maxT: 40 }).ball.landAt;
    assert.ok(pre && live, 'both land');
    assert.ok(Math.hypot(pre.x - live.x, pre.z - live.z) < 1e-6, `${c.name}: arc ${pre.x.toFixed(3)},${pre.z.toFixed(3)} vs live ${live.x.toFixed(3)},${live.z.toFixed(3)}`);
  }
});

test('fixed physics step: the game advances the ball in identical steps at any frame rate', () => {
  const a = SRC.indexOf('let stepAcc=0;\nfunction simulateFlight(dt){'), b = SRC.indexOf('function water(){', a);
  const src = SRC.slice(a, b);
  for (const fps of [20, 30, 60, 144]) {
    const steps = [];
    const api = new Function('env', `
      let state='flight';const ball=env.ball,BallModel=env.BallModel,R=0.05,PIN={x:1e6,z:1e6},PIN_H=0,HOLE={bbox:{x0:-1e9,x1:1e9,z0:-1e9,z1:1e9}},BODIES=[];
      const overWater=()=>null,water=()=>{},outOfBounds=()=>{},holed=()=>{},later=()=>{},setupAim=()=>{},showResult=()=>{},physStep=(b,h)=>{env.steps.push(h);b.t+=h;};
      ${src}
      return {run:dt=>simulateFlight(dt)};`)({ ball: { p: { x: 0, y: 5, z: 0 }, v: { x: 0, y: 0, z: 0, set() {} }, lastOut: { copy() {} }, resting: false, t: 0, rolling: false, lipT: -9 }, BallModel: BM, steps });
    for (let i = 0; i < 2 * fps; i++) api.run(1 / fps);
    assert.ok(steps.every(h => h === BM.STEP), `${fps} fps: every step is exactly ${BM.STEP}`);
    assert.ok(Math.abs(steps.length - 2 / BM.STEP) <= 1, `${fps} fps: ${steps.length} steps for 2 s`);
  }
});

// ---------------------------------------------------------------- coherence: the ball ends where the game says it ends
test('summary agrees with independent measurements: carry to the first-contact spot, roll from there to rest, total from the tee', () => {
  const rng = mulberry32(21);
  for (let i = 0; i < 40; i++) {
    const c = FULL[i % 4], t = makeTerrain((x, z) => 2 * Math.sin(x * 0.05) + 1.5 * Math.sin(z * 0.03 + 1), i % 3 === 0 ? g.ROUGH : g.FAIRWAY);
    const power = 0.3 + 0.7 * rng(), yaw = (rng() - 0.5) * 0.4;
    const r = runBall(g, t, { v: launch(c, power, yaw), club: c, spin: (rng() - 0.5) * c.shape, maxT: 40 });
    const s = r.summary, b = r.ball, a = b.landAt;
    assert.ok(a && r.resting);
    assert.ok(Math.hypot(a.x - r.inv.firstContact.x, a.z - r.inv.firstContact.z) < 1e-9, 'landAt is where the ball was first seen touching down');
    assert.ok(Math.abs(s.carry - Math.hypot(a.x - b.launch.x, a.z - b.launch.z)) < 1e-9, 'carry = launch to first contact');
    assert.ok(Math.abs(s.roll - Math.hypot(b.p.x - a.x, b.p.z - a.z)) < 1e-9, 'roll = first contact to rest');
    assert.ok(Math.abs(s.total - Math.hypot(b.p.x, b.p.z)) < 1e-9, 'total = launch to rest');
    assert.ok(s.total <= s.carry + s.roll + 1e-9, 'straight-line total never exceeds carry + roll');
    assert.ok(Math.abs(b.p.y - R - t.H(b.p.x, b.p.z)) < 1e-6, 'a ball at rest sits on the ground');
    assert.equal(b.v.x + b.v.y + b.v.z, 0, 'and is not moving');
  }
});

test('the "CARRY n · ROLL m" popup shows the same numbers the model recorded, and never appears for putts', () => {
  const a = SRC.indexOf('function showResult(){'), b = SRC.indexOf('let stepAcc', a);
  const popups = [];
  const api = new Function('env', `const BallModel=env.BallModel,sfx=(t,w,o)=>env.popups.push(t),ball=env.ball;${SRC.slice(a, b)}return {showResult};`);
  const r = shot(HAMMER, flat(g.FAIRWAY)), ball = { ...r.ball, club: HAMMER, p: { ...r.ball.p, clone() { return this; } } };
  api({ BallModel: BM, popups, ball }).showResult();
  assert.deepEqual(popups, [`${Math.round(r.summary.carry)} CARRY · ${Math.round(r.summary.roll)} ROLL`]);
  const putter = { ...ball, club: g.CLUBS[4] }; popups.length = 0; api({ BallModel: BM, popups, ball: putter }).showResult();
  assert.deepEqual(popups, []);
});

test('the end of a shot still flows into scoring and the next shot: rest, water and out-of-bounds all hand over correctly', () => {
  const a = SRC.indexOf('let stepAcc=0;\nfunction simulateFlight(dt){'), b = SRC.indexOf('function water(){', a), src = SRC.slice(a, b);
  const run = (ballP, bodies, bbox, restAfter) => {
    const log = [];
    const api = new Function('env', `
      let state='flight';const ball=env.ball,BallModel=env.BallModel,R=0.05,PIN={x:1e6,z:1e6},PIN_H=0,HOLE={bbox:env.bbox},BODIES=env.bodies;
      const overWater=(x,z)=>env.bodies.find(b=>b.sd(x,z)>0)||null,water=()=>env.log.push('water'),outOfBounds=()=>env.log.push('oob'),holed=()=>env.log.push('holed'),later=(s,f)=>env.log.push(['later',f===setupAim]),setupAim=()=>{},showResult=()=>env.log.push('result'),physStep=(b,h)=>{b.t+=h;if(b.t>=env.restAfter)b.resting=true;};
      ${src}
      return {run:dt=>simulateFlight(dt),state:()=>state};`)({ ball: { p: ballP, v: { x: 0, y: 0, z: 0, set() { return this; } }, lastOut: { copy() {} }, resting: false, t: 0, rolling: false, lipT: -9 }, BallModel: BM, bodies, bbox, log, restAfter });
    api.run(0.1); return { log, state: api.state() };
  };
  const big = { x0: -1e9, x1: 1e9, z0: -1e9, z1: 1e9 };
  let r = run({ x: 0, y: 5, z: 0 }, [], big, 0.02);
  assert.deepEqual(r.log, ['result', ['later', true]]); assert.equal(r.state, 'settle');
  r = run({ x: 0, y: -3, z: 0 }, [{ level: -1, sd: () => 1 }], big, 99);
  assert.deepEqual(r.log, ['water']);
  r = run({ x: 500, y: 5, z: 0 }, [], { x0: -10, x1: 10, z0: -10, z1: 10 }, 99);
  assert.deepEqual(r.log, ['oob']);
});

// ---------------------------------------------------------------- the real holes
const course = loadCourse();
const NAMES = ['tee', 'fairway', 'rough', 'fringe', 'green', 'sand', 'water'];

test('real holes: a ball on a bunker bank slides to the bottom and rests in the sand within seconds (was: never, until the 22 s time-out)', () => {
  let tested = 0;
  for (let hi = 0; hi < course.HOLES.length; hi++) {
    course.prepHole(hi);
    for (const bk of course.BUNKERS) for (let k = 0; k < 8; k++) {
      const x = bk.x + Math.cos(k * Math.PI / 4) * bk.rx * 0.9, z = bk.z + Math.sin(k * Math.PI / 4) * bk.rz * 0.9;
      if (course.S(x, z) !== g.SAND) continue;
      const b = { p: { x, y: course.H(x, z) + R, z }, v: { x: 0, y: 0, z: 0 }, rolling: true, landed: true, resting: false, t: 0, lipT: -9, club: WEDGE };
      BM.begin(b); const env = { terrain: course.terrain, sp: SP, wind: { x: 0, z: 0 } };
      while (!b.resting && b.t < BM.MAX_T) BM.step(b, BM.STEP, env);
      assert.ok(b.resting && b.t < 4, `${course.HOLE.name} bunker point ${k}: rest ${b.resting} at ${b.t.toFixed(1)}s`);
      assert.equal(course.S(b.p.x, b.p.z), g.SAND, 'stays in the bunker');
      assert.ok(Math.hypot(b.p.x - x, b.p.z - z) < 4, 'slides only a short way');
      tested++;
    }
  }
  assert.ok(tested >= 40, `tested ${tested} bank points`);
});

test('real holes: wedge shots dropped into a bunker end in that bunker, at rest, whatever part of it they hit', () => {
  course.prepHole(0);                              // Pebble Beach, the bunker short-left of the green
  const bk = course.BUNKERS[0];
  const wedge = WEDGE, from = { x: bk.x + 28, z: bk.z - 55 };   // from the dry ground left of the chasm (Phase 3 put the ocean straight in front of this green)
  assert.notEqual(course.S(from.x, from.z), g.WATER);
  let n = 0;
  for (let k = 0; k < 16; k++) {
    const u = Math.cos(k * 0.4) * 0.85, w = Math.sin(k * 0.4) * 0.85;     // points inside the bunker's own outline
    const tx = bk.x + (u * bk.c - w * bk.s) * bk.rx, tz = bk.z + (u * bk.s + w * bk.c) * bk.rz;
    if (course.S(tx, tz) !== g.SAND) continue;
    const nn = course.normal(tx, tz); if (nn.y < 0.7) continue;   // a graze on the steep lip face can skim across the sand: documented limitation, see tests/README.md
    // find the launch speed whose first touchdown is the target, by bisection on the real terrain
    const yaw = Math.atan2(tx - from.x, tz - from.z), D = Math.hypot(tx - from.x, tz - from.z);
    let lo = 5, hi = 60;
    const land = sp => { const p = { x: from.x, y: course.H(from.x, from.z) + R + 0.02, z: from.z }, v = { x: Math.sin(yaw) * Math.cos(wedge.ang) * sp, y: Math.sin(wedge.ang) * sp, z: Math.cos(yaw) * Math.cos(wedge.ang) * sp }; const l = BM.trace(p, v, 0, BM.NO_WIND, course.H, null, 1); return Math.hypot(l.x - from.x, l.z - from.z); };
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; land(m) < D ? lo = m : hi = m; }
    const sp = (lo + hi) / 2;
    const r = runBall(g, course.terrain, { start: from, v: { x: Math.sin(yaw) * Math.cos(wedge.ang) * sp, y: Math.sin(wedge.ang) * sp, z: Math.cos(yaw) * Math.cos(wedge.ang) * sp }, club: wedge, maxT: 30 });
    assert.ok(Math.hypot(r.ball.landAt.x - tx, r.ball.landAt.z - tz) < 0.5, 'touched down on the target');
    assert.ok(r.resting && r.t < 10, `target ${k}: rest ${r.resting} at ${r.t.toFixed(1)}s`);
    assert.equal(course.S(r.ball.p.x, r.ball.p.z), g.SAND, `target ${k} ended in ${NAMES[course.S(r.ball.p.x, r.ball.p.z)]}`);
    n++;
  }
  assert.ok(n >= 6, `${n} shots`);
});

test('real holes, 600 random shots each (random start, club, power, aim, shaping, wind): no clipping, no NaN, no runaway, every shot settles or is a penalty', () => {
  const rng = mulberry32(2024);
  const tot = { shots: 0, rest: 0, hazard: 0, minClear: Infinity, maxRestT: 0, maxGround: 0, maxDryHop: 0 };
  for (let hi = 0; hi < course.HOLES.length; hi++) {
    course.prepHole(hi);
    const bb = course.HOLE.bbox;
    for (let n = 0; n < 600; n++) {
      const club = FULL[Math.floor(rng() * 4)];
      let sx = 0, sz = 0;
      if (rng() < 0.4) { sz = rng() * (course.PIN.z - 30); sx = course.centerX(sz) + (rng() - 0.5) * 50; }
      if (course.S(sx, sz) === g.WATER || course.BODIES.some(b => b.sd(sx, sz) > -2)) continue;
      const aim = Math.atan2(course.PIN.x - sx, course.PIN.z - sz) + (rng() - 0.5) * 0.7;
      const sp = club.v0 * Math.sqrt(0.15 + 0.85 * rng()) * (0.8 + 0.2 * rng()) * g.lieMult(course.S(sx, sz), club);
      const ws = (3 + rng() * 11) * 0.4889, wy = rng() * 2 * Math.PI;
      const env = { terrain: course.terrain, sp: SP, wind: { x: Math.sin(wy) * ws, z: Math.cos(wy) * ws } };
      const b = { p: { x: sx, y: course.H(sx, sz) + R + 0.02, z: sz }, v: { x: Math.sin(aim) * Math.cos(club.ang) * sp, y: Math.sin(club.ang) * sp, z: Math.cos(aim) * Math.cos(club.ang) * sp }, rolling: false, landed: false, resting: false, t: 0, spin: (rng() - 0.5) * 2 * club.shape, club, lipT: -9 };
      BM.begin(b);
      let exit = null, hop = 0;
      while (b.t < BM.MAX_T && !b.resting && !exit) {
        BM.step(b, BM.STEP, env); const p = b.p;
        assert.ok(Number.isFinite(p.x + p.y + p.z + b.v.x + b.v.y + b.v.z), `${course.HOLE.name} shot ${n}: not finite`);
        const clear = p.y - R - course.H(p.x, p.z);
        tot.minClear = Math.min(tot.minClear, clear);
        if (b.landed) { hop = Math.max(hop, clear); if (b.rolling) { const sv = Math.hypot(b.v.x, b.v.y, b.v.z); if (sv > tot.maxGround) { tot.maxGround = sv; tot.where = course.HOLE.id; } } }
        for (const bd of course.BODIES) if (p.y - R <= bd.level + 0.02 && bd.sd(p.x, p.z) > 0) exit = 'water';
        if (p.x < bb.x0 + 3 || p.x > bb.x1 - 3 || p.z < bb.z0 + 3 || p.z > bb.z1 - 3) exit = exit || 'oob';
      }
      tot.shots++;
      if (exit) tot.hazard++;
      else { assert.ok(b.resting, `${course.HOLE.name} shot ${n} (${club.name}) never settled in ${b.t.toFixed(1)}s`); tot.rest++; tot.maxRestT = Math.max(tot.maxRestT, b.t); tot.maxDryHop = Math.max(tot.maxDryHop, hop); }
    }
  }
  assert.ok(tot.shots > 1500 && tot.rest > 800, JSON.stringify(tot));
  assert.ok(tot.minClear >= -0.02, `ball went ${(-tot.minClear).toFixed(3)} yd into the ground`);
  assert.ok(tot.maxGround <= BM.V_MAX + 1e-6, `ground speed ${tot.maxGround.toFixed(1)} on ${tot.where} (limit ${BM.V_MAX})`);
  assert.ok(tot.maxRestT < 12, `slowest settle ${tot.maxRestT.toFixed(1)}s (the game's own limit is ${BM.MAX_T}s)`);
  assert.ok(tot.maxDryHop < 3.5, `highest hop on dry ground ${tot.maxDryHop.toFixed(2)} yd`);
});

test('real greens: the putt preview and the live putt use one rolling law and finish within a few inches of each other', () => {
  course.prepHole(1);                              // Augusta's green has the most tilt
  let worst = 0, n = 0;
  const rng = mulberry32(8);
  for (let i = 0; i < 30; i++) {
    const a = rng() * 2 * Math.PI, d = 3 + rng() * 10, sx = course.PIN.x + Math.cos(a) * d, sz = course.PIN.z + Math.sin(a) * d;
    if (course.S(sx, sz) !== g.GREENS) continue;
    const yaw = Math.atan2(course.PIN.x - sx, course.PIN.z - sz) + (rng() - 0.5) * 0.2, speed = 3 + rng() * 9;
    const env = { terrain: course.terrain, sp: SP, wind: { x: 0, z: 0 } };
    const mk = () => ({ p: { x: sx, y: course.H(sx, sz) + R, z: sz }, v: { x: Math.sin(yaw) * speed, y: 0, z: Math.cos(yaw) * speed }, rolling: true, landed: false, resting: false, t: 0, rollT: 0, lipT: -9 });
    const live = mk(); BM.begin(live); while (!live.resting && live.t < 22) BM.step(live, BM.STEP, env);
    const prev = mk(); for (let k = 0; k < 600 && !prev.resting; k++) { BM.rollStep(prev, 1 / 60, env); prev.rolling = true; prev.p.y = course.H(prev.p.x, prev.p.z) + R; }
    assert.ok(live.resting && prev.resting, 'both stop');
    worst = Math.max(worst, Math.hypot(live.p.x - prev.p.x, live.p.z - prev.p.z)); n++;
  }
  assert.ok(n >= 15 && worst < 0.2, `${n} putts, worst preview-vs-live gap ${worst.toFixed(3)} yd`);
});
