#!/usr/bin/env node
// Controlled landing/rollout matrix (the QC audit, 2026-10-24). Every case fires a fixed incoming ball state (speed, descent angle, backspin)
// at the ground, so the club that made it cannot matter after contact; the "club landings" table shows what each club actually brings down.
//   node tests/tools/impact-matrix.js            all tables
//   node tests/tools/impact-matrix.js --json     machine-readable rows
//   node tests/tools/impact-matrix.js --spin [--tau=5,10,20,smits]   only table 11: spin at landing per club, for the game's decay and
//                                                each listed alternative (a number: Aero's TAU in seconds; smits: Smits & Smith's
//                                                speed-dependent decay, tau = 23.8 s × 100 mph / air speed). Alternatives patch a copy
//                                                of index.html in memory; each club's launch speed is re-solved for its stated carry.
// Columns: speed (m/s) and its horizontal / vertical parts, descent angle, backspin (rpm) at contact; bounces (each hop's length, yd);
// roll after the last hop; run (first contact to rest along the line, yd; negative: spun back); side (yd, + left).
const fs = require('fs');
const path = require('path');
const { loadGame, makeTerrain } = require(path.join(__dirname, '..', 'harness'));
const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const g = loadGame(), BM = g.BallModel, R = g.R, D2R = Math.PI / 180, YD = 0.9144;
const FULL = g.CLUBS.filter(c => !c.putt), byName = n => FULL.find(c => c.name === n);
const json = process.argv.includes('--json'), spinOnly = process.argv.includes('--spin');
const tauArg = (process.argv.find(a => a.startsWith('--tau=')) || '').slice(6);

// SP with a hole's play profile applied, as applyPlay does (firm: fairway-type turf; gfirm: the greens' bite)
function surfaces(firm = 1, gfirm = 1, gg = g) {
  const sp = JSON.parse(JSON.stringify(gg.SP));
  for (const k of [g.TEE, g.FAIRWAY, g.ROUGH, g.FRINGE]) { sp[k].bite /= firm; sp[k].mu /= firm; if (sp[k].rr != null) sp[k].rr /= firm; }
  sp[g.GREENS].bite /= gfirm;
  return sp;
}
// one landing: incoming speed (m/s), descent angle (deg), backspin (rpm), heading +z; terrain height fn and surface
function land({ speed, angle, rpm }, H, surf, sp = surfaces(), gg = g) {
  const t = makeTerrain(H, surf), s = speed / YD, a = angle * D2R;
  const b = { p: { x: 0, y: t.H(0, 0) + R + 1e-3, z: 0 }, v: { x: 0, y: -Math.sin(a) * s, z: Math.cos(a) * s }, rolling: false, landed: false, resting: false, t: 0, lipT: -9 };
  gg.BallModel.begin(b); b.air = { w: rpm * 2 * Math.PI / 60, ax: -1, az: 0, la: 0 };
  return settle(b, { terrain: t, sp, wind: { x: 0, z: 0 } }, t, gg.BallModel);
}
function settle(b, env, t, BM = g.BallModel) {
  const touches = []; let wasAir = true, first = null;
  while (!b.resting && b.t < BM.MAX_T) {
    const air = !b.rolling && !(b.landed && b.p.y - R - t.H(b.p.x, b.p.z) < 0.002);
    BM.step(b, BM.STEP, env);
    if (b.landed && first === null) first = { x: b.p.x, z: b.p.z };
    const onGround = b.rolling || b.p.y - R - t.H(b.p.x, b.p.z) < 0.002;
    if (wasAir && onGround && b.landed) touches.push({ x: b.p.x, z: b.p.z });
    wasAir = !onGround && b.landed ? true : (!b.landed);
    if (b.landed && !onGround) wasAir = true; else if (onGround) wasAir = false;
  }
  const hops = touches.slice(1).map((p, i) => Math.hypot(p.x - touches[i].x, p.z - touches[i].z));
  const last = touches[touches.length - 1] || first;
  return { bounces: hops.length, hops, roll: b.p.z - last.z, run: b.p.z - first.z, end: { ...b.p }, rest: b.resting, t: b.t, spinback: b.stats.spinback };
}
// a real club's flight to the ground: what it brings down (no wind, flat)
function clubLanding(club, power = 1, gg = g) {
  const BM = gg.BallModel, t = makeTerrain(() => 0, gg.FAIRWAY), s = club.v0 * Math.sqrt(power);
  const b = { p: { x: 0, y: R + 0.02, z: 0 }, v: { x: 0, y: Math.sin(club.ang) * s, z: Math.cos(club.ang) * s }, rolling: false, landed: false, resting: false, t: 0, lipT: -9, club };
  BM.begin(b); let pre = null, rpm = 0, apex = 0, launchRpm = b.air.w / (2 * Math.PI / 60);
  while (!b.landed) { pre = { ...b.v, z0: b.p.z }; rpm = b.air.w / (2 * Math.PI / 60); apex = Math.max(apex, b.p.y); BM.step(b, BM.STEP, { terrain: t, sp: gg.SP, wind: { x: 0, z: 0 } }); }
  const h = Math.hypot(pre.x, pre.z), sp = Math.hypot(h, pre.y);
  return { speed: sp * YD, angle: Math.atan2(-pre.y, h) / D2R, rpm, carry: b.stats.carry, launchRpm, hang: b.t, apex, v0: s };
}
const flat = () => 0, grade = s => (x, z) => s * z, side = s => (x, z) => s * x;
const rows = [];
function row(table, name, inc, r, extra = {}) {
  const a = inc.angle * D2R;
  rows.push({ table, name, speed: inc.speed, vh: inc.speed * Math.cos(a), vv: inc.speed * Math.sin(a), angle: inc.angle, rpm: inc.rpm, bounces: r.bounces, hops: r.hops, roll: r.roll, run: r.run, side: r.end.x, ...extra });
}
const f1 = n => n.toFixed(1), f0 = n => n.toFixed(0);
function print(table, title) {
  if (json) return;
  console.log(`\n${title}`);
  console.log('  case                                  speed  vh    vv    angle  rpm    bounces (hop yd)          roll   run    side');
  for (const r of rows.filter(r => r.table === table)) console.log(`  ${r.name.padEnd(38)}${f1(r.speed).padStart(5)}  ${f1(r.vh).padStart(4)}  ${f1(r.vv).padStart(4)}  ${f0(r.angle).padStart(4)}°  ${f0(r.rpm).padStart(5)}  ${String(r.bounces).padStart(2)} ${('(' + r.hops.map(f1).join(', ') + ')').padEnd(22)} ${f1(r.roll).padStart(5)}  ${f1(r.run).padStart(5)}  ${r.side.toFixed(2).padStart(6)}`);
}

let jsonOut = null;
if (!spinOnly) {
// 0. what each club brings down (flat, still air): the inputs the cases are built from
const club = {};
for (const c of FULL) { const L = clubLanding(c); club[c.name] = L; const r = land(L, flat, g.FAIRWAY); row('clubs', `${c.name} full, onto fairway (carry ${f0(L.carry)})`, L, r); }
for (const c of FULL) { const r = land(club[c.name], flat, g.GREENS); row('clubs', `${c.name} full, onto green`, club[c.name], r); }
print('clubs', '0. Club landings, flat, still air (state at contact from the real flight)');

// 1-4: the brief's green cases, level green
const cases = {
  'high spinning wedge': club.Wedge,
  'low running wedge': { speed: 14, angle: 22, rpm: 1500 },
  'high spinning mid-iron': club.Iron,
  'low long iron': { speed: 27, angle: 30, rpm: 1800 },
};
for (const [n, inc] of Object.entries(cases)) row('green', n, inc, land(inc, flat, g.GREENS));
print('green', '1-4. The same level green');
// 5: wood onto firm fairway (links firm 1.5) and default
row('wood', '3-wood, default fairway', club['3-Wood'], land(club['3-Wood'], flat, g.FAIRWAY));
row('wood', '3-wood, firm fairway (firm 1.5)', club['3-Wood'], land(club['3-Wood'], flat, g.FAIRWAY, surfaces(1.5)));
row('wood', 'driver, firm fairway (firm 1.5)', club.Hammer, land(club.Hammer, flat, g.FAIRWAY, surfaces(1.5)));
print('wood', '5. Wood onto fairway');
// 6: one incoming state, uphill / level / downhill / side slope (8 %)
for (const [inc, lab] of [[club.Iron, 'iron'], [club.Wedge, 'wedge'], [club['3-Wood'], '3-wood']]) for (const [tn, H] of [['uphill 8 %', grade(0.08)], ['level', flat], ['downhill 8 %', grade(-0.08)], ['side 8 % (falls right)', side(0.08)]]) row('slope', `${lab}: ${tn}`, inc, land(inc, H, g.FAIRWAY));
print('slope', '6. Identical incoming shots, fairway, by slope');
// 7: soft and firm versions of the same surface
for (const [inc, lab] of [[club.Iron, 'iron'], [club['3-Wood'], '3-wood']]) for (const fm of [0.6, 1, 1.5]) row('firm', `${lab}: fairway firm ${fm}`, inc, land(inc, flat, g.FAIRWAY, surfaces(fm)));
for (const [inc, lab] of [[club.Iron, 'iron'], [club.Wedge, 'wedge']]) for (const gf of [0.6, 1, 2, 3.5]) row('firm', `${lab}: green firm ${gf}`, inc, land(inc, flat, g.GREENS, surfaces(1, gf)));
print('firm', '7. Soft and firm versions of the same surface');
// 8: spin sweeps at fixed speed and angle (does backspin act through the impact, not blindly?)
for (const [lab, base, surf] of [['steep 50° 25 m/s, green', { speed: 25, angle: 50 }, g.GREENS], ['steep 50° 25 m/s, fairway', { speed: 25, angle: 50 }, g.FAIRWAY], ['shallow 15° 25 m/s, fairway', { speed: 25, angle: 15 }, g.FAIRWAY], ['chip 35° 9 m/s, green', { speed: 9, angle: 35 }, g.GREENS], ['chip 35° 9 m/s, fairway', { speed: 9, angle: 35 }, g.FAIRWAY]])
  for (const rpm of [0, 1000, 2500, 4000, 6000, 8000]) row('spin', `${lab}, ${rpm} rpm`, { ...base, rpm }, land({ ...base, rpm }, flat, surf));
print('spin', '8. Backspin sweep, everything else fixed');
// 10: descent-angle sweep at fixed speed and spin (does a steeper landing keep less run?)
for (const [lab, surf] of [['green', g.GREENS], ['fairway', g.FAIRWAY]]) for (const ang of [12, 18, 22, 26, 30, 40, 50, 60, 70]) row('angle', `${lab}, 25 m/s, 2500 rpm, ${ang}°`, { speed: 25, angle: ang, rpm: 2500 }, land({ speed: 25, angle: ang, rpm: 2500 }, flat, surf));
print('angle', '10. Descent-angle sweep, everything else fixed');
// 9: club-independence: the same incoming state, launched by each club's begin() (only b.air is overwritten)
const inc = club.Iron, idRows = FULL.map(c => {
  const t = makeTerrain(flat, g.GREENS), s = inc.speed / YD, a = inc.angle * D2R;
  const b = { p: { x: 0, y: R + 1e-3, z: 0 }, v: { x: 0, y: -Math.sin(a) * s, z: Math.cos(a) * s }, rolling: false, landed: false, resting: false, t: 0, lipT: -9, club: c };
  BM.begin(b); b.air = { w: inc.rpm * 2 * Math.PI / 60, ax: -1, az: 0, la: 0 };
  return settle(b, { terrain: t, sp: g.SP, wind: { x: 0, z: 0 } }, t).run;
});
if (!json) console.log(`\n9. The iron's incoming state, with each club set on the ball: run ${idRows.map(f1).join(' / ')} yd (${Math.max(...idRows) - Math.min(...idRows) < 1e-9 ? 'identical' : 'DIFFERS'})`);
if (json) jsonOut = { rows, clubIndependent: Math.max(...idRows) - Math.min(...idRows) < 1e-9 };
}

// 11: spin at landing per club, for the game's decay and alternatives (--spin, --tau=...)
function decaySrc(tau) {
  const line = 'if(air.w)air.w*=Math.exp(-dt/TAU);';
  if (!SRC.includes(line)) throw new Error('spin-decay line not found in index.html');
  if (tau === 'smits') return SRC.replace(line, 'if(air.w)air.w*=Math.exp(-dt*s/(23.8*44.704/YD));');   // tau = 23.8 s at 100 mph air speed, inversely with speed
  return SRC.replace(/const TAU=[\d.]+,/, `const TAU=${+tau},`);
}
function spinTable() {
  const cur = String(g.Aero.TAU), alts = tauArg ? tauArg.split(',').filter(t => t !== cur) : [];
  const out = [];
  for (const tau of [cur, ...alts]) {
    const gg = tau === cur ? g : loadGame(decaySrc(tau));
    for (const c of gg.CLUBS.filter(c => !c.putt)) {
      const L = clubLanding(c, 1, gg), fw = land(L, flat, gg.FAIRWAY, surfaces(1, 1, gg), gg), gr = land(L, flat, gg.GREENS, surfaces(1, 1, gg), gg);
      out.push({ tau: tau === cur ? `${tau} (game)` : tau, club: c.name, stated: c.carry, v0: L.v0 * YD, launchRpm: L.launchRpm, rpm: L.rpm, kept: L.rpm / L.launchRpm, carry: L.carry, hang: L.hang, apex: L.apex, angle: L.angle, speed: L.speed, fairway: fw.run, green: gr.run });
    }
  }
  if (json) return out;
  console.log('\n11. Spin at landing per club, full swing, flat, still air (launch speed re-solved for each club\'s stated carry)');
  console.log('  decay tau   club     stated  v0 m/s  launch rpm  land rpm  kept   carry  hang s  apex yd  land °  land m/s  run fwy  run green');
  for (const r of out) console.log(`  ${r.tau.padEnd(11)} ${r.club.padEnd(8)}${String(r.stated).padStart(6)}  ${f1(r.v0).padStart(6)}  ${f0(r.launchRpm).padStart(10)}  ${f0(r.rpm).padStart(8)}  ${(100 * r.kept).toFixed(0).padStart(3)} %  ${f1(r.carry).padStart(5)}  ${r.hang.toFixed(2).padStart(6)}  ${f1(r.apex).padStart(7)}  ${f1(r.angle).padStart(6)}  ${f1(r.speed).padStart(8)}  ${f1(r.fairway).padStart(7)}  ${f1(r.green).padStart(9)}`);
  return out;
}
const spinRows = spinTable();
if (json) console.log(JSON.stringify(spinOnly ? spinRows : { ...jsonOut, spinAtLanding: spinRows }, null, 1));
