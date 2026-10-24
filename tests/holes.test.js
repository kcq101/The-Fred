// Phase 3: the iconic-hole system.
//  1. the shared pieces on their own: terrain features, the stance model, play profiles
//  2. every hole's declared challenge (hole-checks.js), played through the real terrain, swing, stance and ball physics
// Not covered: trees (no geometry outside the browser), rendering, feel on a phone. See tests/README.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCourse, makeTerrain, runBall, flatShot } = require('./harness');
const { playShot, evaluate, expected, recovery, RECOVERY, CHECKS } = require('./hole-play');

const course = loadCourse();
const g = course.game, SM = g.StanceModel;
const idx = id => course.HOLES.findIndex(h => h.id === id);

// ---------------------------------------------------------------- shared pieces
test('every hole is a spec: id, par, features the registry knows, and a checks entry', () => {
  const ids = new Set();
  for (let i = 0; i < course.HOLES.length; i++) {
    const h = course.HOLES[i];
    assert.ok(h.id && !ids.has(h.id), `hole ${i} has a unique id`); ids.add(h.id);
    assert.doesNotThrow(() => course.prepHole(i), `${h.id} prepares`);
    assert.ok(CHECKS[h.id], `${h.id} declares its challenge in hole-checks.js`);
    assert.ok((CHECKS[h.id].shots || []).length + (CHECKS[h.id].strategies || []).length >= 3, `${h.id} has enough checks to mean something`);
  }
});

test('features: a rise lifts its area and fades out within its edge; an unknown type is refused', () => {
  const i = idx('pebble-8'); course.prepHole(i);
  const hole = course.HOLES[i], saved = hole.features;
  const base = (x, z) => course.H(x, z);
  const far = [60, 120], before = base(...far);
  hole.features = [...saved, { type: 'rise', area: { x: 60, z: 120, rx: 6, rz: 6 }, dh: 4, edge: 5 }];
  course.prepHole(i);
  assert.ok(Math.abs(base(...far) - before - 4) < 1e-9, 'full lift inside the area');
  assert.ok(Math.abs(base(60, 132) - (hole.features = saved, course.prepHole(i), base(60, 132))) < 1e-9, 'nothing beyond the edge');
  hole.features = [...saved, { type: 'volcano' }];
  assert.throws(() => course.prepHole(i), /unknown terrain feature/);
  hole.features = saved; course.prepHole(i);
});

test('features: a cover turns rough into another surface, and leaves fairway alone unless told', () => {
  const i = idx('augusta-13'); course.prepHole(i);
  const pine = course.HOLES[i].features.find(f => f.type === 'cover' && f.surf === 'PINE');
  const [x, z] = pine.area.pts[2];
  assert.equal(course.S(x, z), 7, 'pine straw under the trees');
  assert.equal(course.S(course.centerX(300), 300), g.FAIRWAY, 'fairway is untouched');
});

test('play profile: each hole tunes its own copy of the surfaces, and the next hole starts from the shared defaults', () => {
  course.prepHole(idx('augusta-13'));
  const fast = course.SP[g.GREENS].dec;
  course.prepHole(idx('pebble-8'));
  const pebble = course.SP[g.GREENS].dec;
  const i = idx('sawgrass-17'), hole = course.HOLES[i], saved = hole.play;
  course.prepHole(i);
  assert.ok(fast < pebble && pebble < g.SP[g.GREENS].dec, `green speeds: Augusta ${fast.toFixed(2)} < Pebble ${pebble.toFixed(2)} < default`);
  assert.equal(course.SP[g.GREENS].dec, g.SP[g.GREENS].dec, 'Sawgrass greens roll at the default speed');
  hole.play = { firm: 1.4, greens: { firm: 2 } }; course.prepHole(i);                 // a links-style profile, to prove the knobs work
  assert.ok(course.SP[g.GREENS].bite < g.SP[g.GREENS].bite && course.SP[g.FAIRWAY].bite < g.SP[g.FAIRWAY].bite, 'firm turf: shots bite less');
  assert.ok(course.SP[g.FAIRWAY].rr < g.SP[g.FAIRWAY].rr && course.SP[g.ROUGH].rr < g.SP[g.ROUGH].rr, 'firm turf: the ball rolls on with less friction');
  hole.play = saved; course.prepHole(i);
  assert.equal(course.SP[g.FAIRWAY].bite, g.SP[g.FAIRWAY].bite, 'and putting the profile back restores the defaults');
  for (const k in course.SP) if (course.SP[k].rr == null) assert.ok(course.SP[k].hold <= course.SP[k].dec / g.G + 1e-9, `surface ${k}: hold <= dec/G`);   // rr surfaces (OpenFairway friction): hold is static, not tied to rolling friction
});

test('features: a grid adds its heights smoothly, passes through its nodes, holds its edge values outside, and refuses a ragged one', () => {
  const i = idx('riviera-6'), hole = course.HOLES[i], saved = hole.features;
  course.prepHole(i);
  const at = [[40, 150], [35, 150], [52.5, 162.5], [20, 140], [140, 140]], before = at.map(p => course.H(...p));
  const v = [0, 0, 0, 0, 0, 1, 2, 0, 0, 3, -1, 0, 0, 0, 0, 0];   // 4 x 4, step 10 from (20, 140)
  hole.features = [...saved, { type: 'grid', x0: 20, z0: 140, step: 10, nx: 4, v }];
  course.prepHole(i);
  const d = at.map((p, k) => course.H(...p) - before[k]);
  assert.ok(Math.abs(d[0] - 2) < 1e-9 && Math.abs(d[3]) < 1e-9, `at the nodes it adds exactly their heights (${d[0]}, ${d[3]})`);
  assert.ok(d[1] > 1 && d[1] < 2, `between two nodes it runs between them (${d[1].toFixed(2)})`);
  assert.ok(Math.abs(d[4]) < 1e-9, 'beyond its last column it holds the edge value (0 here)');
  const e = 0.01, s1 = course.H(30 - e, 155) - course.H(30 - 2 * e, 155), s2 = course.H(30 + 2 * e, 155) - course.H(30 + e, 155);
  assert.ok(Math.abs(s1 - s2) < 1e-3, 'no crease where one cell meets the next');
  hole.features = [...saved, { type: 'grid', x0: 0, z0: 0, step: 10, nx: 4, v: [1, 2, 3] }];
  assert.throws(() => course.prepHole(i), /grid/);
  hole.features = saved; course.prepHole(i);
});

test('play profile: hold below 1 lets a ball that stops on a short-grass slope roll back down it; rough keeps its hold', () => {
  const i = idx('pebble-8'), hole = course.HOLES[i], saved = hole.play;
  hole.play = { hold: 0.45 }; course.prepHole(i);
  assert.ok(Math.abs(course.SP[g.FAIRWAY].hold - 0.45 * g.SP[g.FAIRWAY].hold) < 1e-12 && Math.abs(course.SP[g.FRINGE].hold - 0.45 * g.SP[g.FRINGE].hold) < 1e-12, 'fairway and fringe hold less');
  assert.equal(course.SP[g.ROUGH].hold, g.SP[g.ROUGH].hold, 'rough is untouched');
  hole.play = saved; course.prepHole(i);
  assert.equal(course.SP[g.FAIRWAY].hold, g.SP[g.FAIRWAY].hold, 'the next profile starts from the defaults');
  // on Oakmont No. 3 (hold 0.45) an iron landed on the 9-14 % run-off in front of the green rolls back down the hill; at the default hold it sits on the slope
  const oak = idx('oakmont-3'), oh = course.HOLES[oak], op = oh.play;
  const short = { from: [0, 258], club: 'Iron', power: 0.8 };
  course.prepHole(oak); const back = playShot(course, short);
  oh.play = Object.assign({}, op, { hold: 1 }); course.prepHole(oak); const sits = playShot(course, short);
  oh.play = op; course.prepHole(oak);
  assert.ok(back.toPin > sits.toPin + 10, `rolls back: ${back.toPin.toFixed(1)} yd from the pin against ${sits.toPin.toFixed(1)} at the default hold`);
});

test('stance: flat ground changes nothing; putts ignore slopes', () => {
  const flat = SM.read({ x: 0, y: 1, z: 0 }, 0.3);
  const e = SM.effect(g.CLUBS[0], flat);
  assert.deepEqual([e.spin, e.yaw, e.speed, e.needle, e.tag], [0, 0, 1, 1, null]);
  const n = { x: 0.15, y: 0.98, z: 0 }, l = Math.hypot(n.x, n.y); n.x /= l; n.y /= l;
  assert.equal(SM.effect(g.CLUBS[4], SM.read(n, 0)).spin, 0);
});

test('stance: ground falling to the left (ball above the feet) hooks left; falling right slices; uphill plays short; downhill runs', () => {
  const tilt = (gx, gz) => { const l = Math.hypot(gx, 1, gz); return { x: -gx / l, y: 1 / l, z: -gz / l }; };   // normal of a plane rising gx per yard in x
  const iron = g.CLUBS[2];
  const above = SM.effect(iron, SM.read(tilt(-0.1, 0), 0));
  assert.ok(above.spin < 0 && above.yaw > 0 && /ABOVE/.test(above.tag), 'falls toward +x (left): hook, starts left');
  const below = SM.effect(iron, SM.read(tilt(0.1, 0), 0));
  assert.ok(below.spin > 0 && below.yaw < 0 && /BELOW/.test(below.tag), 'slice, starts right');
  const up = SM.effect(iron, SM.read(tilt(0, 0.1), 0)), down = SM.effect(iron, SM.read(tilt(0, -0.1), 0));
  assert.ok(up.speed < 1 && down.speed > 1 && up.needle > 1 && down.needle > 1);
  // the same slope read along a different aim: aiming down the slope makes it a downhill lie instead
  const turned = SM.effect(iron, SM.read(tilt(-0.1, 0), Math.PI / 2));
  assert.ok(turned.speed > 1 && Math.abs(turned.spin) < 1e-9, 'aim down the fall line: downhill, no hook');
  // and it moves a real shot: an iron off a 10% side slope finishes well left of the same shot from flat ground
  const run = n => {
    const T = makeTerrain((x, z) => (Math.abs(z) < 3 ? -0.1 * x : 0), g.FAIRWAY), st = SM.effect(iron, SM.read(n, 0));
    const sp = iron.v0 * st.speed, yaw = st.yaw, v = { x: Math.sin(yaw) * Math.cos(iron.ang) * sp, y: Math.sin(iron.ang) * sp, z: Math.cos(yaw) * Math.cos(iron.ang) * sp };
    const b = { p: { x: 0, y: g.R + 0.02, z: 0 }, v, rolling: false, landed: false, resting: false, t: 0, spin: st.spin, club: iron, lipT: -9 };
    g.BallModel.begin(b); while (!b.resting && b.t < 22) g.BallModel.step(b, g.BallModel.STEP, { terrain: T, sp: g.SP, wind: { x: 0, z: 0 } }); return b.p.x;
  };
  assert.ok(run(tilt(-0.1, 0)) - run({ x: 0, y: 1, z: 0 }) > 10, 'ball above the feet: 10+ yards left');
});

// ---------------------------------------------------------------- phase 4 pieces: surfaces, solid obstacles, crowned greens
test('surfaces: road runs out further than fairway; waste grabs and stops the ball; both obey hold <= dec/G', () => {
  const wedge = g.CLUBS[3], iron = g.CLUBS[2];
  const roll = (club, surf) => flatShot(g, club, club.v0, 0, 0, { x: 0, z: 0 }, surf).roll;
  assert.ok(roll(wedge, g.ROAD) > 1.5 * roll(wedge, g.FAIRWAY), 'a wedge rolls out far more on the road');
  assert.ok(roll(iron, g.ROAD) > roll(iron, g.FAIRWAY));
  assert.ok(roll(iron, g.WASTE) < 0.5 * roll(iron, g.FAIRWAY), 'the waste area stops a ball dead');
  assert.ok(g.SP[g.WASTE].lie < 1 && g.SP[g.ROAD].lie < 1, 'both are worse lies than fairway');
  assert.ok(g.SP[g.WASTE].hold <= g.SP[g.WASTE].dec / g.G + 1e-9);   // road now rolls on OpenFairway's Firm friction; its hold is static
});

test('obstacles: a wall turns back a ball in flight, stops one rolling into it, lets one fly over, and an unknown type is refused', () => {
  const i = idx('standrews-17'); course.prepHole(i);
  const w = course.OBST[0], [ax, az] = w.pts[2], [bx, bz] = w.pts[3];
  const mx = (ax + bx) / 2, mz = (az + bz) / 2, dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l;   // normal pointing away from the green's side
  const side = Math.sign(nz) || 1;
  const ball = (off, y, speed) => ({ p: { x: mx - side * nx * off, y, z: mz - side * nz * off }, v: { x: side * nx * speed, y: 0, z: side * nz * speed } });
  let hits = 0;
  const b1 = ball(2.5, course.H(mx, mz) + 0.8, 12);
  for (let k = 0; k < 60; k++) { b1.p.x += b1.v.x / 120; b1.p.y += 0; b1.p.z += b1.v.z / 120; course.obstacleHit(b1, () => hits++); }
  assert.ok(hits > 0 && (b1.v.x * side * nx + b1.v.z * side * nz) < 3, 'struck and thrown back, speed along the wall normal mostly gone');
  hits = 0;
  const b2 = ball(2.5, course.H(mx, mz) + w.h + 3, 12);                                    // well above the top
  for (let k = 0; k < 60; k++) { b2.p.x += b2.v.x / 120; b2.p.z += b2.v.z / 120; course.obstacleHit(b2, () => hits++); }
  assert.equal(hits, 0, 'a ball above the wall passes over it');
  const hole = course.HOLES[i], saved = hole.obstacles;
  hole.obstacles = [{ type: 'moat' }];
  assert.throws(() => course.prepHole(i), /unknown obstacle/);
  hole.obstacles = saved; course.prepHole(i);
});

test('obstacles: the collide hook runs on the roll, so a ball rolling into a wall is stopped by it', () => {
  const T = makeTerrain(() => 0, g.FAIRWAY);
  let calls = 0;
  const wallAt = 20;
  const collide = b => { calls++; if (b.p.z > wallAt) { b.p.z = wallAt; b.v.z = 0; b.v.x = 0; } };
  const r = runBall(g, T, { start: { x: 0, z: 0 }, v: { x: 0, y: 6, z: 30 }, club: g.CLUBS[3], collide });
  assert.ok(calls > 50, 'called every step, in the air and on the ground');
  assert.ok(r.ball.p.z <= wallAt + 1e-9, 'the roll never passes the wall');
});

test('features: a negative hollow is a crown; with `flat` it is a plateau, level on top with its fall at the edges', () => {
  const i = idx('pinehurst-5'), hole = course.HOLES[i], saved = hole.features;
  const f = saved.find(f => f.type === 'hollow' && f.depth < 0 && f.flat);
  assert.ok(f, 'Pinehurst 5 builds its green as a plateau');
  const A = f.area, at = t => [A.x + t * A.rx * Math.cos(A.rot), A.z + t * A.rx * Math.sin(A.rot)];   // along the long axis, t = share of the radius
  const shape = feats => { hole.features = feats; course.prepHole(i); return [0, 0.3, 0.55, 0.8, 1.0].map(t => course.H(...at(t))); };
  const others = saved.filter(g => g !== f);
  const without = shape(others), plateau = shape(saved), dome = shape([...others, { ...f, flat: 0 }]);
  hole.features = saved; course.prepHole(i);
  const lift = k => arr => arr[k] - without[k];
  assert.ok(Math.abs(lift(0)(plateau) - lift(2)(plateau)) < 0.02, 'level from the middle to past halfway out');
  assert.ok(lift(0)(plateau) - lift(4)(plateau) > 0.8 * -f.depth, 'and the whole drop happens in the outer ring');
  assert.ok(lift(0)(dome) - lift(2)(dome) > 0.25 * -f.depth, 'whereas flat:0 (the old default) is a dome, already falling by halfway');
  // and the falloff sheds a ball: one left resting on it slides off the green
  course.prepHole(i);
  const [x0, z0] = at(0.85), T = course.terrain;
  const b = { p: { x: x0, y: course.H(x0, z0) + g.R, z: z0 }, v: { x: 0, y: 0, z: 0 }, rolling: true, landed: true, resting: false, t: 0, spin: 0, club: g.CLUBS[3], lipT: -9, rollT: 0, stats: { carry: 0, bounces: 0 }, launch: { x: x0, z: z0 } };
  while (b.t < 12 && !b.resting) g.BallModel.step(b, g.BallModel.STEP, { terrain: T, sp: course.SP, wind: { x: 0, z: 0 } });
  assert.notEqual(course.S(b.p.x, b.p.z), g.GREENS, `a ball on the falloff rolls off the green (stopped at ${b.p.x.toFixed(1)}, ${b.p.z.toFixed(1)})`);
});

// ---------------------------------------------------------------- traced outlines (greens and bunkers with their real shape)
test('outlines: a traced polygon reads like an ellipse of the same shape: 1 on the edge, 0 at the deepest point, growing outside by 1 per ro yards', () => {
  const E = { x: 3, z: 40, rx: 9, rz: 5, rot: 0.4 }, c = Math.cos(E.rot), s = Math.sin(E.rot);
  const pts = Array.from({ length: 96 }, (_, i) => { const a = i / 96 * 2 * Math.PI, u = Math.cos(a) * E.rx, v = Math.sin(a) * E.rz; return [E.x + u * c - v * s, E.z + u * s + v * c]; });
  const P = course.prepShape({ pts }), Q = course.prepShape({ ...E });
  assert.ok(Math.hypot(P.x - E.x, P.z - E.z) < 0.05, 'centroid at the middle');
  assert.ok(Math.abs(P.ri - E.rz) < 0.3, `deepest point ${P.ri.toFixed(2)} yd in: the short radius`);
  assert.ok(Math.abs(P.ro - Math.sqrt(E.rx * E.rz)) < 0.1, 'ro: the radius of a circle of the same area');
  for (const [x, z] of pts) assert.ok(Math.abs(course.ell(x, z, P) - 1) < 1e-6, 'exactly 1 on the outline');
  assert.ok(course.ell(E.x, E.z, P) < 0.05, '~0 at the middle');
  for (let k = 0; k < 24; k++) {              // inside and outside agree with the ellipse on which side of 0.55, 1, 1.2 and 1.6 a point is (the thresholds the rules use)
    const a = k / 24 * 2 * Math.PI;
    for (const t of [0.3, 0.8, 0.97, 1.03, 1.1, 1.4, 2]) {
      const u = Math.cos(a) * E.rx * t, v = Math.sin(a) * E.rz * t, x = E.x + u * c - v * s, z = E.z + u * s + v * c, e = course.ell(x, z, Q), p = course.ell(x, z, P);
      assert.equal(p < 1, e < 1, `inside/outside at t=${t}`);
      if (t >= 1.03) assert.ok(p > 1, 'outside is > 1');
    }
  }
  assert.ok(course.ell(E.x + 60, E.z, P) > 2.5, 'far away is far (the quick box test)');
  assert.throws(() => course.prepShape({ pts: [[0, 0], [1, 1]] }), /at least 3 points/);
});

test('outlines: on Riviera No. 6 the traced green and bunkers are what S() and H() play: sand inside each outline, the green inside its own, fringe in a ring, bunkers dug in', () => {
  const i = idx('riviera-6'), hole = course.HOLES[i]; course.prepHole(i);
  assert.ok(hole.green.pts && hole.bunkers.every(b => b.pts), 'the hole uses traced outlines (docs/holes/trace/riviera-6.json)');
  const inward = (P, j, d) => {                     // a point d yards inside the outline, off vertex j (outlines are counter-clockwise in x,z)
    const a = P[(j - 1 + P.length) % P.length], b = P[(j + 1) % P.length], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz);
    return [P[j][0] - tz / l * d, P[j][1] + tx / l * d];
  };
  for (const [k, b] of course.BUNKERS.entries()) {
    let n = 0;
    for (let x = b.box.x0 - 1; x <= b.box.x1 + 1; x += 0.2) for (let z = b.box.z0 - 1; z <= b.box.z1 + 1; z += 0.2) {
      const sd = course.sdPoly(x, z, b.pts);            // yards inside (+) or outside (-) the traced outline
      if (sd > 0.1 * b.ri + 0.05) { assert.equal(course.S(x, z), g.SAND, `bunker ${k}: (${x.toFixed(1)}, ${z.toFixed(1)}) inside the outline is sand`); n++; }
      else if (sd < -0.05 && !course.BUNKERS.some(o => o !== b && course.ell(x, z, o) < 1)) assert.notEqual(course.S(x, z), g.SAND, `bunker ${k}: (${x.toFixed(1)}, ${z.toFixed(1)}) outside it is not`);
    }
    assert.ok(n >= 50, `bunker ${k}: ${n} sand points`);
    let floor = Infinity; for (let x = b.box.x0; x <= b.box.x1; x += 0.25) for (let z = b.box.z0; z <= b.box.z1; z += 0.25) if (course.S(x, z) === g.SAND) floor = Math.min(floor, course.H(x, z));
    const rim = b.pts.reduce((a, [x, z]) => a + course.H(x, z), 0) / b.pts.length;
    assert.ok(rim - floor > 0.8 * b.depth, `bunker ${k} is dug in: its floor sits ${(rim - floor).toFixed(2)} yd below its rim (depth ${b.depth})`);
  }
  const G = course.GREEN;
  let greens = 0, fringe = 0;
  for (let j = 0; j < G.pts.length; j += 3) {
    const [xi, zi] = inward(G.pts, j, 0.4), [xf, zf] = inward(G.pts, j, -0.1 * G.ro);
    if (course.BUNKERS.some(b => course.ell(xi, zi, b) < 1.05 || course.ell(xf, zf, b) < 1.05)) continue;      // a bunker owns that spot
    assert.equal(course.S(xi, zi), g.GREENS, `inside the green at vertex ${j}`); greens++;
    assert.equal(course.S(xf, zf), g.FRINGE, `a collar ${(0.1 * G.ro).toFixed(1)} yd outside it`); fringe++;
  }
  assert.ok(greens > 15 && fringe > 15, `${greens} green and ${fringe} fringe points checked`);
  assert.equal(course.S(course.PIN.x, course.PIN.z), g.GREENS, 'the pin is on the putting surface');
});

test('hole checks: a per-strategy lieAdd changes what a lie costs in the comparison (test-only knob)', () => {
  const i = idx('standrews-17'); course.prepHole(i);
  const shot = { club: 'Iron', at: [8, 415] };
  const a = evaluate(course, shot, 0.55, 9), b = evaluate(course, shot, 0.55, 9, { SAND: 5 });
  assert.ok(b.score >= a.score && (a.surfs.SAND ? b.score > a.score : true));
});

// ---------------------------------------------------------------- the baseline's recovery-difficulty term (tests/hole-play.js)
// A stand-in course for the properties: height function `h`, a pin at (0,50), a green of radius 10 centred at (0, gz).
const stub = (h, gz = 50) => ({ H: h, PIN: { x: 0, z: 50 }, GREEN: { x: 0, z: gz, rx: 10, rz: 10, rot: 0, c: 1, s: 0 }, ell: course.ell });
const flat = () => 0;

test('recovery: nothing on the green, nothing beyond the short game, nothing for an open approach up to an elevated green', () => {
  const c = stub(flat);
  assert.equal(recovery(c, { x: 0, z: 45 }, 'GREENS'), 0, 'a ball on the green is the putt table\'s');
  assert.equal(recovery(stub((x, z) => z > 20 ? 6 : 0), { x: 0, z: 50 - RECOVERY.far }, 'ROUGH'), 0, 'at `far` yards from the pin the next shot is a full shot');
  assert.equal(recovery(stub((x, z) => z > 40 ? 3 : 0), { x: 0, z: 0 }, 'FAIRWAY'), 0, 'a fairway approach 40 yd from a 3 yd step has no face to climb');
  assert.equal(recovery(c, { x: 0, z: 30 }, 'ROUGH'), 0, 'flat ground, plenty of green: nothing to charge');
  assert.equal(recovery(c, null, 'ROUGH'), 0, 'no position, no charge');
});

test('recovery: a face in front of the ball costs beyond the allowance, in proportion, up to the cap', () => {
  const wall = hgt => stub((x, z) => z > 33 ? hgt : 0);                       // a ball at (0,30), 20 yd from the pin, with a face 3 yd ahead
  const ball = { x: 0, z: 30 }, at = hgt => recovery(wall(hgt), ball, 'ROUGH');
  assert.equal(at(RECOVERY.allow), 0, 'a face within the allowance (a normal bunker lip) is already in the lie charge');
  assert.ok(Math.abs(at(RECOVERY.allow + 1) - RECOVERY.UP) < 1e-9, 'one yard past the allowance costs UP strokes');
  assert.ok(at(RECOVERY.allow + 2) > at(RECOVERY.allow + 1), 'higher faces cost more');
  assert.equal(at(30), RECOVERY.cap, 'and the charge stops at the cap');
});

test('recovery: fades with distance from the pin, from full inside `near` to nothing at `far`', () => {
  const at = d => { const zb = 50 - d; return recovery(stub((x, z) => z > zb + 3 ? 3 : 0), { x: 0, z: zb }, 'ROUGH'); };    // same 3 yd face, ball d yd from the pin
  assert.ok(at(20) > 0 && Math.abs(at(20) - at(RECOVERY.near)) < 1e-9, 'full weight inside `near`');
  assert.ok(at(RECOVERY.near) > at(65) && at(65) > at(80) && at(80) > 0, 'falling between near and far');
  assert.equal(at(RECOVERY.far), 0);
});

test('recovery: short-sided means a pin near the edge the ball is on; it needs a ball close to that edge and is not charged on the fringe', () => {
  const nearEdge = stub(flat, 56), centred = stub(flat, 50);                 // the pin 6 yd inside the front edge vs in the middle of the green
  const ball = { x: 0, z: 40 };
  assert.ok(recovery(nearEdge, ball, 'ROUGH') > 0, 'little green to land on: a charge');
  assert.equal(recovery(centred, ball, 'ROUGH'), 0, 'the same ball with the pin in the middle of the green: none');
  assert.equal(recovery(nearEdge, ball, 'FRINGE'), 0, 'on the fringe you can putt it');
  assert.ok(recovery(nearEdge, ball, 'ROUGH') > recovery(nearEdge, { x: 0, z: 25 }, 'ROUGH'), 'a ball further from the edge pays less');
  assert.ok(recovery(nearEdge, ball, 'ROUGH') < RECOVERY.SHORT + 1e-9, 'and it never exceeds SHORT on its own');
});

test('recovery: on the real holes, the Road Hole bunker pays the most, ordinary bunkers and fairway lay-ups almost nothing', () => {
  course.prepHole(idx('standrews-17'));
  const road = course.BUNKERS.find(b => b.depth > 2);
  assert.ok(recovery(course, { x: road.x, z: road.z }, 'SAND') >= 0.7 * RECOVERY.cap, 'a ball in the pot bunker whose face is the whole story (0.75 of the cap since the lidar rebuild: a 5 m pot, not the old 18 yd bowl)');
  course.prepHole(idx('pebble-8'));
  const bunker = (x, z) => course.BUNKERS.find(b => b.x === x && b.z === z);
  const near = (x, z) => course.BUNKERS.reduce((a, b) => Math.hypot(b.x - x, b.z - z) < Math.hypot(a.x - x, a.z - z) ? b : a);
  const beside = near(-33, 377), front = near(3.8, 349.6);                     // both traced, lidar depths (0.43 and 0.36), within 25 yd of the pin
  const rec = b => recovery(course, { x: b.x, z: b.z }, 'SAND');
  // the lidar sets both about level with the green (no knoll above them, as the game's design had), so neither has a face to climb: docs/holes/pebble-8.md §6
  assert.ok(rec(beside) < 0.2 && rec(front) < 0.2, 'shallow bunkers level with the green are within the lie charge');
  course.prepHole(idx('pinehurst-5'));
  assert.equal(recovery(course, { x: 24, z: 417 }, 'FAIRWAY'), 0, 'the lay-up to the elevated plateau is an ordinary wedge');
});

test('recovery: expected() adds it for balls off the green, opts.recovery=false removes it, and evaluate() reports the mean charge', () => {
  course.prepHole(idx('standrews-17'));
  const shot = { from: [0, 311], club: 'Iron', at: [28, 436] };
  const on = evaluate(course, shot, 0.55, 9), off = evaluate(course, shot, 0.55, 9, null, { recovery: false });
  assert.ok(on.recovery > 0 && off.recovery === 0);
  assert.equal(on.hazard, 0);
  assert.ok(Math.abs((on.score - off.score) - on.recovery) < 1e-9, 'with no water or holed balls the score differs by exactly the mean charge');
  const r = { end: 'rest', surf: 'SAND', p: { x: 32.5, z: 424.5 }, toPin: Math.hypot(32.5 - course.PIN.x, 424.5 - course.PIN.z) };   // in the Road Hole bunker
  assert.ok(expected(course, r, { x: 0, z: 301 }) > expected(course, r, { x: 0, z: 301 }, undefined, { recovery: false }));
  assert.equal(expected(course, { ...r, surf: 'GREENS' }, { x: 0, z: 301 }), expected(course, { ...r, surf: 'GREENS' }, { x: 0, z: 301 }, undefined, { recovery: false }));
});

test('rolling start: a ball landing on a steep slope never rolls faster than the model\'s speed cap', () => {
  const T = makeTerrain((x, z) => 0.9 * z, g.FAIRWAY);                                        // a 45-degree-ish ramp
  const r = runBall(g, T, { start: { x: 0, z: 0 }, v: { x: 0, y: 25, z: 25 }, club: g.CLUBS[0] });
  assert.ok(r.inv.maxSpeedGround <= g.BallModel.V_MAX + 1e-6, `${r.inv.maxSpeedGround}`);
});

// ---------------------------------------------------------------- each hole's declared challenge
const SKILL = { sharp: 0.2, shaky: 0.55 };
for (const [id, spec] of Object.entries(CHECKS)) {
  for (const c of spec.shots || []) {
    test(`${id}: ${c.name}`, () => {
      course.prepHole(idx(id));
      const r = playShot(course, c.shot), e = c.expect, where = `${r.end} on ${r.surf} at (${r.p.x.toFixed(1)}, ${r.p.z.toFixed(1)}), ${r.toPin.toFixed(1)} yd from the pin`;
      if (e.end) assert.equal(r.end === 'holed' ? 'rest' : r.end, e.end, where);
      if (e.surf) assert.ok(e.surf.includes(r.surf), where);
      if (e.maxToPin != null) assert.ok(r.toPin <= e.maxToPin, where);
      if (e.minToPin != null) assert.ok(r.toPin >= e.minToPin, where);
      if (e.stance) assert.equal(r.stance.tag, e.stance);
      if (e.wall != null) assert.equal(r.hits.wall > 0, e.wall, `${where} (wall hits: ${r.hits.wall})`);
    });
  }
  for (const s of spec.strategies || []) {
    test(`${id}: strategy — ${s.name}`, () => {
      course.prepHole(idx(id));
      const r = {};
      for (const p of s.plans) r[p.name] = Object.fromEntries(Object.entries(SKILL).map(([k, sp]) => [k, evaluate(course, p.shot, sp, 21, s.lieAdd)]));
      const table = Object.entries(r).map(([n, v]) => `${n}: ` + Object.entries(v).map(([k, o]) => `${k} hazard ${(o.hazard * 100).toFixed(0)}% score ${o.score.toFixed(2)}`).join(', ')).join(' | ');
      for (const [why, ok] of s.expect) assert.ok(ok(r), `${why}\n    ${table}`);
    });
  }
}
