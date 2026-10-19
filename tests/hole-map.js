// Top-down design maps of every hole, drawn from the game's REAL terrain code (heights, surfaces, water, features),
// with each hole's validation shots traced on top (see hole-checks.js). One PNG per hole in docs/maps/.
//   node tests/hole-map.js            all holes
//   node tests/hole-map.js pebble-8   one hole
// Legend: surfaces in their game colors, thin dark contour lines every 1 yd of height (bold every 5),
// shot traces: white = ended on dry ground, red = water / out of bounds; a dot marks the first bounce.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { loadCourse } = require('./harness');
const { playShot, CHECKS, resolvePoint } = require('./hole-play');

function png(w, h, rgb) {
  const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const SURF_COL = ['#6fae4a', '#7cc04f', '#3f7d34', '#8fd068', '#a6e07a', '#ecd9a0', '#3a78c0', '#a8743c'].map(hex);

function draw(course, hi, outDir) {
  course.prepHole(hi);
  const H = course.H, S = course.S, bb = course.HOLE.bbox, g = course.game;
  const sc = 2;                                                           // pixels per yard
  const W = Math.round((bb.x1 - bb.x0) * sc), Ht = Math.round((bb.z1 - bb.z0) * sc);
  const img = Buffer.alloc(W * Ht * 3);
  // screen-left is +x, so draw x mirrored: left of the image = +x, and the hole plays up the page (+z)
  const toPx = (x, z) => [Math.round((bb.x1 - x) * sc), Math.round((bb.z1 - z) * sc)];
  const hs = new Float32Array(W * Ht);
  for (let py = 0; py < Ht; py++) for (let px = 0; px < W; px++) {
    const x = bb.x1 - (px + 0.5) / sc, z = bb.z1 - (py + 0.5) / sc;
    const h = H(x, z), s = S(x, z); hs[py * W + px] = h;
    let c = SURF_COL[s] || [255, 0, 255];
    if (s === g.ROUGH) { const shade = Math.max(0.55, Math.min(1.25, 1 + h * 0.025)); c = c.map(v => v * shade); }
    if (s === g.WATER) c = [58, 120, 192];
    else if (course.BODIES.some(b => b.sd(x, z) > 0)) c = [122, 92, 70];   // cliff / bank below the waterline
    const o = (py * W + px) * 3; img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2];
  }
  for (let py = 1; py < Ht; py++) for (let px = 1; px < W; px++) {    // contours
    const a = hs[py * W + px], l = hs[py * W + px - 1], u = hs[(py - 1) * W + px];
    for (const step of [5, 1]) {
      if (Math.floor(a / step) !== Math.floor(l / step) || Math.floor(a / step) !== Math.floor(u / step)) {
        const o = (py * W + px) * 3, k = step === 5 ? 0.45 : 0.78; img[o] *= k; img[o + 1] *= k; img[o + 2] *= k; break;
      }
    }
  }
  const dot = (x, z, col, r = 1) => { const [px, py] = toPx(x, z); for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) { const X = px + i, Y = py + j; if (X >= 0 && Y >= 0 && X < W && Y < Ht) { const o = (Y * W + X) * 3; img[o] = col[0]; img[o + 1] = col[1]; img[o + 2] = col[2]; } } };
  // validation shots
  const checks = CHECKS[course.HOLE.id] || {};
  const shots = [...(checks.shots || []).map(s => s.shot), ...(checks.strategies || []).flatMap(s => s.plans.map(p => ({ ...p.shot, offset: 0 })))];
  for (const shot of shots) {
    const r = playShot(course, shot, { trace: true });
    const bad = r.end === 'water' || r.end === 'oob';
    for (const p of r.path) dot(p.x, p.z, bad ? [230, 40, 40] : [255, 255, 255], 0);
    if (r.first) dot(r.first.x, r.first.z, [20, 20, 20], 1);
    dot(r.p.x, r.p.z, bad ? [230, 40, 40] : [255, 225, 77], 2);
  }
  dot(0, 0, [255, 255, 255], 3); dot(course.PIN.x, course.PIN.z, [255, 46, 136], 3);
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${course.HOLE.id}.png`);
  fs.writeFileSync(file, png(W, Ht, img));
  return file;
}

if (require.main === module) {
  const course = loadCourse(), want = process.argv[2];
  const out = path.join(__dirname, '..', 'docs', 'maps');
  course.HOLES.forEach((h, i) => { if (!want || h.id === want) console.log('wrote', draw(course, i, out)); });
}
module.exports = { draw };
