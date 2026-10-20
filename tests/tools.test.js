// The authoring tools in tests/tools/: they run, parse their arguments, fail loudly on bad input, and agree with the code they wrap.
// Not covered: render.py's browser run (it needs Chromium and a three.js fetch; only its --help and syntax are checked here).
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadCourse } = require('./harness');
const { playShot } = require('./hole-play');
const { analyze } = require('./tools/slope-stats');

const root = path.join(__dirname, '..');
const node = (tool, argv) => spawnSync(process.execPath, [path.join(__dirname, 'tools', tool), ...argv], { cwd: root, encoding: 'utf8' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fred-tools-'));

test('probe: prints what hole-play.js plays, as JSON, for one shot or several; bad input is refused', () => {
  const shots = [{ from: [0, 334], club: 'Iron', at: [18, 464] }, { from: [0, 334], club: 'Iron', at: [18, 464], offset: -0.25 }];
  const r = node('probe.js', ['standrews-17', JSON.stringify(shots), '--json']);
  assert.equal(r.status, 0, r.stderr);
  const rows = JSON.parse(r.stdout);
  const course = loadCourse(); course.prepHole(course.HOLES.findIndex(h => h.id === 'standrews-17'));
  assert.equal(rows.length, 2);
  shots.forEach((s, i) => { const e = playShot(course, s); assert.equal(rows[i].end, e.end); assert.equal(rows[i].surf, e.surf); assert.ok(Math.abs(rows[i].toPin - e.toPin) < 1e-9); });
  assert.equal(rows[1].surf, 'SAND', 'the pulled shot is in the Road Hole bunker (the same shot the hole check asserts)');
  assert.equal(JSON.parse(node('probe.js', ['pebble-8', JSON.stringify(shots[0]), '--json']).stdout).length, 1, 'a single object is accepted');
  assert.match(node('probe.js', ['pebble-8', '{"club":"Iron"}']).stdout, /pin at/, 'the table form runs');
  assert.notEqual(node('probe.js', ['nowhere-1', '[]']).status, 0);
  assert.match(node('probe.js', ['nowhere-1', '[]']).stderr, /Known holes/);
  assert.notEqual(node('probe.js', ['pebble-8', 'not json']).status, 0);
  assert.notEqual(node('probe.js', ['pebble-8', '{"club":"Putter9"}']).status, 0, 'an unknown club is an error, not a silent default');
});

test('aimscan: scores a grid of aim points for a sharp and a shaky player and names the best; bad grids are refused', () => {
  const r = node('aimscan.js', ['sawgrass-17', 'tee', 'Iron', '-6,0,135,141,3', '--n=5']);
  assert.equal(r.status, 0, r.stderr);
  const rows = r.stdout.split('\n').filter(l => /^\s+-?\d/.test(l));
  assert.equal(rows.length, 3 * 3, 'a 3 x 3 grid');
  assert.match(r.stdout, /best for sharp: \(.*\) \d\.\d\d\s+best for shaky: \(.*\) \d\.\d\d/);
  assert.equal(r.stdout.split('<').length - 1 >= 2, true, 'a best row is marked in each skill column');
  assert.match(node('aimscan.js', ['sawgrass-17', 'tee', 'Iron', '-6,0,135,141,3', '--n=5', '--no-recovery']).stdout, /no recovery term/);
  assert.notEqual(node('aimscan.js', ['sawgrass-17', 'tee', 'Iron', '0,1,0,1']).status, 0, 'a grid needs five numbers');
  assert.notEqual(node('aimscan.js', ['sawgrass-17', 'tee', 'Iron', '0,100,0,100,1']).status, 0, 'and not ten thousand points');
});

test('slope: writes a PNG, the four bands add up, Pinehurst No. 5 keeps its plateau, and --strict fails on a bound outside the defaults', () => {
  const r = node('slope.js', ['pinehurst-5', `--out=${tmp}`]);
  assert.equal(r.status, 0, r.stderr);
  const file = path.join(tmp, 'pinehurst-5-slope.png');
  assert.equal(fs.readFileSync(file).subarray(1, 4).toString(), 'PNG');
  const shares = ['< 1 %', '1 – 2.5 %', '2.5 – 4 %', '> 4 %'].map(b => +new RegExp(`${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)%`).exec(r.stdout)[1]);
  const sum = shares.reduce((a, b) => a + b, 0);
  assert.ok(sum >= 98 && sum <= 102, `bands add to ~100 (${shares.join('+')})`);
  assert.ok(shares[3] >= 28 && shares[3] <= 36, `the falloff ring is about a third of the surface (${shares[3]}%)`);
  assert.ok(shares[1] > shares[2] && shares[0] >= 5, 'a gentle top with flat pockets');
  assert.equal((r.stdout.match(/^  ok /gm) || []).length, 4, 'all four realism bounds hold for the plateau');
  assert.equal(node('slope.js', ['pinehurst-5', `--out=${tmp}`, '--ring-max=1', '--strict']).status, 1, 'ring-max=1 is violated; --strict exits non-zero');
  assert.equal(node('slope.js', ['pinehurst-5', `--out=${tmp}`, '--ring-max=1']).status, 0, 'without --strict a WARN is only a warning');
  assert.notEqual(node('slope.js', ['nowhere-1']).status, 0);
});

test('slope bounds: the shipped plateau passes, the rejected first Pinehurst dome is flagged on every bound, a tilted plane is not called a dome', () => {
  const course = loadCourse(), id = n => course.HOLES.findIndex(h => h.id === n);
  const ids = a => a.checks.filter(c => !c.ok).map(c => c.id).join();
  const i = id('pinehurst-5'), hole = course.HOLES[i], saved = hole.features;
  try {
    course.prepHole(i);
    assert.equal(ids(analyze(course)), '', 'the plateau: ring, gentle top, flat pockets, no dome');
    const f = saved.find(f => f.type === 'hollow' && f.depth < 0 && f.flat);
    hole.features = [...saved.filter(x => x !== f), { ...f, flat: 0, depth: -2.8 }];           // the first build: a dome, steepest halfway out ("a turtle shell")
    course.prepHole(i);
    const dome = analyze(course);
    assert.ok(dome.coherence < 0.2 && dome.share[3] > 90, `a dome points every which way (coherence ${dome.coherence.toFixed(2)}) and is steep almost everywhere`);
    assert.equal(ids(dome), 'ring,top,pockets,dome', 'flagged on all four');
  } finally { hole.features = saved; course.prepHole(i); }
  course.prepHole(id('pebble-8'));
  const plane = analyze(course);
  assert.ok(plane.coherence > 0.95 && plane.share[2] > 90, 'Pebble Beach No. 8 is one tilted plane in the 2.5–4 % band');
  assert.ok(plane.checks.find(c => c.id === 'dome').ok, 'a tilted plane is not a dome, though it has no flat pockets (that one is a WARN for the spec to justify)');
});

test('validate: refuses a hole that has no checks yet, and says what to do', () => {
  const r = node('validate.js', ['nowhere-1']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no checks for 'nowhere-1'.*hole-checks\.js/s);
  assert.equal(node('validate.js', []).status, 2);
});

test('trace: the camera fit finds a known camera, and the landmarks two views share, from their pixels alone', () => {
  const { makeCam, fitAll } = require('./tools/trace');
  const D = Math.PI / 180, ground = () => 0;
  const truth = [{ x: 6, y: 25, z: 60, yaw: -6 * D, pitch: -14 * D, roll: 0, vfov: 30 }, { x: 0, y: 12, z: -10, yaw: 1 * D, pitch: -5 * D, roll: 0, vfov: 25 }];
  const cams = truth.map(p => makeCam(p, 400, 500));
  const anchor = [0, 0, 144], marks = { a: [10, 140], b: [-8, 120], c: [4, 118], d: [-5, 155], e: [12, 150] };
  const px = (cam, [x, z]) => cam.project([x, 0, z]);
  const T = {
    views: truth.map((p, i) => ({
      name: `v${i}`, image: { w: 400, h: 500 },
      camera: { fix: i ? { roll: 0, x: 0, z: -10 } : { roll: 0 }, start: i ? { pos: [0, 8, -10], look: [0, 0, 144], vfov: 20 } : { pos: [0, 20, 90], look: [0, 0, 144], vfov: 40 },
        constraints: [{ type: 'point', name: 'anchor', px: cams[i].project(anchor), at: [0, 144] },
          ...(i ? [] : [{ type: 'vertical', name: 'stick', base: px(cams[i], [-3, 138]), top: cams[i].project([-3, 1.7, 138]), height: 1.7 }]),
          ...Object.entries(marks).map(([n, q]) => ({ type: 'point', landmark: n, px: px(cams[i], q) }))] },
    })),
    landmarks: Object.fromEntries(Object.keys(marks).map(n => [n, { start: [0, 140] }])),
  };
  const f = fitAll(T, ground);
  assert.ok(f.rms < 0.05, `exact pixels fit to ${f.rms.toFixed(3)} px`);
  assert.ok(f.equations > f.unknowns, `${f.equations} equations for ${f.unknowns} unknowns`);
  for (const [n, q] of Object.entries(marks)) assert.ok(Math.hypot(f.L[n][0] - q[0], f.L[n][1] - q[1]) < 0.2, `landmark ${n} at (${f.L[n].map(v => v.toFixed(2))}), truly (${q})`);
  for (const k of ['x', 'y', 'z', 'vfov']) assert.ok(Math.abs(f.views[0].p[k] - truth[0][k]) < 0.3, `view 0 ${k} ${f.views[0].p[k].toFixed(2)} vs ${truth[0][k]}`);
  assert.ok(Math.abs(f.views[0].p.yaw - truth[0].yaw) < 0.3 * D, 'and its yaw');
  // a pixel back-projects onto the ground where it came from
  const cam = f.views[0].cam, g = require('./tools/trace').hitGround(cam, cam.project([7, 0, 130]), ground);
  assert.ok(Math.hypot(g[0] - 7, g[2] - 130) < 0.05);
});

test('trace: Riviera No. 6 is traced from two photos to within a few pixels, and the hole plays the traced shapes', () => {
  const r = node('trace.js', ['riviera-6', '--json']);
  assert.equal(r.status, 0, r.stderr);
  const R = JSON.parse(r.stdout);
  assert.equal(R.views.length, 2, 'the aerial and the tee photo');
  assert.ok(R.rms < 3 && R.views.every(v => v.rms < 3), `rms ${R.rms.toFixed(2)} px`);
  assert.ok(R.equations - R.unknowns >= 5, 'over-determined, so the residual is a check');
  for (const o of R.outlines) assert.ok(o.iou > 0.95, `${o.name}: the hole's shape is the traced one (IoU ${o.iou.toFixed(2)})`);
  const mid = R.outlines.find(o => o.name === 'middle');
  assert.ok(Math.abs(mid.traced.area / mid.raw.area - 4) < 0.6, 'the middle bunker is the one outline exaggerated (x2 across, x4 in area)');
  const txt = node('trace.js', ['riviera-6']).stdout;
  assert.match(txt, /sensitivity/); assert.match(txt, /to spare: the residual is a real check/);
  assert.notEqual(node('trace.js', ['nowhere-1']).status, 0, 'no trace file: refused');
});

const py = spawnSync('python3', ['-c', 'import PIL'], { encoding: 'utf8' });
test('card.py: a placeholder card of the right size, not blank; render.py parses', { skip: py.status !== 0 && 'python3 with Pillow not available' }, () => {
  const out = path.join(tmp, 'card99.jpg');
  const r = spawnSync('python3', ['tests/tools/card.py', '99', 'Test Course', '4', '412', '--theme', 'links', '--out', out], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const jpg = fs.readFileSync(out);
  assert.equal(jpg[0], 0xff); assert.equal(jpg[1], 0xd8);
  const dims = spawnSync('python3', ['-c', `from PIL import Image; im=Image.open(${JSON.stringify(out)}); print(im.size[0], im.size[1], len(set(im.convert('RGB').getdata())) > 200)`], { encoding: 'utf8' }).stdout.trim();
  assert.equal(dims, '474 592 True');
  assert.notEqual(spawnSync('python3', ['tests/tools/card.py', 'x', 'y', '4', '1'], { cwd: root }).status, 0, 'bad arguments are refused');
  assert.equal(spawnSync('python3', ['tests/tools/render.py', '--help'], { cwd: root }).status, 0, 'render.py parses and prints its help without needing a browser');
  assert.match(spawnSync('python3', ['tests/tools/render.py', '--help'], { cwd: root, encoding: 'utf8' }).stdout, /ref\s+every reference photo's matched camera/);
});

test('trace_photo: fill traces a bright bunker on a synthetic photo to within a few per cent of its area; hash reports size and sha256', { skip: py.status !== 0 && 'python3 with Pillow not available' }, () => {
  const img = path.join(tmp, 'synthetic.png');
  const mk = spawnSync('python3', ['-c', `from PIL import Image, ImageDraw; im=Image.new('RGB',(200,160),(60,110,40)); d=ImageDraw.Draw(im); d.ellipse((40,50,160,110),fill=(205,190,170)); im.save(${JSON.stringify(img)})`], { encoding: 'utf8' });
  assert.equal(mk.status, 0, mk.stderr);
  const r = spawnSync('python3', ['tests/tools/trace_photo.py', 'fill', img, '100,80', '--eps', '0.5'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const P = JSON.parse(r.stdout); let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1];
  const want = Math.PI * 60 * 30;
  assert.ok(Math.abs(Math.abs(a / 2) - want) / want < 0.05, `outline area ${Math.abs(a / 2).toFixed(0)} vs ${want.toFixed(0)} px²`);
  const h = JSON.parse(spawnSync('python3', ['tests/tools/trace_photo.py', 'hash', img], { cwd: root, encoding: 'utf8' }).stdout);
  assert.equal(h.w, 200); assert.equal(h.h, 160); assert.match(h.sha256, /^[0-9a-f]{64}$/);
});

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
