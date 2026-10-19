// The accuracy rainbow: a fan lying on the ground in front of the ball, drawn through the game camera.
// Automated: ground geometry (extracted from index.html), a stand-in aiming camera (tests/camera.js), and the real drawFan() against stubbed DOM/camera.
// Not covered: the live three.js camera and how it looks on a phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const { SRC } = require('./harness');
const { makeCamera } = require('./camera');

const D2R = Math.PI / 180, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mix = (a, b, t) => a + (b - a) * t;
const block = (a, b) => SRC.slice(SRC.indexOf(a), SRC.indexOf(b));
const geo = new Function('D2R', 'clamp', 'mix', block('// <fan-geometry>', '// </fan-geometry>') + ';return {FAN,fanColor,fanCenter,fanThick,fanEdge,fanPts,fanSlice,fanArrow,fanMapper,stops};')(D2R, clamp, mix);
const { FAN, fanColor, fanCenter, fanThick, fanEdge, fanPts, fanSlice, fanArrow, fanMapper, stops } = geo;
const px = str => str.split(' ').map(p => p.split(',').map(Number));

test('the old flat HUD meter is gone', () => {
  assert.ok(!/pendBands|pendLayout|PEND_SWEEP|pendNeedle|pendHit|pendOk/.test(SRC));
  assert.match(SRC, /<div id="pend" hidden><svg aria-hidden="true">/);
});

test('band shape (Golf Clash crescent): thickest at dead center, tapering to points at the ends, ends flare downrange, symmetric', () => {
  assert.ok(fanThick(1) < 0.3 && fanThick(0) > 8 * fanThick(1), 'thick middle, pointed ends');
  for (let u = 0; u < 1; u += 0.05) { assert.ok(fanThick(u + 0.05) < fanThick(u)); assert.ok(fanCenter(u + 0.05) >= fanCenter(u)); }
  assert.ok(fanCenter(1) > fanCenter(0) + 1, 'crescent: ends are farther toward the hole than the middle');
  assert.ok(Math.abs(fanEdge(0.6).far - fanEdge(-0.6).far) < 1e-9 && fanEdge(0.6).lat === -fanEdge(-0.6).lat);
  assert.ok(fanEdge(0).near > FAN.tail + 2, 'band sits out in front of the ball, not on it');
});

test('the rainbow is smooth and the arrow is slim, small-headed and clear of the ball', () => {
  assert.ok(FAN.slices >= 60);
  assert.equal(stops[0][0], 0); assert.equal(stops[stops.length - 1][0], 1);
  for (let i = 1; i < stops.length; i++) assert.ok(stops[i][0] > stops[i - 1][0]);
  const rgb = t => fanColor(t).match(/\d+/g).map(Number);
  assert.ok(rgb(0)[2] > rgb(0)[0], 'cyan at dead center'); assert.ok(rgb(1)[0] > rgb(1)[2], 'deep red at the ends');
  let worst = 0; for (let t = 0; t < 0.999; t += 0.005) worst = Math.max(worst, ...rgb(t).map((v, k) => Math.abs(v - rgb(t + 0.005)[k])));
  assert.ok(worst <= 8, `neighbouring slices differ by at most 8/255 (got ${worst})`);
  assert.ok(FAN.shaft * 2 <= 0.3 && FAN.head * 2 <= 0.6 && FAN.head / FAN.shaft < 2.5, 'slim shaft, modest head');
  assert.ok(FAN.tail >= 1 && FAN.tail < fanEdge(0).near, 'arrow starts clear of the ball, inside the band\'s near edge');
  assert.ok(FAN.arrowLen > fanEdge(0).near && FAN.arrowLen <= fanEdge(0).far + 0.5, 'arrow reaches the band');
});

const flat = (x, z) => ({ x, y: -z });                       // simplest camera: aim line is straight up the screen
test('mapper: ground (lat,fwd) -> screen, + lat is screen-right, forward is up the screen, far end narrower', () => {
  const m = fanMapper((x, z) => ({ x: 300 - x * 50, y: 800 - z * 20 }), { x: 0, z: 0 }, 0, 1);   // world +x is screen-left
  const o = m(0, 0), r = m(2, 0), f = m(0, 4), far = m(2, 20);
  assert.ok(r.x > o.x && Math.abs(r.y - o.y) < 1e-6, 'right of the aim line is screen-right');
  assert.ok(f.y < o.y && Math.abs(f.x - o.x) < 1e-6, 'toward the hole is up the screen');
  assert.ok(far.x - m(0, 20).x < r.x - o.x, 'far end is narrower (ground perspective)');
});

test('scales with camera distance (s) so the band keeps its size on screen', () => {
  const cam = D => makeCamera({ vw: 466, vh: 848, D });
  for (const D of [60, 200, 450]) {
    const c = cam(D), s = c.dist / FAN.refDist, m = fanMapper((x, z) => c.toScreen(x, z), { x: 0, z: 0 }, 0, s);
    const w = m(FAN.half, FAN.f0).x - m(-FAN.half, FAN.f0).x;
    assert.ok(w > 0.3 * 466 && w < 0.85 * 466, `band is ${(100 * w / 466).toFixed(0)}% of screen width (D ${D})`);
  }
});

test('seen through stand-in cameras (phone/desktop, near/far, any aim): in front of the ball, flat and wide, aim line through the notch', () => {
  for (const [vw, vh] of [[390, 780], [466, 848], [932, 1695], [1280, 720]]) for (const D of [60, 200, 450]) for (const yawDeg of [0, 12, -25]) {
    const c = makeCamera({ vw, vh, D }), yaw = yawDeg * D2R, s = c.dist / FAN.refDist, m = fanMapper((x, z) => c.toScreen(x, z), { x: 0, z: 0 }, yaw, s);
    const o = c.toScreen(0, 0), notch = m(0, fanCenter(0)), pts = [];
    for (let i = 0; i <= 20; i++) { const e = fanEdge(-1 + i / 10); pts.push(m(e.lat, e.near), m(e.lat, e.far)); }
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys);
    assert.ok(notch.y < o.y, 'band is in front of (above) the ball on screen');
    assert.ok(Math.min(...ys) > 0.1 * vh && Math.max(...ys) < o.y, 'band stays on screen, above the ball');
    assert.ok(w / h > 1.6 && w / h < 5, `reads as lying flat, not a sliver or a tower: ${w.toFixed(0)}x${h.toFixed(0)} (D ${D}, ${vw}x${vh}, yaw ${yawDeg})`);
    assert.ok(w > 0.25 * Math.min(vw, vh * 0.6) && w < 0.9 * vw, `${(100 * w / vw).toFixed(0)}% of screen width`);
  }
});

test('arrow: constant length, runs from near the ball to the band, swings left/right with the offset', () => {
  const gm = (lat, fwd) => ({ x: lat, y: fwd }), tipLen = u => { const p = px(fanArrow(gm, u)[0]).concat(px(fanArrow(gm, u)[1])); return Math.max(...p.map(q => Math.hypot(q[0], q[1]))); };
  for (const u of [-1, -0.5, 0, 0.7, 1]) assert.ok(Math.abs(tipLen(u) - FAN.arrowLen) < 0.05, `arrow length at u=${u}`);
  const m = (lat, fwd) => ({ x: 300 + lat * 50, y: 800 - fwd * 40 });
  const tip = u => { const [l, r] = fanArrow(m, u).map(px), p = l.concat(r); return p.reduce((a, q) => (q[1] < a[1] ? q : a)); };
  assert.ok(tip(1)[0] > 300 + 100 && tip(-1)[0] < 300 - 100 && Math.abs(tip(0)[0] - 300) < 1e-6, 'tip lands right / left / dead center');
  const ys = px(fanArrow(m, 0)[0]).map(p => p[1]);
  assert.ok(Math.max(...ys) > 800 - FAN.tail * 40 - 1 && Math.min(...ys) < 800 - fanCenter(0) * 40 + 1, 'spans ball to band');
});

test('geometry helpers refuse points behind the camera', () => {
  assert.equal(fanPts(() => null, [[0, 0], [1, 1]]), null);
  assert.equal(fanSlice(() => null, -0.5, 0.5), null);
  assert.equal(fanArrow(() => null, 0.3)[0], null);
  assert.equal(fanMapper(() => null, { x: 0, z: 0 }, 0, 1), null);
});

test('drawFan(): builds the band once, redraws only the arrow each frame, rebuilds when the aim moves', () => {
  const html = []; const set = {};
  const cam = makeCamera({ vw: 466, vh: 848, D: 200 });
  const body = `let fanKey='',aimYaw=0,pendOffset=0;const vw=466,vh=848;
    const ball={p:{x:0,z:0}},camera={position:{distanceTo:()=>env.cam.dist},matrixWorld:{elements:[1,2,3]}};
    const fanScreen=(x,z)=>env.cam.toScreen(x,z);
    const $=id=>({set innerHTML(v){env.html.push(v);},setAttribute(k,v){env.set[id]=v;}});
    ${block('// <fan-draw>', '// </fan-draw>')}
    return {drawFan,setYaw:v=>{aimYaw=v;},setOff:v=>{pendOffset=v;}};`;
  const w = new Function('env', 'FAN', 'fanEdge', 'fanThick', 'fanPts', 'fanSlice', 'fanArrow', 'fanMapper', 'fanColor', body)({ cam, html, set }, FAN, fanEdge, fanThick, fanPts, fanSlice, fanArrow, fanMapper, fanColor);
  w.drawFan(); assert.equal(html.length, 1);
  assert.ok((html[0].match(/<polygon/g) || []).length >= FAN.slices + 3, 'outline + slices + notch');
  assert.ok(html[0].includes('<polyline'), 'gloss line');
  assert.deepEqual(Object.keys(set).sort(), ['arrL', 'arrR', 'arrSL', 'arrSR']);
  const first = { ...set };
  w.setOff(0.5); w.drawFan(); assert.equal(html.length, 1, 'band not rebuilt when only the arrow moved');
  assert.notEqual(set.arrL, first.arrL, 'arrow moved');
  w.setYaw(0.2); w.drawFan(); assert.equal(html.length, 2, 'band rebuilt when the aim changes');
  w.setYaw(0); w.setOff(1); w.drawFan(); const right = px(set.arrR).map(p => p[0]);
  w.setOff(-1); w.drawFan(); const left = px(set.arrL).map(p => p[0]);
  assert.ok(Math.max(...right) > Math.max(...left) + 100, 'right swing lands right of a left swing');
});
