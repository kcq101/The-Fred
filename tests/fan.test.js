// The accuracy meter: a Golf Clash-style band just beyond the ball, placed on the ball and turned to the aim line through the game camera.
// Automated: ground geometry (extracted from index.html), a stand-in aiming camera (tests/camera.js), and the real drawFan() against stubbed DOM/camera.
// Not covered: the live three.js camera and how it looks on a phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const { SRC } = require('./harness');
const { makeCamera } = require('./camera');

const D2R = Math.PI / 180, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mix = (a, b, t) => a + (b - a) * t;
const block = (a, b) => SRC.slice(SRC.indexOf(a), SRC.indexOf(b));
const geo = new Function('D2R', 'clamp', 'mix', block('// <fan-geometry>', '// </fan-geometry>') + ';return {FAN,stops,fanColor,fanSize,fanPath,fanNearY,fanStatic,fanTip,fanArrow};')(D2R, clamp, mix);
const { FAN, stops, fanColor, fanSize, fanPath, fanNearY, fanStatic, fanTip, fanArrow } = geo;
const px = str => str.split(' ').map(p => p.split(',').map(Number));

test('the old flat HUD meter is gone', () => {
  assert.ok(!/pendBands|pendLayout|PEND_SWEEP|pendNeedle|pendHit|pendOk/.test(SRC));
  assert.match(SRC, /<div id="pend" hidden><svg aria-hidden="true">/);
});

test('band shape (Golf Clash): flat far edge, thick through the middle, thinning to the ends, near edge clear of the ball', () => {
  const thick = x => fanNearY(x) + FAN.far;                 // band thickness at x (units of half-width)
  assert.ok(thick(0) > 0.35 && thick(0) > 2.5 * thick(FAN.endX), `thick middle (${thick(0).toFixed(2)}), thin ends (${thick(FAN.endX).toFixed(2)})`);
  for (let x = FAN.cornerX; x < FAN.endX - 0.05; x += 0.05) assert.ok(thick(x + 0.05) < thick(x), `thins steadily past the middle arch (x ${x.toFixed(2)})`);
  assert.ok(thick(0) > 0.75 * thick(FAN.cornerX), 'the middle arch is shallow');
  assert.ok(FAN.sag < 0.03, 'far edge is essentially flat across the width');
  assert.ok(Math.abs(fanNearY(0.3) - fanNearY(-0.3)) < 1e-9, 'symmetric');
  assert.ok(-fanNearY(0) > FAN.base + 0.1, 'near edge sits beyond the start of the arrow, clear of the ball');
  assert.match(fanPath(100), /^M-100\.0 -92\.0Q/);
});

test('the gradient is smooth, green at dead center, red at the ends', () => {
  assert.equal(stops[0][0], 0); assert.equal(stops[stops.length - 1][0], 1);
  for (let i = 1; i < stops.length; i++) assert.ok(stops[i][0] > stops[i - 1][0]);
  const rgb = t => fanColor(t).match(/\d+/g).map(Number);
  assert.ok(rgb(0)[1] > rgb(0)[0] && rgb(0)[1] > rgb(0)[2], 'green at dead center'); assert.ok(rgb(1)[0] > 200 && rgb(1)[1] < 100, 'red at the ends');
  let worst = 0; for (let t = 0; t < 0.999; t += 0.005) worst = Math.max(worst, ...rgb(t).map((v, k) => Math.abs(v - rgb(t + 0.005)[k])));
  assert.ok(worst <= 8, `neighbouring shades differ by at most 8/255 (got ${worst})`);
  const html = fanStatic(150);
  assert.ok(html.includes('fanG') && html.includes('fanGd') && html.includes('fanHi') && (html.match(/<ellipse/g) || []).length >= 5, 'gradient body, darker rim, highlight, bullseye');
});

test('arrow: from just above the ball to the band, rides along the band, slim with a small head', () => {
  const h = 150;
  for (const u of [-1, -0.4, 0, 0.5, 1]) {
    const T = fanTip(u, h), pts = px(fanArrow(u, h)[0]).concat(px(fanArrow(u, h)[1]));
    const tip = pts.reduce((a, q) => (Math.hypot(q[0], q[1]) > Math.hypot(a[0], a[1]) ? q : a));
    assert.ok(Math.abs(tip[0] - T.x) < 0.2 && Math.abs(tip[1] - T.y) < 0.2, `tip at the band (u ${u})`);
    const ty = T.y / h, nearY = fanNearY(T.x / h); assert.ok(ty < nearY && ty > -FAN.far, `tip lies inside the band (u ${u})`);
    const base = Math.min(...pts.map(q => Math.hypot(q[0], q[1]))); assert.ok(Math.abs(base - FAN.base * h) < 1, 'starts clear of the ball');
  }
  assert.ok(fanTip(1, h).x > 0 && fanTip(-1, h).x < 0 && fanTip(0, h).x === 0, '+ = right');
  assert.ok(FAN.shaft1 * 2 <= 0.06 && FAN.head / FAN.shaft1 < 2.5, 'slim shaft, modest head');
});

test('size: about two-thirds of a phone screen wide, never taller than the room above the ball', () => {
  for (const [vw, vh, by] of [[390, 780, 560], [466, 848, 610], [1280, 720, 520], [1920, 1080, 780]]) {
    const h = fanSize({ x: vw / 2, y: by }, vw, vh);
    assert.ok(2 * h <= 0.68 * vw, `width ${(200 * h / vw).toFixed(0)}% of screen`);
    assert.ok(by - (FAN.far + FAN.eye) * h > 0.1 * vh, 'band and bullseye stay below the top HUD');
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
