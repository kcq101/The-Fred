// Plays shots the way a player does in the game, on a hole's REAL terrain, through the game's own SwingModel, StanceModel and BallModel.
// Used by holes.test.js (validation), hole-report.js (before/after) and hole-map.js (pictures).
//
// A shot:  { from: 'tee' | [x,z],  club: 'Hammer'|'3-Wood'|'Iron'|'Wedge',  at: 'pin' | [x,z],
//            power: 0..1  (how far the player pulls back)   -- or leave it out to pull until the aiming arc lands on `at`, as a player would,
//            offset: -1..1 (where the needle was on release; 0 = dead center), shape: -1..1 (draw .. fade pull),
//            wind: { mph, dir: 'head'|'tail'|'left'|'right' } (blowing toward; relative to the aim line) }
// Same as the game: the arc shows still-air flight from the real lie (lie penalty, stance pull and all), the needle then costs distance and line,
// water ends the shot when the ball reaches the waterline, leaving the hole's box or coming to rest in one of its `ob` areas is out of bounds. Walls (the hole's `obstacles`) stop the ball in
// flight and on the roll, as in the game; the result's `hits.wall` counts the times it struck one. Not modelled: trees (no geometry here).
const { loadCourse } = require('./harness');
const CHECKS = require('./hole-checks');

function resolvePoint(course, p) {
  if (p === 'tee') return { x: 0, z: 0 };
  if (p === 'pin') return { x: course.PIN.x, z: course.PIN.z };
  if (Array.isArray(p)) return { x: p[0], z: p[1] };
  return p;
}

function setup(course, shot) {
  const g = course.game, SP = course.SP || g.SP;
  const club = g.CLUBS.find(c => c.name === (shot.club || 'Iron'));
  if (!club) throw new Error('no club ' + shot.club);
  const from = resolvePoint(course, shot.from || 'tee'), at = resolvePoint(course, shot.at || 'pin');
  const aim = Math.atan2(at.x - from.x, at.z - from.z);
  const lie = course.S(from.x, from.z);
  const play = (course.HOLE && course.HOLE.play) || {};
  const st = g.StanceModel ? g.StanceModel.effect(club, g.StanceModel.read(course.normal(from.x, from.z), aim), play.stance ?? 1)
    : { spin: 0, yaw: 0, speed: 1, needle: 1, tag: null };
  const hits = { wall: 0 };
  const env = { terrain: course.terrain, sp: SP, wind: { x: 0, z: 0 }, collide: b => course.obstacleHit(b, () => hits.wall++) };
  const base = club.v0 * g.lieMult(lie, club) * st.speed;              // full-pull launch speed from this lie and stance
  return { g, SP, club, from, at, aim, lie, st, env, base, hits };
}

// still-air flight along the arc (as drawn in the game): where it first touches the ground
function arcLand(course, s, speed, yaw, spin) {
  const g = s.g, c = s.club, R = g.R;
  const p = { x: s.from.x, y: course.H(s.from.x, s.from.z) + R + 0.02, z: s.from.z };
  const v = { x: Math.sin(yaw) * Math.cos(c.ang) * speed, y: Math.sin(c.ang) * speed, z: Math.cos(yaw) * Math.cos(c.ang) * speed };
  return g.BallModel.trace(p, v, spin, g.BallModel.NO_WIND, course.H, null, 1, c);
}
// the game's shapeYaw: a draw/fade starts off line so that it curves back to land on the aim line
function shapeYaw(course, s, speed, spin) {
  if (!spin) return 0;
  const lat = y => { const l = arcLand(course, s, speed, s.aim + y, spin); if (!l) return 0; return (l.x - s.from.x) * Math.cos(s.aim) - (l.z - s.from.z) * Math.sin(s.aim); };
  let y0 = 0, f0 = lat(0), y1 = spin > 0 ? 0.04 : -0.04, f1 = lat(y1);
  for (let i = 0; i < 4 && Math.abs(f1) > 0.3 && f1 !== f0; i++) { const y2 = y1 - f1 * (y1 - y0) / (f1 - f0); y0 = y1; f0 = f1; y1 = Math.max(-0.5, Math.min(0.5, y2)); f1 = lat(y1); }
  return y1;
}
// the pull a player would choose: the arc's landing spot as close as possible to the target distance (bisection on power)
function powerFor(course, s, spinShape) {
  const want = Math.hypot(s.at.x - s.from.x, s.at.z - s.from.z);
  let lo = 0.04, hi = 1;
  const dist = pw => { const sp = s.base * Math.sqrt(pw), y = shapeYaw(course, s, sp, spinShape) + s.st.yaw, l = arcLand(course, s, sp, s.aim + y, spinShape + s.st.spin); return l ? Math.hypot(l.x - s.from.x, l.z - s.from.z) : 0; };
  if (dist(1) <= want) return 1;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; dist(m) < want ? lo = m : hi = m; }
  return (lo + hi) / 2;
}

function playShot(course, shot, { trace = false } = {}) {
  const s = setup(course, shot), g = s.g, c = s.club, BM = g.BallModel, R = g.R;
  const spinShape = Math.abs(shot.shape || 0) < 0.08 ? 0 : (shot.shape || 0) * c.shape;
  const power = shot.power ?? powerFor(course, s, spinShape);
  const sw = g.SwingModel.resolve(c, shot.offset || 0, () => 0.5);     // the needle, minus the small random jitter
  const speed = s.base * Math.sqrt(power) * sw.speedMult;
  const yaw = s.aim + shapeYaw(course, s, speed, spinShape) + s.st.yaw + sw.yawErr;
  if (shot.wind) {
    const w = shot.wind, a = s.aim + ({ head: Math.PI, tail: 0, left: Math.PI / 2, right: -Math.PI / 2 }[w.dir] ?? 0), m = w.mph * 0.4889 * (((course.HOLE && course.HOLE.play) || {}).windPush || 1);
    s.env.wind = { x: Math.sin(a) * m, z: Math.cos(a) * m };
  }
  const b = { p: { x: s.from.x, y: course.H(s.from.x, s.from.z) + R + 0.02, z: s.from.z },
    v: { x: Math.sin(yaw) * Math.cos(c.ang) * speed, y: Math.sin(c.ang) * speed, z: Math.cos(yaw) * Math.cos(c.ang) * speed },
    rolling: false, landed: false, resting: false, t: 0, spin: spinShape + s.st.spin + sw.spinErr, club: c, lipT: -9 };
  BM.begin(b);
  const bb = course.HOLE.bbox, path = [];
  let end = null, first = null, k = 0;
  while (b.t < BM.MAX_T && !b.resting) {
    const was = b.landed;
    BM.step(b, BM.STEP, s.env);
    if (!was && b.landed) first = { x: b.p.x, z: b.p.z };
    if (trace && (k++ % 12 === 0)) path.push({ x: b.p.x, z: b.p.z });
    const p = b.p;
    if (course.BODIES.some(bd => p.y - R <= bd.level + 0.02 && bd.sd(p.x, p.z) > 0)) { end = 'water'; break; }
    if ((p.x < bb.x0 + 3 || p.x > bb.x1 - 3 || p.z < bb.z0 + 3 || p.z > bb.z1 - 3) && !course.BODIES.some(bd => bd.sd(p.x, p.z) > 0)) { end = 'oob'; break; }
    const dp = Math.hypot(p.x - course.PIN.x, p.z - course.PIN.z);
    if (dp < 0.17 && b.landed && Math.hypot(b.v.x, b.v.z) < 5.5) { end = 'holed'; break; }
  }
  end = end || 'rest';
  if (end === 'rest' && course.inOB(b.p.x, b.p.z)) end = 'oob';   // at rest in a hole's out-of-bounds area (its `ob`): stroke and distance
  const surf = course.S(b.p.x, b.p.z);
  const names = ['TEE', 'FAIRWAY', 'ROUGH', 'FRINGE', 'GREENS', 'SAND', 'WATER', 'PINE', 'ROAD', 'WASTE', 'PATH', 'LAWN'];
  return { end, surf: names[surf], hits: s.hits, p: { x: b.p.x, z: b.p.z }, first, path, power, stance: s.st,
    toPin: Math.hypot(b.p.x - course.PIN.x, b.p.z - course.PIN.z), carry: b.stats.carry, from: s.from };
}

// Expected strokes to hole out from a spot, after the shot (a simplified tour baseline, for comparing strategies; not a rating of the player).
const BASE = [[0, 1], [10, 2.18], [20, 2.4], [50, 2.6], [100, 2.8], [150, 2.98], [200, 3.19], [250, 3.45], [300, 3.71], [400, 3.99], [500, 4.4], [650, 4.9]];
const PUTT = [[0, 1], [1, 1.04], [3.3, 1.6], [6.7, 1.87], [13.3, 2.1], [30, 2.3]];   // yards on the green
const interp = (T, d) => { for (let i = 1; i < T.length; i++) if (d <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (d - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[T.length - 1][1]; };
const LIE_ADD = { FAIRWAY: 0, TEE: 0, FRINGE: 0, ROUGH: 0.18, PINE: 0.3, SAND: 0.35, ROAD: 0.4, WASTE: 0.3, PATH: 0.3, LAWN: 0 };

// Recovery difficulty: how hard the NEXT shot is, from where a ball rests, beyond what its lie (LIE_ADD) already charges.
// A distance-only baseline scores a ball 15 yd off the green the same whether it sits on a flat apron or at the foot of a steep falloff, in a deep
// pot bunker, or short-sided with the pin tucked behind a bank. These two measures are read off the hole's real terrain, so no hole needs its own
// per-hole lie costs (the old `lieAdd` hack):
//   up     the face the ball has to climb: the highest ground within `window` yd along the line to the pin, above the ball (a bunker lip, a falloff,
//          a shaved bank: a lie below the green edge), less `allow` yd, since a normal bunker lip (0.9 deep + 0.25 lip) is already in the lie charge.
//          Only the local face counts: an ordinary approach up to an elevated green from open fairway has none, and the distance baseline prices it
//   short  short-sided: the pin is within `shortRoom` yd of the green's edge nearest the ball (little green to land on), and the ball is close to that edge
// charge = reach(distance to pin) * min(cap, up * UP + short * SHORT); balls on the green pay nothing (the putt table has them), the fringe pays
// no short-side charge (you can putt it), full weight inside `near` yd of the pin fading to nothing at `far` (beyond that the next shot is a full shot).
const RECOVERY = { near: 45, far: 90, window: 10, allow: 1.0, UP: 0.35, SHORT: 0.30, shortRoom: 6, edgeReach: 20, cap: 1.0 };
function recovery(course, p, surf, cfg = RECOVERY) {
  if (!p || surf === 'GREENS' || !course.GREEN || !course.ell) return 0;
  const dx = course.PIN.x - p.x, dz = course.PIN.z - p.z, d = Math.hypot(dx, dz);
  if (d < 0.5 || d >= cfg.far) return 0;
  const reach = d <= cfg.near ? 1 : (cfg.far - d) / (cfg.far - cfg.near);
  const ux = dx / d, uz = dz / d, h0 = course.H(p.x, p.z);
  let face = 0;
  for (let t = 1; t <= Math.min(cfg.window, d); t++) face = Math.max(face, course.H(p.x + ux * t, p.z + uz * t) - h0);
  const up = Math.max(0, face - cfg.allow);
  let short = 0;
  if (surf !== 'FRINGE') {
    let front = 0;                                                       // green between the pin and the edge nearest the ball
    while (front < 12 && course.ell(course.PIN.x - ux * front, course.PIN.z - uz * front, course.GREEN) < 1) front += 0.5;
    const edge = Math.max(0, d - front);                                 // the ball's distance to that edge
    short = Math.max(0, (cfg.shortRoom - front) / cfg.shortRoom) * Math.max(0, (cfg.edgeReach - edge) / cfg.edgeReach);
  }
  return reach * Math.min(cfg.cap, up * cfg.UP + short * cfg.SHORT);
}

// opts.recovery === false switches the recovery term off (the previous distance-and-lie-only baseline), for comparisons.
function expected(course, r, start, add = LIE_ADD, opts = {}) {
  if (r.end === 'holed') return 0;
  if (r.end === 'water' || r.end === 'oob') return 1 + expected(course, { end: 'rest', surf: 'FAIRWAY', p: start, toPin: Math.hypot(start.x - course.PIN.x, start.z - course.PIN.z) }, start, add, opts);
  if (r.surf === 'GREENS') return interp(PUTT, r.toPin);
  return interp(BASE, r.toPin) + (add[r.surf] || 0) + (opts.recovery === false ? 0 : recovery(course, r.p, r.surf));
}

// Play a plan with a spread of swings: needles evenly spaced over [-spread, spread]. Returns hazard rate, mean leave, expected score
// (and `recovery`, the mean recovery charge over the balls that were not on the green or in a hazard).
// lieAdd: a last-resort per-strategy override of the shared lie costs (LIE_ADD), for a hazard the baseline still understates. Log any use in the hole's spec §6.
function evaluate(course, shot, spread, n = 21, lieAdd = null, opts = {}) {
  const add = lieAdd ? { ...LIE_ADD, ...lieAdd } : LIE_ADD;
  const out = { n, hazard: 0, toPin: 0, score: 0, recovery: 0, surfs: {} };
  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : -spread + 2 * spread * i / (n - 1);
    const r = playShot(course, { ...shot, offset: off });
    const bad = r.end === 'water' || r.end === 'oob';
    if (bad) out.hazard++; else out.toPin += r.toPin;
    out.surfs[bad ? r.end : r.surf] = (out.surfs[bad ? r.end : r.surf] || 0) + 1;
    if (!bad && r.end !== 'holed' && opts.recovery !== false) out.recovery += recovery(course, r.p, r.surf);
    out.score += 1 + expected(course, r, r.from, add, opts);
  }
  const dry = n - out.hazard;
  out.toPin = dry ? out.toPin / dry : NaN; out.hazard /= n; out.score /= n; out.recovery /= n;
  return out;
}

module.exports = { playShot, evaluate, expected, recovery, RECOVERY, resolvePoint, CHECKS, loadCourse };
