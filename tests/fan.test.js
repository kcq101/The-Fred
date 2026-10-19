// The accuracy meter: a see-through rainbow arc on the grass around the ball, placed on the ball and turned to the aim line through the game camera.
// Automated: ground geometry (extracted from index.html), a stand-in aiming camera (tests/camera.js), and the real drawFan() against stubbed DOM/camera.
// Not covered: the live three.js camera and how it looks on a phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const { SRC } = require('./harness');
const { makeCamera } = require('./camera');

const D2R = Math.PI / 180, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mix = (a, b, t) => a + (b - a) * t;
const block = (a, b) => SRC.slice(SRC.indexOf(a), SRC.indexOf(b));
const geo = new Function('D2R', 'clamp', 'mix', block('// <fan-geometry>', '// </fan-geometry>') + ';return {FAN,stops,fanColor,fanSize,fanEllipse,fanPt,fanBandPath,fanArcPath,fanStatic,fanTip,fanArrow};')(D2R, clamp, mix);
const { FAN, stops, fanColor, fanSize, fanEllipse, fanPt, fanBandPath, fanStatic, fanTip, fanArrow } = geo;
const px = str => str.split(' ').map(p => p.split(',').map(Number));

test('the old flat HUD meter is gone', () => {
  assert.ok(!/pendBands|pendLayout|PEND_SWEEP|pendNeedle|pendHit|pendOk/.test(SRC));
  assert.match(SRC, /<div id="pend" hidden><svg aria-hidden="true">/);
});

test('arc shape: a ring around the ball seen in ground perspective, highest in the middle, ends curving back down', () => {
  const h = 150, e = fanEllipse(h);
  assert.ok(Math.abs(fanPt(FAN.sweep, 1, h).x - h) < 1e-9, 'outer end sits at the half-width');
  assert.ok(e.b < e.a && FAN.squash > 0.4 && FAN.squash < 0.8, 'flattened like a circle on the ground');
  const top = fanPt(0, 1, h), end = fanPt(FAN.sweep, 1, h);
  assert.ok(end.y - top.y > 0.15 * h, 'ends curve down toward the ball');
  assert.ok(top.y < 0 && -fanPt(0, 1 - FAN.thick, h).y > FAN.base * e.b + 10, 'band is in front of the ball, clear of the arrow\'s start');
  assert.ok(Math.abs(fanPt(20, 1, h).y - fanPt(-20, 1, h).y) < 1e-9, 'symmetric');
  assert.ok(FAN.thick >= 0.15 && FAN.thick <= 0.3, 'a solid band, not a thin line');
  assert.match(fanBandPath(h), /^M-150\.0 [-\d.]+A[\d.]+ [\d.]+ 0 0 1 150\.0 [-\d.]+L.*A.* 0 0 0 .*Z$/);
});

test('rainbow is smooth, blue at dead center, red at the ends, and a little see-through', () => {
  assert.equal(stops[0][0], 0); assert.equal(stops[stops.length - 1][0], 1);
  for (let i = 1; i < stops.length; i++) assert.ok(stops[i][0] > stops[i - 1][0]);
  const rgb = t => fanColor(t).match(/\d+/g).map(Number);
  assert.ok(rgb(0)[2] > rgb(0)[0] && rgb(0)[2] > rgb(0)[1], 'blue at dead center'); assert.ok(rgb(1)[0] > 200 && rgb(1)[1] < 80, 'red at the ends');
  let worst = 0; for (let t = 0; t < 0.999; t += 0.005) worst = Math.max(worst, ...rgb(t).map((v, k) => Math.abs(v - rgb(t + 0.005)[k])));
  assert.ok(worst <= 12, `neighbouring shades differ by at most 12/255 (got ${worst})`);
  assert.ok(FAN.opacity >= 0.6 && FAN.opacity < 0.95, 'see-through but readable');
  assert.match(fanStatic(150), new RegExp(`<g opacity="${FAN.opacity}">`));
  assert.ok(fanStatic(150).includes('url(#fanG)'));
});

test('arrow: along a ray from the ball, from clear of the ball to just inside the band, slim with a small head', () => {
  const h = 150;
  for (const u of [-1, -0.4, 0, 0.5, 1]) {
    const T = fanTip(u, h), pts = px(fanArrow(u, h)[0]).concat(px(fanArrow(u, h)[1]));
    const tip = pts.reduce((a, q) => (Math.hypot(q[0], q[1]) > Math.hypot(a[0], a[1]) ? q : a));
    assert.ok(Math.abs(tip[0] - T.x) < 0.2 && Math.abs(tip[1] - T.y) < 0.2, `tip (u ${u})`);
    assert.ok(FAN.tipR > 1 - FAN.thick && FAN.tipR < 1, 'tip lands inside the band');
    const base = pts[0]; assert.ok(Math.abs(base[0] * T.y - base[1] * T.x) / (Math.hypot(...base) * Math.hypot(T.x, T.y)) < 0.01, `base on the same ray from the ball (u ${u})`);
  }
  assert.ok(fanTip(1, h).x > 0 && fanTip(-1, h).x < 0 && fanTip(0, h).x === 0, '+ = right');
  assert.ok(FAN.shaft * 2 <= 0.05 && FAN.head / FAN.shaft < 3.2, 'slim shaft, modest head');
});

test('size: about three-quarters of a phone screen wide, never taller than the room above the ball', () => {
  for (const [vw, vh, by] of [[390, 780, 560], [466, 848, 610], [1280, 720, 520], [1920, 1080, 780]]) {
    const h = fanSize({ x: vw / 2, y: by }, vw, vh);
    assert.ok(2 * h <= 0.75 * vw, `width ${(200 * h / vw).toFixed(0)}% of screen`);
    assert.ok(by + fanPt(0, 1, h).y > 0.1 * vh, 'arc stays below the top HUD');
    if (vw < vh) assert.ok(2 * h > 0.6 * vw, 'fills most of a phone screen width');
  }
});

test('drawFan(): band built once per size, placed on the ball and turned to the aim line; arrow redrawn every frame', () => {
  const html = [], set = {}, attrs = {};
  let o = { x: 233, y: 600 }, A = { x: 233, y: 560 };
  const body = `let fanKey='',fanH=0,aimYaw=0,pendOffset=0;const vw=466,vh=848;
    const ball={p:{x:0,z:0}};
    const fanScreen=(x,z)=>(x===0&&z===0?env.o():env.A());
    const $=id=>({set innerHTML(v){env.html.push(v);},setAttribute(k,v){if(k==='points')env.set[id]=v;else env.attrs[id]=v;}});
    ${block('// <fan-draw>', '// </fan-draw>')}
    return {drawFan,setOff:v=>{pendOffset=v;}};`;
  const w = new Function('env', 'FAN', 'fanSize', 'fanStatic', 'fanArrow', 'fx1', body)({ html, set, attrs, o: () => o, A: () => A }, FAN, fanSize, fanStatic, fanArrow, v => v.toFixed(1));
  w.drawFan(); assert.equal(html.length, 1);
  assert.equal(attrs.fanStatic, 'translate(233.0 600.0) rotate(0.00)');
  assert.deepEqual(Object.keys(set).sort(), ['arrL', 'arrR', 'arrSL', 'arrSR']);
  const first = { ...set };
  w.setOff(0.5); w.drawFan(); assert.equal(html.length, 1, 'band not rebuilt when only the arrow moved'); assert.notEqual(set.arrL, first.arrL);
  A = { x: 263, y: 570 }; w.drawFan(); assert.equal(html.length, 1); assert.equal(attrs.fanArrow, 'translate(233.0 600.0) rotate(45.00)', 'turned to the aim line');
  o = { x: 233, y: 220 }; A = { x: 233, y: 200 }; w.drawFan(); assert.equal(html.length, 2, 'rebuilt when the size changes');
});
