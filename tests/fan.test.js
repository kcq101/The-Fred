// The accuracy meter: a see-through rainbow arc on the grass around the ball, placed on the ball and turned to the aim line through the game camera.
// Automated: ground geometry (extracted from index.html), a stand-in aiming camera (tests/camera.js), and the real drawFan() against stubbed DOM/camera.
// Not covered: the live three.js camera and how it looks on a phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const { SRC } = require('./harness');
const { makeCamera } = require('./camera');

const D2R = Math.PI / 180, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mix = (a, b, t) => a + (b - a) * t;
const block = (a, b) => SRC.slice(SRC.indexOf(a), SRC.indexOf(b));
const geo = new Function('D2R', 'clamp', 'mix', block('// <fan-geometry>', '// </fan-geometry>') + ';return {FAN,stops,fanColor,fanSize,fanEllipse,fanPt,fanInner,fanShiftFor,fanPiece,fanStatic,fanTip,fanArrow};')(D2R, clamp, mix);
const { FAN, stops, fanColor, fanSize, fanEllipse, fanPt, fanInner, fanShiftFor, fanPiece, fanStatic, fanTip, fanArrow } = geo;
const px = str => str.split(' ').map(p => p.split(',').map(Number));

test('the old flat HUD meter is gone', () => {
  assert.ok(!/pendBands|pendLayout|PEND_SWEEP|pendNeedle|pendHit|pendOk/.test(SRC));
  assert.match(SRC, /<div id="pend" hidden><svg aria-hidden="true">/);
});

test('arc shape: a ring around the ball in ground perspective, ends curving down and flaring to 1.5x the middle thickness', () => {
  const h = 150, e = fanEllipse(h);
  assert.ok(Math.abs(fanPt(FAN.sweep, 1, h).x - h) < 1e-9, 'outer end sits at the half-width');
  assert.ok(e.b < e.a && FAN.squash > 0.4 && FAN.squash < 0.8, 'flattened like a circle on the ground');
  assert.ok(fanPt(FAN.sweep, 1, h).y - fanPt(0, 1, h).y > 0.15 * h, 'ends curve down toward the ball');
  const thick = k => 1 - fanInner(k);
  assert.ok(Math.abs(thick(1) / thick(0) - 1.5) < 1e-9 && Math.abs(thick(-1) - thick(1)) < 1e-12, 'ends are 1.5x as thick as the middle');
  for (let k = 0; k < 1; k += 0.1) assert.ok(thick(k + 0.1) > thick(k), 'thickens steadily toward the ends');
  assert.ok(-fanPt(0, fanInner(0), h).y > FAN.base * e.b + 10, 'band is clear of the arrow\'s start');
  assert.ok(FAN.sweep <= 40 && FAN.size.w <= 0.3, 'shorter and narrower than the first arc');
});

test('rainbow is smooth, blue at dead center, red at the ends, and a little see-through', () => {
  assert.equal(stops[0][0], 0); assert.equal(stops[stops.length - 1][0], 1);
  for (let i = 1; i < stops.length; i++) assert.ok(stops[i][0] > stops[i - 1][0]);
  const rgb = t => fanColor(t).match(/\d+/g).map(Number);
  assert.ok(rgb(0)[2] > rgb(0)[0] && rgb(0)[2] > rgb(0)[1], 'blue at dead center'); assert.ok(rgb(1)[0] > 200 && rgb(1)[1] < 80, 'red at the ends');
  let worst = 0; for (let k = 0; k < 1; k += 2 / FAN.slices) worst = Math.max(worst, ...rgb(k).map((v, j) => Math.abs(v - rgb(k + 2 / FAN.slices)[j])));
  assert.ok(worst <= 15, `neighbouring slices differ by at most 15/255 (got ${worst})`);
  assert.ok(FAN.opacity >= 0.6 && FAN.opacity < 0.95, 'see-through but readable');
  const html = fanStatic(150);
  assert.match(html, new RegExp(`<g opacity="${FAN.opacity}">`));
  assert.ok((html.match(/<polygon/g) || []).length >= FAN.slices + 1, 'outline + slices');
});

test('draw / fade: the arc slides round the ring to the ball\'s starting direction, and the arrow with it', () => {
  const h = 150;
  assert.equal(fanShiftFor(0), 0);
  assert.ok(fanShiftFor(10) > 0 && fanShiftFor(-10) < 0, 'start right -> arc moves right');
  for (const psi of [-25, -8, 6, 20]) {           // the arc's middle lies on the start line as seen on screen
    const m = fanPt(fanShiftFor(psi), 1, h), seen = Math.atan2(m.x, -m.y) * 180 / Math.PI;
    assert.ok(Math.abs(seen - psi) < 1e-6, `middle of arc on the start line (${psi} deg)`);
  }
  const mid = pts => { const p = px(pts); return p.reduce((a, q) => a + q[0], 0) / p.length; };
  assert.ok(mid(fanPiece(h, 12, -1, 1, 20)) > mid(fanPiece(h, 0, -1, 1, 20)) + 20, 'shifted band sits further right');
  const l = mid(fanPiece(h, 12, -1, -0.8, 4)), r = mid(fanPiece(h, 12, 0.8, 1, 4));
  const yl = px(fanPiece(h, 12, -1, -0.8, 4)).reduce((a, q) => a + q[1], 0), yr = px(fanPiece(h, 12, 0.8, 1, 4)).reduce((a, q) => a + q[1], 0);
  assert.ok(l < r && yl < yr, 'and is skewed: its left end rises, its right end drops, like the ring turning');
  assert.ok(fanTip(0, h, 12).x > fanTip(0, h, 0).x, 'dead-center arrow follows the start line');
  assert.match(SRC, /fanYaw=aimYaw\+y;land=simArc\(sp,fanYaw,pts,spin\)/, 'drawGuide hands the start direction to the meter');
});

test('arrow: along a ray from the ball, from clear of the ball to inside the band, slim with a small head', () => {
  const h = 150;
  for (const u of [-1, -0.4, 0, 0.5, 1]) {
    const T = fanTip(u, h), pts = px(fanArrow(u, h)[0]).concat(px(fanArrow(u, h)[1]));
    const tip = pts.reduce((a, q) => (Math.hypot(q[0], q[1]) > Math.hypot(a[0], a[1]) ? q : a));
    assert.ok(Math.abs(tip[0] - T.x) < 0.2 && Math.abs(tip[1] - T.y) < 0.2, `tip (u ${u})`);
    const k = u * FAN.tipSweep; assert.ok(FAN.tipR > fanInner(k) && FAN.tipR < 1, `tip lands inside the band (u ${u})`);
    const base = pts[0]; assert.ok(Math.abs(base[0] * T.y - base[1] * T.x) / (Math.hypot(...base) * Math.hypot(T.x, T.y)) < 0.01, `base on the same ray (u ${u})`);
  }
  assert.ok(fanTip(1, h).x > 0 && fanTip(-1, h).x < 0 && fanTip(0, h).x === 0, '+ = right');
  assert.ok(FAN.shaft * 2 <= 0.05 && FAN.head / FAN.shaft < 3.2, 'slim shaft, modest head');
});

test('size: a bit over half a phone screen wide, never taller than the room above the ball', () => {
  for (const [vw, vh, by] of [[390, 780, 560], [466, 848, 610], [1280, 720, 520], [1920, 1080, 780]]) {
    const h = fanSize({ x: vw / 2, y: by }, vw, vh);
    assert.ok(2 * h <= 0.6 * vw, `width ${(200 * h / vw).toFixed(0)}% of screen`);
    assert.ok(by + fanPt(0, 1, h).y > 0.1 * vh, 'arc stays below the top HUD');
    if (vw < vh) assert.ok(2 * h > 0.45 * vw, 'still a good size on a phone');
  }
});

test('drawFan(): placed on the ball and turned to the aim line, rebuilt only when size or shift changes, arrow every frame', () => {
  const html = [], set = {}, attrs = {};
  let o = { x: 233, y: 600 }, A = { x: 233, y: 560 }, S = null;
  const body = `let fanKey='',fanBuilt='',fanH=0,fanShift=0,fanYaw=null,aimYaw=0,pendOffset=0;const vw=466,vh=848;
    const ball={p:{x:0,z:0}};
    const fanScreen=(x,z)=>(x===0&&z===0?env.o():Math.abs(x)<1e-9?env.A():env.S());
    const $=id=>({set innerHTML(v){env.html.push(v);},setAttribute(k,v){if(k==='points')env.set[id]=v;else env.attrs[id]=v;}});
    ${block('// <fan-draw>', '// </fan-draw>')}
    return {drawFan,setOff:v=>{pendOffset=v;},setStart:v=>{fanYaw=v;},shift:()=>fanShift};`;
  const w = new Function('env', 'FAN', 'fanSize', 'fanStatic', 'fanArrow', 'fanShiftFor', 'fx1', body)({ html, set, attrs, o: () => o, A: () => A, S: () => S }, FAN, fanSize, fanStatic, fanArrow, fanShiftFor, v => v.toFixed(1));
  w.drawFan(); assert.equal(html.length, 1);
  assert.equal(attrs.fanStatic, 'translate(233.0 600.0) rotate(0.00)');
  assert.deepEqual(Object.keys(set).sort(), ['arrL', 'arrR', 'arrSL', 'arrSR']);
  const first = { ...set };
  w.setOff(0.5); w.drawFan(); assert.equal(html.length, 1, 'band not rebuilt when only the arrow moved'); assert.notEqual(set.arrL, first.arrL);
  A = { x: 263, y: 570 }; w.drawFan(); assert.equal(html.length, 1); assert.equal(attrs.fanArrow, 'translate(233.0 600.0) rotate(45.00)', 'turned to the aim line');
  A = { x: 233, y: 560 }; S = { x: 253, y: 560 }; w.setStart(-0.1); w.drawFan();   // ball starts right of the aim line (negative yaw = right)
  assert.equal(html.length, 2, 'rebuilt when the start direction moves'); assert.ok(w.shift() > 0, 'arc shifted right');
});
