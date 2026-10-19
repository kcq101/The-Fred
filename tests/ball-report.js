// Before/after tables for Phase 2. Run: node tests/ball-report.js
// "before" = the frozen pre-Phase-2 physics (tests/legacy-ball.js); "after" = the BallModel in index.html. Same terrain, same launch.
const { loadGame, loadCourse, makeTerrain, runBall, mulberry32 } = require('./harness');
const { legacyShot } = require('./legacy-ball');
const g = loadGame(), { SP, R, BallModel: BM } = g;
const full = g.CLUBS.filter(c => !c.putt);
const F = (x, w = 6) => (+x).toFixed(1).padStart(w);
const launch = (c, p = 1, yaw = 0) => { const s = c.v0 * Math.sqrt(p); return { x: Math.sin(yaw) * Math.cos(c.ang) * s, y: Math.sin(c.ang) * s, z: Math.cos(yaw) * Math.cos(c.ang) * s }; };
const after = (c, t, p = 1, wind) => runBall(g, t, { v: launch(c, p), club: c, wind, maxT: 40 });
const flat = s => makeTerrain(() => 0, s);

console.log('FLAT GROUND, full power, still air, perfect contact (yards)');
console.log('surface   club     | before: carry roll total t   | after: carry roll total t  bounces');
for (const [name, s] of [['fairway', g.FAIRWAY], ['rough', g.ROUGH], ['sand', g.SAND], ['green', g.GREENS]]) for (const c of full) {
  const o = legacyShot(g, flat(s), c, c.v0), n = after(c, flat(s));
  console.log(name.padEnd(9), c.name.padEnd(8), '|', F(o.carry), F(o.roll), F(o.total), F(o.t, 5) + 's |', F(n.summary.carry), F(n.summary.roll), F(n.summary.total), F(n.t, 5) + 's', n.summary.bounces, n.resting ? '' : 'NOT AT REST');
}
console.log('\nSHORT WEDGE SHOTS on fairway (roll, yards)');
for (const p of [0.05, 0.1, 0.25, 0.5]) { const c = g.CLUBS[3], o = legacyShot(g, flat(g.FAIRWAY), c, c.v0 * Math.sqrt(p)), n = after(c, flat(g.FAIRWAY), p); console.log('power', p, '| before roll', F(o.roll), '| after carry', F(n.summary.carry), 'roll', F(n.summary.roll), n.summary.bounces + ' bounces'); }

console.log('\nSLOPES, fairway, grade starts at z=Z0 (carry / roll / total, yards). Negative grade = downhill.');
for (const [c, z0] of [[g.CLUBS[0], 120], [g.CLUBS[2], 60], [g.CLUBS[3], 30]]) for (const s of [-0.15, -0.08, 0, 0.08, 0.15]) {
  const t = makeTerrain((x, z) => s * Math.max(0, z - z0), g.FAIRWAY), o = legacyShot(g, t, c, c.v0), n = after(c, t);
  console.log(c.name.padEnd(7), ('grade ' + s.toFixed(2)).padEnd(12), '| before', F(o.carry), F(o.roll), F(o.total), F(o.t, 5) + 's | after', F(n.summary.carry), F(n.summary.roll), F(n.summary.total), F(n.t, 5) + 's');
}

console.log('\nSLOPE THAT CANNOT HOLD A BALL (bank, Hammer, grade 0.3 from z=120): old model vs new');
{ const t = makeTerrain((x, z) => 0.3 * Math.max(0, z - 120), g.FAIRWAY), c = g.CLUBS[0], o = legacyShot(g, t, c, c.v0), n = after(c, t);
  console.log('before: total', F(o.total), 'rest', o.resting, F(o.t, 5) + 's | after: total', F(n.summary.total), 'rest', n.resting, F(n.t, 5) + 's'); }

console.log('\nREAL HOLES: 600 seeded random shots per hole (random lie, club, power, aim, wind) on the real terrain, new model');
{
  const course = loadCourse(), rng = mulberry32(7), W = 0.4889;
  for (let hi = 0; hi < course.HOLES.length; hi++) {
    course.prepHole(hi); let n = 0, rest = 0, maxT = 0, sumT = 0, minClear = Infinity, hz = 0;
    while (n < 600) {
      const club = full[Math.floor(rng() * 4)]; let sx = 0, sz = 0;
      if (rng() < 0.4) { sz = rng() * (course.PIN.z - 30); sx = course.centerX(sz) + (rng() - 0.5) * 50; }
      if (course.S(sx, sz) === g.WATER) continue;
      const aim = Math.atan2(course.PIN.x - sx, course.PIN.z - sz) + (rng() - 0.5) * 0.7, sp = club.v0 * Math.sqrt(0.15 + 0.85 * rng()) * g.lieMult(course.S(sx, sz), club), ws = (3 + rng() * 11) * W, wy = rng() * 6.283;
      const r = runBall(g, course.terrain, { start: { x: sx, z: sz }, v: { x: Math.sin(aim) * Math.cos(club.ang) * sp, y: Math.sin(club.ang) * sp, z: Math.cos(aim) * Math.cos(club.ang) * sp }, club, wind: { x: Math.sin(wy) * ws, z: Math.cos(wy) * ws }, dive: (b, T) => T.S(b.p.x, b.p.z) === g.WATER && b.p.y - R <= T.H(b.p.x, b.p.z) + 0.05 });
      n++; if (r.resting) rest++; else if (r.inv.exit === 'hazard') hz++; maxT = Math.max(maxT, r.t); sumT += r.t; minClear = Math.min(minClear, r.inv.minClear);
    }
    console.log('hole', hi + 1, '| at rest', rest, '| into water', hz, '| other', n - rest - hz, '| mean time', F(sumT / n, 4) + 's', 'max', F(maxT, 5) + 's', '| lowest clearance above ground', minClear.toFixed(3), 'yd');
  }
}

console.log('\nCPU COST (Node on this machine, NOT a phone): aiming-arc trace and a full shot');
{
  const c = g.CLUBS[0], p = { x: 0, y: R, z: 0 }, v = launch(c); let t0 = process.hrtime.bigint(); const N = 200;
  for (let i = 0; i < N; i++) BM.trace({ ...p }, { ...v }, 0, BM.NO_WIND, () => 0, null, 1);
  console.log('trace (driver):', (Number(process.hrtime.bigint() - t0) / 1e6 / N).toFixed(3), 'ms per call');
  t0 = process.hrtime.bigint(); for (let i = 0; i < 50; i++) after(c, flat(g.FAIRWAY));
  console.log('full shot to rest (driver, flat):', (Number(process.hrtime.bigint() - t0) / 1e6 / 50).toFixed(2), 'ms per shot (~', (after(c, flat(g.FAIRWAY)).t * 240).toFixed(0), 'fixed steps)');
}
