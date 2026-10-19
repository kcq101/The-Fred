// Smoke test of the REAL shoot() function text from index.html, run against stubbed globals (no DOM, no three.js).
// It checks the wiring I changed: which popups fire, the launch direction/speed handed to the physics, the putter path.
// It does NOT prove the popups look right on a phone or that the live game runs: that needs a browser with three.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadGame, SRC } = require('./harness');

const g = loadGame();
const a = SRC.indexOf('function shoot(power,offset,sh=0,py=0){');
const b = SRC.indexOf('\n}\n', a) + 3;
const shootSrc = SRC.slice(a, b);

function world(clubIdx0) {
  const popups = [], timers = [];
  const vec = () => ({ x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }, copy() { return this; }, clone() { return this; } });
  const ball = { p: vec(), v: vec(), lastOut: vec(), rolling: true, resting: true };
  const el = { textContent: '', hidden: false };
  const body = `
    let clubIdx=${clubIdx0},aimYaw=0,strokes=0,state='aim',firstShot=true,aberrKick=0,shakeT=0,stepAcc=0.5;
    const CLUBS=env.CLUBS,SwingModel=env.SwingModel,BallModel=env.BallModel,R=0.05,prevLie=env.vec(),flightDir=env.vec(),trailPts=[];
    const H=()=>0,shotSpeed=p=>CLUBS[clubIdx].putt?10*Math.sqrt(p):CLUBS[clubIdx].v0*Math.sqrt(p),shapeSpin=()=>0,shapeYaw=()=>0,stanceNow=()=>({spin:0,yaw:0,speed:1,needle:1}),setZoom=()=>{},$=()=>env.el;
    const launchVel=(s,yaw,out)=>{const c=CLUBS[clubIdx];return out.set(Math.sin(yaw)*Math.cos(c.ang)*s,Math.sin(c.ang)*s,Math.cos(yaw)*Math.cos(c.ang)*s);};
    const SND={hit(){},putt(){}},sfx=(t,w,o)=>env.popups.push({t,o}),ball=env.ball,setTimeout=f=>f();
    ${shootSrc}
    return {shoot,setClub:i=>{clubIdx=i;},state:()=>state,strokes:()=>strokes,stepAcc:()=>stepAcc};`;
  const api = new Function('env', body)({ CLUBS: g.CLUBS, SwingModel: g.SwingModel, BallModel: g.BallModel, vec, ball, el, popups });
  return { ...api, ball, popups };
}

test('perfect swing: club word, one PERFECT! popup, ball launched straight at full speed', () => {
  const w = world(0); w.shoot(1, 0.02);
  assert.deepEqual(w.popups.map(p => p.t), ['THWACK!', 'PERFECT!']);
  // straight apart from the model's own small random jitter (rng is live here)
  const flat = Math.hypot(w.ball.v.x, w.ball.v.z), maxYaw = g.CLUBS[0].dev * Math.pow(0.02, 1.25) + g.SwingModel.JIT_YAW;
  assert.ok(Math.abs(w.ball.v.x) <= flat * Math.sin(maxYaw) + 1e-9 && w.ball.v.z > 0, `straight within the jitter (${w.ball.v.x.toFixed(3)} sideways)`);
  assert.equal(w.state(), 'flight'); assert.equal(w.strokes(), 1);
});

test('bad right miss: slower launch, aimed right (negative yaw), hot SLICE! and a distance note', () => {
  const w = world(0); w.shoot(1, 0.6);
  assert.deepEqual(w.popups.map(p => p.t.replace(/\d+/, 'N')), ['THWACK!', 'SLICE!', '−N% DIST']);
  assert.ok(w.ball.v.x < 0, 'right miss goes screen-right = -x');
  assert.ok(Math.hypot(w.ball.v.x, w.ball.v.y, w.ball.v.z) < g.CLUBS[0].v0 * 0.97);
  assert.equal(w.popups[1].o.cls, 'hot small');
  assert.ok(w.ball.spin > 0, 'slice curves right');
});

test('worst contact left: club word becomes CHUNK!, HOOK!, ball goes left', () => {
  const w = world(2); w.shoot(1, -1);
  assert.deepEqual(w.popups.map(p => p.t.replace(/\d+/, 'N')), ['CHUNK!', 'HOOK!', '−N% DIST']);
  assert.ok(w.ball.v.x > 0 && w.ball.spin < 0);
});

test('slightly off: only a small FADE/DRAW tag, no distance note', () => {
  const w = world(1); w.shoot(1, 0.25);
  assert.deepEqual(w.popups.map(p => p.t), ['WHACK!', 'FADE']);
  assert.equal(w.popups[1].o.cls, 'small');
});

test('putter: TAP, same PERFECT!/PUSHED/PULLED tags as before, no CHUNK, no spin', () => {
  let w = world(4); w.shoot(0.5, 0);
  assert.deepEqual(w.popups.map(p => p.t), ['TAP', 'PERFECT!']);
  w = world(4); w.shoot(0.5, 0.9);
  assert.deepEqual(w.popups.map(p => p.t), ['TAP', 'PUSHED']);
  w = world(4); w.shoot(0.5, -0.2);
  assert.deepEqual(w.popups.map(p => p.t), ['TAP']);
  assert.equal(w.ball.spin, 0); assert.equal(w.ball.v.y, 0);
});
