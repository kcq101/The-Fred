// Phase 3: the iconic-hole system.
//  1. the shared pieces on their own: terrain features, the stance model, play profiles
//  2. every hole's declared challenge (hole-checks.js), played through the real terrain, swing, stance and ball physics
// Not covered: trees (no geometry outside the browser), rendering, feel on a phone. See tests/README.md.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCourse, makeTerrain } = require('./harness');
const { playShot, evaluate, CHECKS } = require('./hole-play');

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
  hole.play = saved; course.prepHole(i);
  assert.equal(course.SP[g.FAIRWAY].bite, g.SP[g.FAIRWAY].bite, 'and putting the profile back restores the defaults');
  for (const k in course.SP) assert.ok(course.SP[k].hold <= course.SP[k].dec / g.G + 1e-9, `surface ${k}: hold <= dec/G`);
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
    });
  }
  for (const s of spec.strategies || []) {
    test(`${id}: strategy — ${s.name}`, () => {
      course.prepHole(idx(id));
      const r = {};
      for (const p of s.plans) r[p.name] = Object.fromEntries(Object.entries(SKILL).map(([k, sp]) => [k, evaluate(course, p.shot, sp)]));
      const table = Object.entries(r).map(([n, v]) => `${n}: ` + Object.entries(v).map(([k, o]) => `${k} hazard ${(o.hazard * 100).toFixed(0)}% score ${o.score.toFixed(2)}`).join(', ')).join(' | ');
      for (const [why, ok] of s.expect) assert.ok(ok(r), `${why}\n    ${table}`);
    });
  }
}
