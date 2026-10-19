// The accuracy rainbow: a fan lying on the ground in front of the ball, drawn through the game camera.
// Automated: ground geometry (extracted from index.html), a stand-in aiming camera (tests/camera.js), and the real drawFan() against stubbed DOM/camera.
// Not covered: the live three.js camera and how it looks on a phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const { SRC } = require('./harness');
const { makeCamera } = require('./camera');

const D2R = Math.PI / 180, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mix = (a, b, t) => a + (b - a) * t;
const block = (a, b) => SRC.slice(SRC.indexOf(a), SRC.indexOf(b));
const geo = new Function('D2R', 'clamp', 'mix', block('// <fan-geometry>', '// </fan-geometry>') + ';return {FAN,fanDims,fanColor,fanPoint,fanPts,fanWedge,fanArrow,stops};')(D2R, clamp, mix);
const { FAN, fanDims, fanPoint, fanPts, fanWedge, fanArrow, fanColor, stops } = geo;
const B = { x: 3, z: -7 };
const dist = (p, q) => Math.hypot(p.x - q.x, p.z - q.z);

test('the old flat HUD meter is gone', () => {
  assert.ok(!/pendBands|pendLayout|PEND_SWEEP|pendNeedle|pendHit|pendOk/.test(SRC));
  assert.match(SRC, /<div id="pend" hidden><svg aria-hidden="true">/);
});

test('fan points are real ground geometry: along the aim line, equal distance from the ball, + = screen-right', () => {
  for (const yawDeg of [0, 17, -40]) {
    const yaw = yawDeg * D2R;
    const ahead = fanPoint(B, yaw, 5, 0);
    assert.ok(Math.abs(ahead.x - (B.x + 5 * Math.sin(yaw))) < 1e-9 && Math.abs(ahead.z - (B.z + 5 * Math.cos(yaw))) < 1e-9, `aim ray at yaw ${yawDeg}`);
    for (const deg of [-72, -30, 0, 45, 72]) assert.ok(Math.abs(dist(B, fanPoint(B, yaw, 4.2, deg)) - 4.2) < 1e-9, `constant radius at ${deg}`);
  }
  const r = fanPoint({ x: 0, z: 0 }, 0, 5, 90), l = fanPoint({ x: 0, z: 0 }, 0, 5, -90);
  assert.ok(r.x < -4.99 && l.x > 4.99, 'positive angle is screen-right (world -x), as in launchVel');
  const p = fanPoint({ x: 0, z: 0 }, 0, 3, 0, 4); assert.ok(Math.abs(Math.hypot(p.x, p.z) - 5) < 1e-9 && p.x < 0, 'lat is sideways to the right');
});

test('the rainbow is smooth and the arrow is slim, small-headed and clear of the ball', () => {
  assert.ok(FAN.sweep >= 60 && FAN.sweep <= 85 && FAN.slices >= 60);
  assert.equal(stops[0][0], 0); assert.equal(stops[stops.length - 1][0], 1);
  for (let i = 1; i < stops.length; i++) assert.ok(stops[i][0] > stops[i - 1][0]);
  const rgb = t => fanColor(t).match(/\d+/g).map(Number);
  assert.ok(rgb(0)[2] > rgb(0)[0], 'cyan at dead center'); assert.ok(rgb(1)[0] > rgb(1)[2], 'deep red at the ends');
  let worst = 0; for (let t = 0; t < 0.999; t += 0.005) worst = Math.max(worst, ...rgb(t).map((v, k) => Math.abs(v - rgb(t + 0.005)[k])));
  assert.ok(worst <= 8, `neighbouring slices differ by at most 8/255 (got ${worst})`);
  assert.ok(FAN.shaft * 2 <= 0.3 && FAN.head * 2 <= 0.6, 'arrow is about half the width of the first version');
  assert.ok(FAN.head / FAN.shaft < 2.3, 'arrow point is less pronounced');
  assert.ok(FAN.tail >= 1.2 && FAN.tail < FAN.r0, 'arrow starts clear of the ball, inside the inner edge');
  assert.ok(FAN.tip >= FAN.r1 - 0.5 && FAN.tip <= FAN.r1 + 1, 'arrow reaches the band');
});

test('geometry scales with camera distance so the fan keeps its size on screen', () => {
  const a = fanDims(1), b = fanDims(2);
  for (const k of Object.keys(a)) assert.ok(Math.abs(b[k] - 2 * a[k]) < 1e-12);
});

test('seen through the aiming camera: lies on the ground, centered on the ball, aim line runs through the notch', () => {
  for (const [vw, vh] of [[390, 780], [466, 848], [932, 1695]]) for (const D of [60, 200, 450]) for (const yawDeg of [0, 12, -25]) {
    const cam = makeCamera({ vw, vh, D }), yaw = yawDeg * D2R, b = { x: 0, z: 0 }, s = cam.dist / FAN.refDist, d = fanDims(s);
    const scr = (x, z) => cam.toScreen(x, z);
    const o = scr(b.x, b.z), mid = scr(...Object.values(fanPoint(b, yaw, (d.r0 + d.r1) / 2, 0)));
    const far = scr(...Object.values(fanPoint(b, yaw, 60, 0)));
    // perspective keeps straight lines straight: ball, notch and a far point on the aim ray are collinear on screen
    const cross = (mid.x - o.x) * (far.y - o.y) - (mid.y - o.y) * (far.x - o.x);
    assert.ok(Math.abs(cross) < 0.02 * Math.hypot(mid.x - o.x, mid.y - o.y) * Math.hypot(far.x - o.x, far.y - o.y), `aim line through notch (D ${D}, yaw ${yawDeg})`);
    assert.ok(mid.y < o.y, 'the fan is in front of the ball (higher up the screen), not on top of it');
    // size on screen, after the depth stretch the game applies
    const lifted = (x, z) => { const q = scr(x, z); return { x: q.x, y: o.y + (q.y - o.y) * FAN.depth }; };
    const pts = []; for (let a = -FAN.sweep; a <= FAN.sweep; a += 6) for (const r of [d.r0, d.r1]) pts.push(lifted(...Object.values(fanPoint(b, 0, r, a))));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    assert.ok(w / h > 1.2 && w / h < 4.5, `fan reads as lying flat but not a sliver: ${w.toFixed(0)}x${h.toFixed(0)} px (D ${D}, ${vw}x${vh})`);
    assert.ok(w > 0.3 * vw && w < 0.8 * vw, `fan is ${(100 * w / vw).toFixed(0)}% of the screen width`);
    assert.ok(Math.min(...ys) > 0.3 * vh, 'fan stays in the lower part of the screen');
  }
});

test('geometry helpers refuse points behind the camera', () => {
  assert.equal(fanPts(() => null, [B, B]), null);
  assert.equal(fanWedge((x, z) => (z > -4 ? null : { x, y: z }), B, 0, 1, 5, -10, 10), null);
  assert.equal(fanArrow(() => null, B, 0, 0, 1)[0], null);
});

test('drawFan(): builds the rainbow once, redraws only the arrow each frame, rebuilds when the aim moves', () => {
  const html = []; const set = {};
  const cam = makeCamera({ vw: 466, vh: 848, D: 200 });
  const body = `let fanKey='',aimYaw=0,pendOffset=0;const vw=466,vh=848;
    const ball={p:{x:0,z:0}},camera={position:{distanceTo:()=>env.cam.dist},matrixWorld:{elements:[1,2,3]}};
    const fanScreen=(x,z)=>env.cam.toScreen(x,z);
    const $=id=>({set innerHTML(v){env.html.push(v);},setAttribute(k,v){env.set[id]=v;}});
    ${block('// <fan-draw>', '// </fan-draw>')}
    return {drawFan,setYaw:v=>{aimYaw=v;},setOff:v=>{pendOffset=v;}};`;
  const w = new Function('env', 'D2R', 'clamp', 'mix', 'FAN', 'fanDims', 'fanPoint', 'fanPts', 'fanWedge', 'fanArrow', 'fanColor', body)({ cam, html, set }, D2R, clamp, mix, FAN, fanDims, fanPoint, fanPts, fanWedge, fanArrow, fanColor);
  w.drawFan(); assert.equal(html.length, 1);
  assert.ok((html[0].match(/<polygon/g) || []).length >= FAN.slices + 3, 'outline + slices + notch');
  assert.ok(html[0].includes('<polyline'), 'gloss line');
  assert.deepEqual(Object.keys(set).sort(), ['arrL', 'arrR', 'arrSL', 'arrSR']);
  const first = { ...set };
  w.setOff(0.5); w.drawFan(); assert.equal(html.length, 1, 'rainbow not rebuilt when only the arrow moved');
  assert.notEqual(set.arrL, first.arrL, 'arrow moved');
  w.setYaw(0.2); w.drawFan(); assert.equal(html.length, 2, 'rainbow rebuilt when the aim changes');
  // arrow at offset -1 and +1 mirror each other left/right of the aim line
  w.setYaw(0); w.setOff(1); w.drawFan(); const right = set.arrR.split(' ').map(p => +p.split(',')[0]);
  w.setOff(-1); w.drawFan(); const left = set.arrL.split(' ').map(p => +p.split(',')[0]);
  assert.ok(Math.min(...right) > 233 - 1 && Math.max(...left) < 233 + 1, 'right swing lands right of center, left swing left of it');
});
