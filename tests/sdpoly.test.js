// sdPoly answers big outlines (32+ points: lidar coastlines, lakes) through a grid index. It must give exactly what the plain loop over every edge
// gives, inside or out, near the outline or far beyond it (the land to the horizon reads the sea's outline out to 1,250 yd).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCourse, mulberry32 } = require('./harness');

function brute(x, z, P) {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let d = 1e18, inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const ax = P[j][0], az = P[j][1], bx = P[i][0], bz = P[i][1]; const ex = bx - ax, ez = bz - az, wx = x - ax, wz = z - az;
    const t = clamp((wx * ex + wz * ez) / (ex * ex + ez * ez), 0, 1); const dx = wx - ex * t, dz = wz - ez * t; const q = dx * dx + dz * dz; if (q < d) d = q;
    if (((az > z) !== (bz > z)) && (x < ex * (z - az) / ez + ax)) inside = !inside;
  }
  return (inside ? 1 : -1) * Math.sqrt(d);
}

function outlines(o, out = []) {
  if (Array.isArray(o)) { o.forEach(v => outlines(v, out)); return out; }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
    if (k === 'pts' && Array.isArray(v) && v.length >= 32 && Array.isArray(v[0])) out.push(v); else outlines(v, out);
  }
  return out;
}

test('sdPoly: the index gives the brute-force answer on every big outline in HOLES', () => {
  const C = loadCourse();
  const polys = outlines(C.HOLES);
  assert.ok(polys.length > 5, 'expected several big outlines');
  const r = mulberry32(7);
  let n = 0;
  for (const P of polys) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const pts = [];
    for (let i = 0; i < 400; i++) pts.push([x0 + (r() * 1.4 - 0.2) * (x1 - x0), z0 + (r() * 1.4 - 0.2) * (z1 - z0)]);
    for (let i = 0; i < 60; i++) pts.push([(r() - 0.5) * 2500, (r() - 0.3) * 2500]);   // the horizon sheet's range
    for (const [x, z] of P.slice(0, 20)) pts.push([x, z]);                              // on a vertex
    for (const [x, z] of pts) { assert.equal(C.sdPoly(x, z, P), brute(x, z, P), `at ${x},${z}`); n++; }
  }
  assert.ok(n > 1000);
});
