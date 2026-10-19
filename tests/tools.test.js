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
});

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
