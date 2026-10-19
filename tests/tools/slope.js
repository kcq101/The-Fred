#!/usr/bin/env node
// slope.js — green slope map and realism check for one hole.
//
//   node tests/tools/slope.js <id> [--out=docs/maps] [--scale=16] [--contour=0.05] [--e=0.2] [--ring-max=35] [--strict]
//
// Draws the putting surface from the game's REAL height function, shaded in the bands of a green-reading map:
//     < 1 %  pale green (flat)     1–2.5 %  yellow (gentle)     2.5–4 %  orange (moving)     > 4 %  red (steep)
// with contour lines (thin every --contour yd of height, bold every fifth) and arrows pointing the way a ball would roll. Everything off the green
// is dimmed; the pin is the magenta dot. Writes <out>/<id>-slope.png and prints the share of the putting surface in each band.
// Grade is rise over run from height differences of ±e yd. The default, 0.2, is the step the game's own normal() uses, so it is the slope the ball feels
// (it reproduces the Pinehurst No. 5 spec's 10 / 43 / 14 / 33 % to within a point of rounding).
//
// Realism bounds (see docs/ICONIC-HOLES.md §2, step 4): exaggerate the decision, not the shape. Defaults, each checked and printed as ok / WARN:
//   falloff ring   no more than ring-max % (35) of the surface steeper than 4 %
//   gentle top     of the surface that is not steep, at least half is 1–2.5 %
//   flat pockets   5–40 % of the surface under 1 % (some pockets to hold a ball; not a table)
//   no dome        not both: more than 60 % of the surface steeper than 2.5 % AND slopes pointing every which way (tilt coherence under 0.5; 1 = one tilted
//                  plane, 0 = radial). A dome is steepest halfway out and has no flat top, a "turtle shell"; a uniformly tilted green is not a dome
// A WARN is a prompt to look at the picture and justify it in the hole's spec §5; --strict turns it into a non-zero exit.
const fs = require('fs');
const path = require('path');
const { png } = require('../hole-map');
const { args, die, openHole } = require('./lib');

const { pos, flags } = args();
if (pos.length < 1) die('usage: node tests/tools/slope.js <id> [--out=docs/maps] [--scale=16] [--contour=0.05] [--e=0.2] [--ring-max=35] [--strict]');
const { course, hole } = openHole(pos[0]);
const g = course.game, H = course.H, G = course.GREEN;
const sc = +(flags.scale || 16), e = +(flags.e || 0.2), cint = +(flags.contour || 0.05), ringMax = +(flags['ring-max'] || 35);
const outDir = path.resolve(flags.out || path.join(__dirname, '..', '..', 'docs', 'maps'));

const { BANDS: NAMES, band, analyze } = require('./slope-stats');
const COL = [[207, 234, 176], [244, 226, 122], [240, 160, 64], [217, 71, 59]];

const A = analyze(course, { e, ringMax });
if (!A) die(`no putting surface found on ${pos[0]}`);
const { total, share, grad } = A;
const half = Math.max(G.rx, G.rz) + 1;

// ---- picture
const pad = 6, R = Math.max(G.rx, G.rz) * 1.2 + pad;
const box = { x0: G.x - R, x1: G.x + R, z0: G.z - R, z1: G.z + R };
const W = Math.round((box.x1 - box.x0) * sc), Ht = W;
const img = Buffer.alloc(W * Ht * 3), hs = new Float32Array(W * Ht);
const SURF_COL = ['#6fae4a', '#7cc04f', '#3f7d34', '#8fd068', '#a6e07a', '#ecd9a0', '#3a78c0', '#a8743c', '#8f887b', '#d8c28c'].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
// screen-left is +x (as in hole-map.js): the image is mirrored in x, and the hole plays up the page
const toPx = (x, z) => [Math.round((box.x1 - x) * sc), Math.round((box.z1 - z) * sc)];
for (let py = 0; py < Ht; py++) for (let px = 0; px < W; px++) {
  const x = box.x1 - (px + 0.5) / sc, z = box.z1 - (py + 0.5) / sc, s = course.S(x, z), h = H(x, z);
  hs[py * W + px] = h;
  const c = s === g.GREENS ? COL[band(grad(x, z).pct)] : (SURF_COL[s] || [255, 0, 255]).map(v => v * 0.45 + 70);
  const o = (py * W + px) * 3; img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2];
}
for (let py = 1; py < Ht; py++) for (let px = 1; px < W; px++) {      // contours
  const a = hs[py * W + px], l = hs[py * W + px - 1], u = hs[(py - 1) * W + px];
  for (const [step, k] of [[cint * 5, 0.5], [cint, 0.82]]) {
    if (Math.floor(a / step) !== Math.floor(l / step) || Math.floor(a / step) !== Math.floor(u / step)) { const o = (py * W + px) * 3; img[o] *= k; img[o + 1] *= k; img[o + 2] *= k; break; }
  }
}
const put = (X, Y, c) => { if (X >= 0 && Y >= 0 && X < W && Y < Ht) { const o = (Y * W + X) * 3; img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2]; } };
const line = (ax, ay, bx, by, c) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let k = 0; k <= n; k++) put(Math.round(ax + (bx - ax) * k / n), Math.round(ay + (by - ay) * k / n), c); };
const INK = [30, 24, 50];
const gap = 2.25;                                                      // arrows on a grid, in yards, inside the green only
for (let x = G.x - half; x <= G.x + half; x += gap) for (let z = G.z - half; z <= G.z + half; z += gap) {
  if (course.S(x, z) !== g.GREENS) continue;
  const q = grad(x, z); if (q.pct < 0.4) continue;
  const dx = -q.hx, dz = -q.hz, l = Math.hypot(dx, dz), len = Math.min(gap * 0.8, 0.5 + q.pct * 0.22) * sc;     // downhill, longer where steeper
  const [ax, ay] = toPx(x, z), ux = -dx / l, uy = dz / l;             // image y runs against z; image x against x
  const bx = ax + ux * len, by = ay + uy * len;
  line(ax, ay, bx, by, INK);
  for (const s of [-1, 1]) line(bx, by, bx - (ux * 0.8 - s * uy * 0.5) * 5, by - (uy * 0.8 + s * ux * 0.5) * 5, INK);
}
const [pxp, pyp] = toPx(course.PIN.x, course.PIN.z);
for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) if (i * i + j * j <= 16) put(pxp + i, pyp + j, i * i + j * j <= 6 ? [255, 46, 136] : [255, 255, 255]);
fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `${hole.id}-slope.png`);
fs.writeFileSync(file, png(W, Ht, img));

// ---- report and bounds
const f = v => v.toFixed(0).padStart(3) + '%';
console.log(`wrote ${path.relative(process.cwd(), file)}  (${hole.name}, ${total} cells of 0.25 yd on the putting surface, grade from ±${e} yd)`);
console.log('slope band shares of the putting surface:');
NAMES.forEach((n, i) => console.log(`  ${n.padEnd(10)} ${f(share[i])}  ${'#'.repeat(Math.round(share[i] / 2.5))}`));
let warn = 0;
console.log('realism bounds:');
for (const c of A.checks) { if (!c.ok) warn++; console.log(`  ${c.ok ? 'ok  ' : 'WARN'} ${c.what}  [${c.val}]`); }
if (warn) console.log(`  ${warn} bound${warn > 1 ? 's' : ''} outside the defaults: look at the picture and justify it in the spec's §5 (or reshape the green).`);
if (flags.strict && warn) process.exit(1);
