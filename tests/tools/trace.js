#!/usr/bin/env node
// trace.js — turn outlines traced on a reference photo into hole coordinates, and find the camera that took the photo (the Visual review step,
// docs/ICONIC-HOLES.md §2, step 7).
//
//   node tests/tools/trace.js <id> [--write] [--snippet] [--json]
//
// Reads docs/holes/trace/<id>.json: the photo's size and hash (the photo itself is not in the repo), camera constraints, and outlines traced in the
// photo's pixels (u right, v down; tests/tools/trace_photo.py helps read them off). Then:
//   1. fits a pinhole camera (position, yaw, pitch, roll, vertical field of view; principal point at the image centre) to the constraints by
//      least squares, holding any parameter named in camera.fix. Constraint types, all in photo pixels:
//        point     {px:[u,v], at:[x,z] | [x,y,z]}           a spot whose hole coordinates you have decided (y defaults to the ground there)
//        vertical  {base:[u,v], top:[u,v], height:h}        something upright of known height in game yards (a flagstick), standing on the ground
//        equal     {a:[[u,v],[u,v]], b:[[u,v],[u,v]]}       two ground segments of equal length (a round bunker's width and depth)
//        length    {a:[[u,v],[u,v]], yd:L}                   a ground segment of known length
//   2. back-projects every outline onto the ground (the hole's land before the green and bunkers are laid in: rawH), applies the outline's
//      declared exaggeration (scale about its centroid, shift), smooths it (closed Catmull-Rom) and resamples it every `step` yards (default 1).
//   3. compares each outline with the shape the hole has now (`game`: "green", "bunker:<i>" or omitted for a feature the hole lacks):
//      centroid offset, width (x span), depth (z span), area, and the overlap (IoU). After the traced shapes are in the hole, IoU should be ~1.
//   4. sensitivity: refits with the field of view 15° narrower and wider (when it is fixed) and prints how much each outline's size moves, so the
//      cost of the camera assumption is a number.
// --write   stores the fitted camera (camera.fit: what render.py's `ref` view uses) and each outline's hole points (`hole`) in the trace file
// --snippet prints each outline as `pts:[[x,z],...]` for the hole's entry in index.html
// --json    prints the report as JSON (for tests)
const fs = require('fs');
const path = require('path');
const { args, die, openHole } = require('./lib');

const TRACE_DIR = path.join(__dirname, '..', '..', 'docs', 'holes', 'trace');
const PARAMS = ['x', 'y', 'z', 'yaw', 'pitch', 'roll', 'vfov'];
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- camera
const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); } };

// p: {x,y,z,yaw,pitch,roll (radians), vfov (degrees)}; yaw as the game measures it (atan2(dx,dz)): 0 looks down the hole (+z); screen-right is -x
function makeCam(p, W, H) {
  const C = [p.x, p.y, p.z];
  const f = [Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), Math.cos(p.yaw) * Math.cos(p.pitch)];
  const r0 = [-Math.cos(p.yaw), 0, Math.sin(p.yaw)], u0 = v3.cross(r0, f);
  const cr = Math.cos(p.roll), sr = Math.sin(p.roll);
  const r = v3.add(v3.mul(r0, cr), v3.mul(u0, sr)), u = v3.sub(v3.mul(u0, cr), v3.mul(r0, sr));
  const fpx = (H / 2) / Math.tan(p.vfov * D2R / 2), cx = W / 2, cy = H / 2;
  return {
    C, f, r, u, fpx, W, H,
    project(P) { const d = v3.sub(P, C), zc = v3.dot(d, f); if (zc <= 0.01) return null; return [cx + fpx * v3.dot(d, r) / zc, cy - fpx * v3.dot(d, u) / zc]; },
    ray(px) { return v3.norm(v3.add(f, v3.add(v3.mul(r, (px[0] - cx) / fpx), v3.mul(u, -(px[1] - cy) / fpx)))); },
  };
}

// where a pixel's ray meets the ground (march, then bisect); null if it never does within 2 km
function hitGround(cam, px, ground) {
  const d = cam.ray(px), C = cam.C;
  const above = t => C[1] + d[1] * t - ground(C[0] + d[0] * t, C[2] + d[2] * t);
  let t0 = 0, t1 = 0.5;
  if (above(0) <= 0) return null;
  while (above(t1) > 0) { t0 = t1; t1 *= 1.15; if (t1 > 2000) return null; }
  for (let i = 0; i < 50; i++) { const m = (t0 + t1) / 2; above(m) > 0 ? t0 = m : t1 = m; }
  const t = (t0 + t1) / 2; return [C[0] + d[0] * t, C[1] + d[1] * t, C[2] + d[2] * t];
}

// the ground point a constraint names: fixed hole coordinates (`at`) or a landmark the fit is solving for
function anchorPoint(c, L, ground) {
  if (c.landmark) { const q = L[c.landmark]; if (!q) throw new Error(`unknown landmark '${c.landmark}'`); return [q[0], ground(q[0], q[1]), q[1]]; }
  return c.at.length === 3 ? c.at : [c.at[0], ground(c.at[0], c.at[1]), c.at[1]];
}
const nRes = c => (c.type === 'point' || c.type === 'vertical' ? 2 : 1);
function residuals(cam, cons, ground, L = {}) {
  const out = [];
  const BIG = 500;   // a constraint that cannot be evaluated (behind the camera, ray misses the ground) costs this many pixels
  for (const c of cons) {
    if (c.type === 'point') {
      const q = cam.project(anchorPoint(c, L, ground)); out.push(...(q ? [q[0] - c.px[0], q[1] - c.px[1]] : [BIG, BIG]));
    } else if (c.type === 'vertical') {
      const B = hitGround(cam, c.base, ground); const q = B && cam.project([B[0], B[1] + c.height, B[2]]);
      out.push(...(q ? [q[0] - c.top[0], q[1] - c.top[1]] : [BIG, BIG]));
    } else if (c.type === 'equal' || c.type === 'length') {
      const seg = s => { const A = hitGround(cam, s[0], ground), B = hitGround(cam, s[1], ground); return A && B ? Math.hypot(A[0] - B[0], A[2] - B[2]) : null; };
      const la = seg(c.a), lb = c.type === 'equal' ? seg(c.b) : c.yd;
      const pxLen = Math.hypot(c.a[1][0] - c.a[0][0], c.a[1][1] - c.a[0][1]);
      out.push(la && lb ? (la - lb) / la * pxLen : BIG);      // the mismatch, in pixels along segment a
    } else throw new Error(`unknown constraint type '${c.type}'`);
  }
  return out;
}

// Levenberg-Marquardt
function solve(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]]; if (Math.abs(M[i][i]) < 1e-14) return null;
    for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}
// image geometry of a view: the photo may sit inside a larger picture (a screenshot): `crop` [x0,y0,x1,y1] in its pixels. Pixel coordinates stay in
// the full picture's frame; the principal point is the crop's centre and the field of view spans the crop's height.
function frame(img) {
  const c = img.crop || [0, 0, img.w, img.h];
  return { W: c[2] - c[0], H: c[3] - c[1], ox: c[0], oy: c[1] };
}
function viewCam(p, img) {
  const f = frame(img), cam = makeCam(p, f.W, f.H);
  // shift between the crop's pixels and the full picture's
  const project = cam.project, ray = cam.ray;
  cam.project = P => { const q = project(P); return q && [q[0] + f.ox, q[1] + f.oy]; };
  cam.ray = px => ray([px[0] - f.ox, px[1] - f.oy]);
  return cam;
}
function startParams(camSpec, fix) {
  const st = camSpec.start || {};
  const pos = st.pos || [0, 40, 0], look = st.look || [0, 0, 100];
  const p = { x: pos[0], y: pos[1], z: pos[2], yaw: Math.atan2(look[0] - pos[0], look[2] - pos[2]),
    pitch: Math.atan2(look[1] - pos[1], Math.hypot(look[0] - pos[0], look[2] - pos[2])), roll: 0, vfov: st.vfov || 50 };
  for (const k in fix) p[k] = (k === 'yaw' || k === 'pitch' || k === 'roll') ? fix[k] * D2R : fix[k];
  return p;
}
// Fit every view's camera and every landmark together. fixOverride: {viewName: {param: value}} on top of each view's camera.fix
// alt: {fix: {viewName: {param: value}}, drop: [constraint names], add: {viewName: [constraints]}} on top of the trace file (for the sensitivity runs)
function fitAll(T, ground, alt = {}) {
  const fixOverride = alt.fix || {}, drop = alt.drop || [], add = alt.add || {};
  const views = T.views.map(v => {
    const fix = Object.assign({}, v.camera.fix || {}, fixOverride[v.name] || {});
    const vv = drop.length || add[v.name] ? Object.assign({}, v, { camera: Object.assign({}, v.camera, { constraints: [...v.camera.constraints.filter(c => !drop.includes(c.name)), ...(add[v.name] || [])] }) }) : v;
    return { v: vv, fix, p: startParams(v.camera, fix), free: PARAMS.filter(k => !(k in fix)) };
  });
  const lmNames = Object.keys(T.landmarks || {});
  const L0 = Object.fromEntries(lmNames.map(n => [n, (T.landmarks[n].start || [0, 0]).slice()]));
  // the unknowns, as one vector: each view's free camera parameters, then each landmark's x and z
  const keys = [];
  views.forEach((w, i) => w.free.forEach(k => keys.push({ view: i, k })));
  lmNames.forEach(n => { keys.push({ lm: n, k: 0 }); keys.push({ lm: n, k: 1 }); });
  const step = { x: 0.05, y: 0.05, z: 0.05, yaw: 1e-4, pitch: 1e-4, roll: 1e-4, vfov: 0.01 };
  const unpack = vec => {
    const ps = views.map(w => Object.assign({}, w.p)), L = Object.fromEntries(lmNames.map(n => [n, L0[n].slice()]));
    keys.forEach((key, i) => { if (key.lm) L[key.lm][key.k] = vec[i]; else ps[key.view][key.k] = vec[i]; });
    return { ps, L };
  };
  const cost = vec => {
    const { ps, L } = unpack(vec), r = [];
    views.forEach((w, i) => r.push(...residuals(viewCam(ps[i], w.v.image), w.v.camera.constraints, ground, L)));
    return { r, s: r.reduce((a, v) => a + v * v, 0) };
  };
  let x = keys.map(key => key.lm ? L0[key.lm][key.k] : views[key.view].p[key.k]), cur = cost(x), lam = 1e-3;
  for (let it = 0; it < 300; it++) {
    const J = keys.map((key, i) => { const h = key.lm ? 0.05 : step[key.k]; const a = x.slice(), b = x.slice(); a[i] += h; b[i] -= h; const ra = cost(a).r, rb = cost(b).r; return ra.map((v, n) => (v - rb[n]) / (2 * h)); });
    const JtJ = keys.map((_, i) => keys.map((_, j) => J[i].reduce((s, v, n) => s + v * J[j][n], 0)));
    const Jtr = keys.map((_, i) => J[i].reduce((s, v, n) => s + v * cur.r[n], 0));
    let improved = false;
    for (let tries = 0; tries < 12; tries++) {
      const A = JtJ.map((row, i) => row.map((v, j) => v + (i === j ? lam * (v || 1e-9) + 1e-12 : 0)));
      const dlt = solve(A, Jtr.map(v => -v)); if (!dlt) { lam *= 10; continue; }
      const q = x.map((v, i) => v + dlt[i]);
      if (keys.some((key, i) => key.k === 'vfov' && (q[i] < 5 || q[i] > 150))) { lam *= 10; continue; }
      const nq = cost(q);
      if (nq.s < cur.s) { const gain = cur.s - nq.s; x = q; cur = nq; lam = Math.max(lam / 3, 1e-9); improved = gain > 1e-10; break; }
      lam *= 10;
    }
    if (!improved) break;
  }
  const { ps, L } = unpack(x);
  let k = 0;
  const out = views.map((w, i) => {
    const n = w.v.camera.constraints.reduce((a, c) => a + nRes(c), 0), r = cur.r.slice(k, k + n); k += n;
    return { name: w.v.name, p: ps[i], cam: viewCam(ps[i], w.v.image), free: w.free, fix: w.fix, r, rms: Math.sqrt(r.reduce((a, v) => a + v * v, 0) / Math.max(1, n)) };
  });
  const n = cur.r.length;
  return { views: out, L, unknowns: keys.length, equations: n, rms: Math.sqrt(cur.s / Math.max(1, n)) };
}

// ---------------------------------------------------------------- outlines
const area = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return a / 2; };
function centroid(P) {
  let a = 0, cx = 0, cz = 0;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const k = P[j][0] * P[i][1] - P[i][0] * P[j][1]; a += k; cx += (P[j][0] + P[i][0]) * k; cz += (P[j][1] + P[i][1]) * k; }
  return [cx / (3 * a), cz / (3 * a)];
}
// closed Catmull-Rom through the points, resampled at equal arc length every `step` yards
function smoothResample(P, step) {
  const dense = [];
  for (let i = 0; i < P.length; i++) {
    const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i + 1) % P.length], p3 = P[(i + 2) % P.length];
    for (let t = 0; t < 1; t += 0.05) {
      const t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  const L = [0]; for (let i = 1; i <= dense.length; i++) L.push(L[i - 1] + Math.hypot(dense[i % dense.length][0] - dense[i - 1][0], dense[i % dense.length][1] - dense[i - 1][1]));
  const total = L[dense.length], n = Math.max(8, Math.round(total / step)), out = [];
  for (let k = 0, j = 0; k < n; k++) {
    const s = k * total / n; while (L[j + 1] < s) j++;
    const a = dense[j], b = dense[(j + 1) % dense.length], f = (s - L[j]) / ((L[j + 1] - L[j]) || 1);
    out.push([Math.round((a[0] + (b[0] - a[0]) * f) * 10) / 10, Math.round((a[1] + (b[1] - a[1]) * f) * 10) / 10]);
  }
  return area(out) < 0 ? out.reverse() : out;     // one winding for every outline (counter-clockwise in x,z)
}
function toHole(cam, o, ground) {
  const raw = o.px.map(px => { const g = hitGround(cam, px, ground); if (!g) throw new Error(`${o.name}: pixel ${px} does not reach the ground with this camera`); return [g[0], g[2]]; });
  let P = raw;
  const ex = o.exaggerate || {};
  if (ex.scale || ex.shift) {
    const [cx, cz] = centroid(P), k = ex.scale || 1, [sx, sz] = ex.shift || [0, 0];
    P = P.map(([x, z]) => [cx + (x - cx) * k + sx, cz + (z - cz) * k + sz]);
  }
  return { raw, pts: smoothResample(P, o.step || 1) };
}
const sdPolyFn = course => course.sdPoly;
function describe(P) {
  const xs = P.map(p => p[0]), zs = P.map(p => p[1]), [cx, cz] = centroid(P);
  return { cx, cz, width: Math.max(...xs) - Math.min(...xs), depth: Math.max(...zs) - Math.min(...zs), area: Math.abs(area(P)) };
}
// overlap of a traced polygon and the hole's current shape, sampled every 0.25 yd
function compare(course, P, shape) {
  const sd = sdPolyFn(course), ell = course.ell;
  const xs = P.map(p => p[0]), zs = P.map(p => p[1]);
  const b = { x0: Math.min(...xs, shape.x - shape.rx * 1.2), x1: Math.max(...xs, shape.x + shape.rx * 1.2), z0: Math.min(...zs, shape.z - shape.rz * 1.2), z1: Math.max(...zs, shape.z + shape.rz * 1.2) };
  let inter = 0, uni = 0, gA = 0, gx = 0, gz = 0, gx0 = 1e9, gx1 = -1e9, gz0 = 1e9, gz1 = -1e9; const st = 0.25;
  for (let x = b.x0; x <= b.x1; x += st) for (let z = b.z0; z <= b.z1; z += st) {
    const t = sd(x, z, P) > 0, g = ell(x, z, shape) < 1;
    if (t && g) inter++; if (t || g) uni++;
    if (g) { gA++; gx += x; gz += z; gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gz0 = Math.min(gz0, z); gz1 = Math.max(gz1, z); }
  }
  return { iou: uni ? inter / uni : 0, game: { cx: gx / gA, cz: gz / gA, width: gx1 - gx0, depth: gz1 - gz0, area: gA * st * st } };
}
function gameShape(course, ref) {
  if (!ref) return null;
  if (ref === 'green') return course.GREEN;
  const m = /^bunker:(\d+)$/.exec(ref); if (m) return course.BUNKERS[+m[1]] || null;
  throw new Error(`unknown game shape '${ref}': use green or bunker:<index>`);
}

// ---------------------------------------------------------------- main
function loadTrace(id) {
  const file = path.join(TRACE_DIR, `${id}.json`);
  if (!fs.existsSync(file)) die(`no trace file ${path.relative(process.cwd(), file)}: write one first (docs/ICONIC-HOLES.md §2, step 7)`);
  const T = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(T.views) || !T.views.length) die(`${file}: needs a "views" list (one per reference photo)`);
  return { T, file };
}
// the hole's terrain code from the working copy, or from a git ref (to compare the traced shapes with the hole as it was)
function course(id, ref) {
  if (!ref) return openHole(id).course;
  const { loadCourse } = require('../harness');
  const src = require('child_process').execSync(`git show ${ref}:index.html`, { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8', maxBuffer: 1 << 26 });
  const c = loadCourse(src), hi = c.HOLES.findIndex(h => h.id === id);
  if (hi < 0) die(`hole '${id}' is not in ${ref}`);
  c.prepHole(hi); return c;
}
function run(id, { ref } = {}) {
  const { T, file } = loadTrace(id);
  const C = course(id, null), cmp = ref ? course(id, ref) : C;
  if (!C.rawH || !C.sdPoly) die('this index.html has no rawH/sdPoly: trace.js needs the terrain code from the visual-review change');
  const ground = T.ground === undefined || T.ground === 'land' ? C.rawH : (x, z) => +T.ground;
  const fit = fitAll(T, ground); fit.groundAt = ground;
  const camOf = name => { const v = fit.views.find(w => w.name === (name || T.views[0].name)); if (!v) throw new Error(`no view '${name}'`); return v.cam; };
  const outlines = (T.outlines || []).map(o => {
    const h = toHole(camOf(o.view), o, ground), shape = gameShape(cmp, o.game);
    return { name: o.name, view: o.view || T.views[0].name, kind: o.kind, game: o.game || null, exaggerate: o.exaggerate || null, pts: h.pts, raw: describe(h.raw), traced: describe(h.pts), vs: shape ? compare(C, h.pts, shape) : null };
  });
  // sensitivity: refit under each alternative the trace file lists (a held parameter set differently, an assumption dropped) and see how far the
  // outlines move. Default: each held field of view 15° narrower and wider.
  const alts = T.sensitivity || T.views.flatMap(v => v.camera.fix && 'vfov' in v.camera.fix ? [-15, 15].map(d => ({ fix: { [v.name]: { vfov: v.camera.fix.vfov + d } } })) : []);
  const sens = alts.map(a => {
    const f2 = fitAll(T, ground, a);
    const cam2 = name => f2.views.find(w => w.name === (name || T.views[0].name)).cam;
    const label = [...Object.entries(a.fix || {}).map(([v, o]) => `${v} ${Object.entries(o).map(([k, x]) => `${k} ${x}`).join(', ')}`), ...(a.drop || []).map(d => `without "${d}"`), ...Object.values(a.add || {}).flat().map(c => `with "${c.name}"`)].join('; ');
    return { label, rms: f2.rms, outlines: (T.outlines || []).map(o => describe(toHole(cam2(o.view), o, ground).raw)) };
  });
  return { T, file, course: C, fit, outlines, sens, ref };
}

function report({ T, fit, outlines, sens, ref }) {
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), L = [];
  L.push(`${T.id}: ${T.views.length} reference photo${T.views.length > 1 ? 's' : ''} (not in the repo), ${Object.keys(T.landmarks || {}).length} landmarks solved for`);
  const dof = fit.equations - fit.unknowns;
  L.push(`fit     ${fit.equations} equations, ${fit.unknowns} unknowns (${dof > 0 ? `${dof} to spare: the residual is a real check` : dof === 0 ? 'exactly determined: no check, the residual is ~0 by construction' : 'UNDER-determined: hold more parameters or add constraints'}); rms ${f2(fit.rms)} px`);
  T.views.forEach((v, i) => {
    const w = fit.views[i], p = w.p, img = v.image, fr = frame(img);
    L.push('');
    L.push(`view ${v.name}: ${img.file} (${img.w} × ${img.h} px${img.crop ? `, photo ${fr.W} × ${fr.H} at ${fr.ox},${fr.oy}` : ''})`);
    L.push(`  camera at (${f1(p.x)}, ${f1(p.y)}, ${f1(p.z)}) yd, ${f1(p.y - fit.groundAt(p.x, p.z))} yd above the land; yaw ${f1(p.yaw / D2R)}°, pitch ${f1(p.pitch / D2R)}°, roll ${f1(p.roll / D2R)}°, vertical fov ${f1(p.vfov)}°`);
    L.push(`  fitted: ${w.free.join(', ') || 'nothing'}; held: ${Object.keys(w.fix).map(k => `${k} ${w.fix[k]}`).join(', ') || 'nothing'}; rms ${f2(w.rms)} px`);
    let k = 0;
    for (const c of v.camera.constraints) {
      const n = nRes(c), r = w.r.slice(k, k + n); k += n;
      L.push(`    ${c.type.padEnd(8)} ${String(c.name || c.landmark || '').padEnd(46)} residual ${r.map(f1).join(', ')} px`);
    }
  });
  if (Object.keys(fit.L).length) {
    L.push('');
    L.push('landmarks (solved, hole yards): ' + Object.entries(fit.L).map(([n, q]) => `${n} (${f1(q[0])}, ${f1(q[1])})`).join('; '));
  }
  if (outlines.length) {
    L.push('');
    L.push(`outline      kind     width × depth yd   area yd²   centroid (x, z)    | game shape ${ref ? `at ${ref}` : 'now'}: width × depth, area, centroid  overlap`);
    for (const o of outlines) {
      const t = o.traced, v = o.vs;
      const ex = o.exaggerate ? `  exaggerated${o.exaggerate.scale ? ` ×${o.exaggerate.scale}` : ''}${o.exaggerate.shift ? ` shift ${o.exaggerate.shift}` : ''} (as traced ${f1(o.raw.width)} × ${f1(o.raw.depth)}, ${o.raw.area.toFixed(0)} yd²)` : '';
      L.push(`${o.name.padEnd(12)} ${o.kind.padEnd(8)} ${(f1(t.width) + ' × ' + f1(t.depth)).padEnd(18)} ${t.area.toFixed(0).padStart(8)}   (${f1(t.cx)}, ${f1(t.cz)})`.padEnd(68) +
        (v ? `| ${f1(v.game.width)} × ${f1(v.game.depth)}, ${v.game.area.toFixed(0)}, (${f1(v.game.cx)}, ${f1(v.game.cz)})`.padEnd(50) + `IoU ${f2(v.iou)}` : '| (no such feature in the hole)') + ex);
    }
  }
  if (sens.length) {
    L.push('');
    L.push('sensitivity: each outline as traced (before exaggeration), width × depth yd, refitted under each alternative');
    L.push('  ' + ['as fitted', ...sens.map(s => s.label)].map((l, i) => `(${i}) ${l}`).join('   '));
    L.push('outline'.padEnd(13) + ['(0)', ...sens.map((_, i) => `(${i + 1})`)].map(v => v.padEnd(14)).join(''));
    (T.outlines || []).forEach((o, i) => L.push(o.name.padEnd(13) + [outlines[i].raw, ...sens.map(s => s.outlines[i])].map(d => `${f1(d.width)} × ${f1(d.depth)}`.padEnd(14)).join('')));
    L.push('rms px'.padEnd(13) + [fit.rms, ...sens.map(s => s.rms)].map(v => f2(v).padEnd(14)).join(''));
    const bad = sens.map((s, i) => s.rms > Math.max(3 * fit.rms, 2) ? i + 1 : 0).filter(Boolean);
    if (bad.length) L.push(`  ${bad.map(i => `(${i})`).join(', ')}: the photos do not fit that way (rms well above the fit's): it is ruled out, and its sizes mean nothing`);
  }
  return L.join('\n');
}

function writeBack(R) {
  R.fit.views.forEach((w, i) => {
    const { cam, p } = w;
    R.T.views[i].camera.fit = { pos: cam.C.map(v => +v.toFixed(3)), look: v3.add(cam.C, v3.mul(cam.f, 100)).map(v => +v.toFixed(3)), up: cam.u.map(v => +v.toFixed(5)),
      yaw: +(p.yaw / D2R).toFixed(3), pitch: +(p.pitch / D2R).toFixed(3), roll: +(p.roll / D2R).toFixed(3), vfov: +p.vfov.toFixed(3), rms: +w.rms.toFixed(3) };
  });
  for (const n in R.fit.L) R.T.landmarks[n].solved = R.fit.L[n].map(v => +v.toFixed(2));
  (R.T.outlines || []).forEach((o, i) => { o.hole = R.outlines[i].pts; });
  // compact: short number lists on one line, and each list of points on one line
  const txt = JSON.stringify(R.T, null, 2)
    .replace(/\[\s+(-?[\d.e-]+)(,\s+-?[\d.e-]+)*\s+\]/g, m => m.replace(/\s+/g, ''))
    .replace(/\[\s+(\[[-\d.,e]+\],?\s+)+\]/g, m => m.replace(/\s+/g, ''));
  fs.writeFileSync(R.file, txt + '\n');
}

if (require.main === module) {
  const { pos, flags } = args();
  if (pos.length < 1) die('usage: node tests/tools/trace.js <id> [--write] [--snippet] [--ref=<git ref>] [--json]');
  const R = run(pos[0], { ref: flags.ref });
  if (flags.json) {
    console.log(JSON.stringify({ rms: R.fit.rms, equations: R.fit.equations, unknowns: R.fit.unknowns, landmarks: R.fit.L,
      views: R.fit.views.map(w => ({ name: w.name, camera: w.p, rms: w.rms, free: w.free })),
      outlines: R.outlines.map(o => ({ name: o.name, traced: o.traced, raw: o.raw, iou: o.vs ? o.vs.iou : null, pts: o.pts })), sens: R.sens }));
  } else console.log(report(R));
  if (flags.snippet) {
    console.log('\n// paste into the hole in index.html (a green: green:{pts:...}; a bunker: {pts:..., depth, lip})');
    for (const o of R.outlines) console.log(`// ${o.name}\npts:${JSON.stringify(o.pts)}`);
  }
  if (flags.write) { writeBack(R); console.log(`\nwrote each view's camera.fit, the landmarks and the outlines' hole points to ${path.relative(process.cwd(), R.file)}`); }
}

module.exports = { makeCam, viewCam, hitGround, fitAll, smoothResample, run, report, frame };
