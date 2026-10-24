// Test harness for The Fred.
// It pulls the game's own constants, clubs, surface table, SwingModel and BallModel straight out of index.html (no copies to drift),
// and can also load the game's REAL terrain code (heights, surfaces, bunkers, water) for the three holes.
// What it cannot do: run three.js, so nothing here renders, hits trees, or touches the HUD. See tests/README.md.
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function between(startMarker, endMarker, src = SRC) {
  const a = src.indexOf(startMarker);
  if (a < 0) throw new Error('marker not found: ' + startMarker);
  const b = src.indexOf(endMarker, a);
  if (b < 0) throw new Error('marker not found: ' + endMarker);
  return src.slice(a, b);
}

// src: index.html text; defaults to the working copy. Pass an older version (e.g. from `git show`) to compare before/after.
function loadGame(src = SRC) {
  const between_ = (a, b) => between(a, b, src);
  const prelude = 'const D2R=Math.PI/180;const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));const mix=(a,b,t)=>a+(b-a)*t;';
  const surfaces = between_('const TEE=0,FAIRWAY=1', 'function S(x,z)');
  // from the constants line on: 'const G=10.7,R=0.05;' and the Aero block since the 2026-10-21 flight port, 'const G=10.7,K=0.0011,R=0.05;' before it
  const physics = between_('const G=10.7,', 'function lieMult');
  const lieFn = between_('function lieMult', '\n');
  const swing = between_('// <swing-model>', '// </swing-model>');
  const ball = between_('// <ball-model>', '// </ball-model>');
  const stance = src.includes('// <stance-model>') ? between_('// <stance-model>', '// </stance-model>') : 'const StanceModel=null;';
  const body = `${prelude}\n${surfaces}\n${physics}\n${lieFn}\n${swing}\n${stance}\n${ball}\n` +
    'return {G,K:typeof K===\'undefined\'?undefined:K,Aero:typeof Aero===\'undefined\'?undefined:Aero,R,CLUBS,SP,TEE,FAIRWAY,ROUGH,FRINGE,GREENS,SAND,WATER,PINE:typeof PINE===\'undefined\'?undefined:PINE,ROAD:typeof ROAD===\'undefined\'?undefined:ROAD,WASTE:typeof WASTE===\'undefined\'?undefined:WASTE,PATH:typeof PATH===\'undefined\'?undefined:PATH,LAWN:typeof LAWN===\'undefined\'?undefined:LAWN,lieMult,carryFlat,speedForCarry,needleRate:typeof needleRate===\'undefined\'?undefined:needleRate,clamp,mix,D2R,SwingModel,StanceModel,BallModel};';
  return new Function(body)();
}

// minimal stand-in for THREE.Vector3 (the terrain code only needs set/normalize)
class V3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  normalize() { const l = Math.hypot(this.x, this.y, this.z) || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
}

// The game's real terrain code, lifted from index.html: HOLES, H(), normal(), S(), prepHole(), bunkers and water.
function loadCourse(src = SRC) {
  const region = between('// ---------------------------------------------------------------- shapes', '// ---------------------------------------------------------------- ball physics', src);
  const game = loadGame(src);
  const body = `const D2R=Math.PI/180;const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));const mix=(a,b,t)=>a+(b-a)*t;const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
${region}
return {HOLES,prepHole,H,normal,S,obstacleHit:typeof obstacleHit==='undefined'?(()=>{}):obstacleHit,inOB:typeof inOB==='undefined'?(()=>false):inOB,get OBST(){return typeof OBST==='undefined'?[]:OBST;},get HOLE(){return HOLE;},get PIN(){return PIN;},get PIN_H(){return PIN_H;},get TEE_H(){return TEE_H;},get BUNKERS(){return BUNKERS;},get BODIES(){return BODIES;},get GREEN(){return GREEN;},ell,prepShape:typeof prepShape==='undefined'?undefined:prepShape,sdPoly:typeof sdPoly==='undefined'?undefined:sdPoly,rawH:typeof rawH==='undefined'?undefined:rawH,centerX,inFairway,SP,get FEATS(){return typeof FEATS==='undefined'?null:FEATS;}};`;
  const course = new Function('V3', body)(V3);
  course.game = game;                                                     // (attach, don't spread: HOLE/PIN/... are live getters)
  course.terrain = { H: course.H, normal: course.normal, S: course.S };
  return course;
}

// small seedable PRNG so every scenario is reproducible
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// A terrain from a height function and a surface function, with the same finite-difference normal the game uses.
function makeTerrain(h, surf) {
  const out = { x: 0, y: 1, z: 0 }, e = 0.2;
  const H = (x, z) => h(x, z);
  const normal = (x, z) => {
    const hx = h(x + e, z) - h(x - e, z), hz = h(x, z + e) - h(x, z - e);
    const nx = -hx / (2 * e), nz = -hz / (2 * e), l = Math.hypot(nx, 1, nz);
    out.x = nx / l; out.y = 1 / l; out.z = nz / l; return out;
  };
  return { H, normal, S: typeof surf === 'function' ? surf : () => surf };
}

// Run one shot through the real BallModel until the ball is at rest (or the game's own time limit).
// start: {x,z} on the terrain. v: launch velocity {x,y,z}. Returns the final state, the shot summary and invariants measured along the way.
function runBall(game, terrain, { start = { x: 0, z: 0 }, v, spin = 0, club = null, wind = { x: 0, z: 0 }, onEv = null, collide = null, maxT = null, dive = null } = {}) {
  const { BallModel, SP, R } = game;
  const env = { terrain, sp: SP, wind, onEv, collide };
  const b = { p: { x: start.x, y: terrain.H(start.x, start.z) + R + 0.02, z: start.z }, v: { ...v }, rolling: false, landed: false, resting: false, t: 0, spin, club, lipT: -9 };
  BallModel.begin(b);
  const lim = maxT ?? BallModel.MAX_T;
  const inv = { minClear: Infinity, maxSpeedGround: 0, maxHopAfterLanding: 0, steps: 0, nan: false, events: [], exit: null };
  let peakAfter = 0;
  while (b.t < lim && !b.resting) {
    const wasLanded = b.landed;
    BallModel.step(b, BallModel.STEP, env);
    inv.steps++;
    if (!wasLanded && b.landed) inv.firstContact = { x: b.p.x, z: b.p.z, t: b.t };   // seen from outside, not read from the model's own record
    if (!(Number.isFinite(b.p.x) && Number.isFinite(b.p.y) && Number.isFinite(b.p.z))) { inv.nan = true; break; }
    const h = terrain.H(b.p.x, b.p.z), clear = b.p.y - R - h;
    inv.minClear = Math.min(inv.minClear, clear);
    if (b.landed) { peakAfter = Math.max(peakAfter, clear); if (b.rolling) inv.maxSpeedGround = Math.max(inv.maxSpeedGround, Math.hypot(b.v.x, b.v.y, b.v.z)); }
    if (dive && dive(b, terrain)) { inv.exit = 'hazard'; break; }
  }
  inv.maxHopAfterLanding = peakAfter;
  return { ball: b, summary: BallModel.summary(b), inv, resting: b.resting, t: b.t };
}

// Flat-ground shot through the real BallModel. Same signature the Phase 1 swing tests used.
// speed: launch speed (yd/s). yaw: radians, +yaw = screen-left (+x). spin: sideways accel (yd/s^2). wind {x,z} in yd/s. surf: surface key.
// Returns carry (to first contact), total, lateral (+x = left of the aim line) and depth, in yards.
function flatShot(game, club, speed, yaw, spin, wind = { x: 0, z: 0 }, surf = game.FAIRWAY) {
  const terrain = makeTerrain(() => 0, surf);
  const v = { x: Math.sin(yaw) * Math.cos(club.ang) * speed, y: Math.sin(club.ang) * speed, z: Math.cos(yaw) * Math.cos(club.ang) * speed };
  const r = runBall(game, terrain, { v, spin, club, wind, maxT: 40 });
  const b = r.ball, a = b.landAt || b.p;
  return { carry: Math.hypot(a.x, a.z), carryLat: a.x, total: Math.hypot(b.p.x, b.p.z), lateral: b.p.x, depth: b.p.z, roll: r.summary.roll, bounces: r.summary.bounces, t: r.t, resting: r.resting };
}

module.exports = { loadGame, loadCourse, makeTerrain, runBall, mulberry32, flatShot, SRC, between };
