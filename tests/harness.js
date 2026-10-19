// Test harness for The Fred's swing tuning.
// It pulls the game's own constants, clubs and surface table straight out of index.html (no copies to drift),
// and provides a FLAT-GROUND mirror of the airborne/rolling branches of physStep() for measuring shots.
// The mirror is NOT the live engine: it has no terrain, trees or water. See tests/README.md for what that means.
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function between(startMarker, endMarker) {
  const a = SRC.indexOf(startMarker);
  if (a < 0) throw new Error('marker not found: ' + startMarker);
  const b = SRC.indexOf(endMarker, a);
  if (b < 0) throw new Error('marker not found: ' + endMarker);
  return SRC.slice(a, b);
}

function loadGame() {
  const prelude = 'const D2R=Math.PI/180;const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));const mix=(a,b,t)=>a+(b-a)*t;';
  const surfaces = between('const TEE=0,FAIRWAY=1', 'function S(x,z)');
  const physics = between('const G=10.7,K=0.0011,R=0.05;', 'function lieMult');
  const lieFn = between('function lieMult', '\n');
  let swing = '';
  if (SRC.includes('// <swing-model>')) swing = between('// <swing-model>', '// </swing-model>');
  const body = `${prelude}\n${surfaces}\n${physics}\n${lieFn}\n${swing}\n` +
    'return {G,K,R,CLUBS,SP,TEE,FAIRWAY,ROUGH,FRINGE,GREENS,SAND,lieMult,carryFlat,clamp,mix,D2R,' +
    (swing ? 'SwingModel' : 'SwingModel:null') + '};';
  return new Function(body)();
}

// small seedable PRNG so every scenario is reproducible
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Flat-ground mirror of physStep (airborne drag+wind+spin, first-bounce keep incl. club.roll, then roll with surface decel).
// speed: launch speed (yd/s). yaw: radians, +yaw = screen-left (+x). spin: sideways accel (yd/s^2), same sign convention as ball.spin.
// wind: {x,z} in yd/s. surf: surface key for bounce/roll. Returns carry, total, lateral (+x = left of the aim line) in yards.
function flatShot(game, club, speed, yaw, spin, wind = { x: 0, z: 0 }, surf = game.FAIRWAY) {
  const { G, K, R, SP, clamp } = game;
  const sp = SP[surf];
  const p = { x: 0, y: R, z: 0 };
  const v = { x: Math.sin(yaw) * Math.cos(club.ang) * speed, y: Math.sin(club.ang) * speed, z: Math.cos(yaw) * Math.cos(club.ang) * speed };
  let landed = false, rolling = false, carry = null, spinNow = spin, t = 0;
  const dt = 1 / 240;
  while (t < 30) {
    t += dt;
    if (!rolling) {
      const vx = v.x - wind.x, vy = v.y, vz = v.z - wind.z, s = Math.hypot(vx, vy, vz);
      v.x -= K * s * vx * dt; v.y -= (G + K * s * vy) * dt; v.z -= K * s * vz * dt;
      if (spinNow) { const hv = Math.hypot(v.x, v.z); if (hv > 1) { v.x += (-v.z / hv) * spinNow * dt; v.z += (v.x / hv) * spinNow * dt; } }
      p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
      if (p.y - R <= 0) {
        p.y = R; const vn = v.y;
        if (vn < 0) {
          let keep = 1 - sp.mu * (landed ? clamp(-vn / 8, 0, 1) : 1);
          if (!landed && club.roll) keep *= club.roll;
          v.x *= keep; v.z *= keep;
          if (vn < -1.5) v.y = -vn * sp.e; else { v.y = 0; rolling = true; }
        }
        if (!landed) { landed = true; spinNow = 0; carry = { x: p.x, z: p.z }; }
      }
    } else {
      const s = Math.hypot(v.x, v.z);
      if (s > 0) { const k = Math.max(0, s - sp.dec * dt) / s; v.x *= k; v.z *= k; }
      p.x += v.x * dt; p.z += v.z * dt; v.y = 0;
      if (Math.hypot(v.x, v.z) < 0.07) break;
    }
  }
  const c = carry || p;
  return { carry: Math.hypot(c.x, c.z), carryLat: c.x, total: Math.hypot(p.x, p.z), lateral: p.x, depth: p.z };
}

module.exports = { loadGame, mulberry32, flatShot, SRC };
