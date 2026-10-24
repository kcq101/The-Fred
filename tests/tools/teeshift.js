#!/usr/bin/env node
// Move a hole's tee along the hole: every along-the-hole coordinate (z) in its HOLES entry in index.html, and every shot position in its
// block of tests/hole-checks.js, grows by <dz> yards (positive: the tee moves back, the hole gets longer). The tee is hard-wired at the origin,
// so this is how a tee moves (it was a scratch script until 2026-10-23). Comments and formatting are kept: numbers are patched in place.
//
//   npm i --no-save acorn          (once; the only dependency)
//   node tests/tools/teeshift.js <id> <dz> [--dry]
//
// What moves: z, z0, z1 (not tilt.z: a slope); [x,z] points under pts / a / b; route and fw pairs ([z, x], [z, half]); fairway intervals;
// zone ranges z:[a,b]; in hole-checks.js, at:[x,z] and from:[x,z]. Afterwards: record the shift in the hole's trace file (tee_shift),
// re-run validate.js, log the move in the spec's §6, and repaint the card's yardage. The base landform noise (seed/roll/ridge) is in absolute
// coordinates, so it re-rolls under moved ground; lidar features move exactly. Other tests that name a position on the hole move by hand.
const fs = require('fs'), path = require('path');
const acorn = require('acorn');
const [id, dzs] = process.argv.slice(2), dry = process.argv.includes('--dry'), dz = +dzs;
if (!id || !Number.isFinite(dz)) { console.error('usage: node tests/tools/teeshift.js <id> <dz> [--dry]'); process.exit(1); }
const ROOT = path.join(__dirname, '..', '..');

const fmt = (old, v) => { const d = (old.split('.')[1] || '').length; let s = v.toFixed(d); if (/^-0(\.0*)?$/.test(s)) s = s.slice(1); return s; };
function numNode(n) { if (n.type === 'Literal' && typeof n.value === 'number') return n; if (n.type === 'UnaryExpression' && n.operator === '-' && n.argument.type === 'Literal') return n; return null; }
function shiftNum(src, n, edits) { const t = src.slice(n.start, n.end); edits.push([n.start, n.end, fmt(t, parseFloat(t) + dz)]); }
const pair = (n, idx, src, edits) => { if (n && n.type === 'ArrayExpression' && n.elements.length === 2) for (const i of idx) { const e = numNode(n.elements[i]); if (e) shiftNum(src, e, edits); } };
const keyOf = p => p.key && (p.key.name || p.key.value);

function walkHole(n, src, edits, parentKey) {
  if (!n) return;
  if (n.type === 'ObjectExpression') {
    for (const p of n.properties) {
      const k = keyOf(p), v = p.value;
      if (['z', 'z0', 'z1'].includes(k) && parentKey !== 'tilt' && numNode(v)) shiftNum(src, numNode(v), edits);
      else if (k === 'z' && v.type === 'ArrayExpression') pair(v, [0, 1], src, edits);               // a zone's z range
      else if (k === 'route' || k === 'fw') v.elements.forEach(e => pair(e, [0], src, edits));
      else if (k === 'fairway') v.elements.forEach(e => pair(e, [0, 1], src, edits));
      else if (k === 'pts') v.elements.forEach(e => pair(e, [1], src, edits));
      else if (k === 'a' || k === 'b') pair(v, [1], src, edits);
      else walkHole(v, src, edits, k);
    }
  } else if (n.type === 'ArrayExpression') n.elements.forEach(e => walkHole(e, src, edits, parentKey));
}
function walkChecks(n, src, edits) {
  if (!n || typeof n !== 'object') return;
  if (n.type === 'Property' && ['at', 'from'].includes(keyOf(n))) { pair(n.value, [1], src, edits); return; }
  for (const k of Object.keys(n)) { const v = n[k]; if (k === 'loc') continue; if (Array.isArray(v)) v.forEach(c => walkChecks(c, src, edits)); else if (v && typeof v.type === 'string') walkChecks(v, src, edits); }
}
const apply = (src, edits) => { edits.sort((a, b) => b[0] - a[0]); for (const [s, e, t] of edits) src = src.slice(0, s) + t + src.slice(e); return src; };

// index.html: the hole's object literal
const htmlPath = path.join(ROOT, 'index.html'); let html = fs.readFileSync(htmlPath, 'utf8');
const arr = acorn.parseExpressionAt(html, html.indexOf('[', html.indexOf('const HOLES=')), { ecmaVersion: 2022 });
const obj = arr.elements.find(e => e.type === 'ObjectExpression' && e.properties.some(p => keyOf(p) === 'id' && p.value.value === id));
if (!obj) { console.error(`no hole ${id} in index.html`); process.exit(1); }
const e1 = []; walkHole(obj, html, e1);
// tests/hole-checks.js: the hole's block
const chkPath = path.join(ROOT, 'tests', 'hole-checks.js'); let chk = fs.readFileSync(chkPath, 'utf8');
const ast = acorn.parse(chk, { ecmaVersion: 2022, sourceType: 'script' });
let block = null;
(function find(n) { if (!n || typeof n !== 'object' || block) return; if (n.type === 'Property' && keyOf(n) === id) { block = n.value; return; } for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(find); else if (v && typeof v.type === 'string') find(v); } })(ast);
const e2 = []; if (block) walkChecks(block, chk, e2);
console.log(`${id}: ${e1.length} numbers in index.html, ${e2.length} in hole-checks.js, moved by ${dz} yd${dry ? ' (dry run)' : ''}`);
if (!dry) { fs.writeFileSync(htmlPath, apply(html, e1)); fs.writeFileSync(chkPath, apply(chk, e2)); }
