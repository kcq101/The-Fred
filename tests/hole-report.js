// Before/after: every hole's declared checks (hole-checks.js) played on the current holes and on an older version of index.html.
// Shows that the iconic features change what happens, not just how the hole looks.
//   node tests/hole-report.js                    compare with the last commit before Phase 3 (548d49a)
//   node tests/hole-report.js <git-ref>          compare with any other version
//   node tests/hole-report.js [<git-ref>] --hole=<id>   only that hole's section (what a spec's §7 pastes)
// The ref must be in the clone's history: in a shallow clone run `git fetch --unshallow` first (see docs/ICONIC-HOLES.md, environment notes).
// The older version is matched hole by hole in order (it has no hole ids) and has no stance model or play profiles.
// Holes added after that version (Phase 4 onward) have no old twin; for those "before" is the same land and green with the signature stripped
// (no features, play profile, obstacles, bunkers or water): what the hole would be as a plain par with nothing to think about.
const { execSync } = require('child_process');
const path = require('path');
const { loadCourse } = require('./harness');
const { playShot, evaluate, CHECKS } = require('./hole-play');

const argv = process.argv.slice(2), only = (argv.find(a => a.startsWith('--hole=')) || '').slice(7) || null;
const ref = argv.find(a => !a.startsWith('--')) || '548d49a';
let oldSrc;
try { oldSrc = execSync(`git show ${ref}:index.html`, { cwd: path.join(__dirname, '..'), encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { console.error(`cannot read index.html at '${ref}': ${String(e.stderr || e.message).trim()}\nIn a shallow clone run: git fetch --unshallow`); process.exit(2); }
const now = loadCourse(), then = loadCourse(oldSrc), plain = loadCourse();
const oldCount = then.HOLES.length;
for (const h of plain.HOLES.slice(oldCount)) { h.features = []; h.play = {}; h.obstacles = []; h.bunkers = []; h.water = []; delete h.bridge; }
const before = hi => hi < oldCount ? then : plain;
const SKILL = { sharp: 0.2, shaky: 0.55 };
const pad = (s, n) => String(s).padEnd(n);
const pct = v => `${(v * 100).toFixed(0).padStart(3)}%`;
const fmt = r => `${r.end === 'rest' || r.end === 'holed' ? r.surf : r.end.toUpperCase()} ${r.toPin.toFixed(0)}y`;

for (const [hi, h] of now.HOLES.entries()) {
  const spec = CHECKS[h.id]; if (!spec || (only && h.id !== only)) continue;
  console.log(`\n=== ${h.name} (${h.id}) — ${spec.challenge}`);
  console.log(`${pad('shot', 78)} ${pad('before', 16)} after`);
  for (const c of spec.shots || []) {
    now.prepHole(hi); const a = playShot(now, c.shot);
    before(hi).prepHole(hi); const b = playShot(before(hi), c.shot);
    console.log(`${pad(c.name.slice(0, 77), 78)} ${pad(fmt(b), 16)} ${fmt(a)}`);
  }
  for (const s of spec.strategies || []) {
    console.log(`\n  strategy: ${s.name}`);
    console.log(`  ${pad('plan', 10)} ${pad('skill', 7)} ${pad('before: wet green score', 25)} after: wet green score`);
    const res = {};
    for (const p of s.plans) for (const [k, sp] of Object.entries(SKILL)) {
      now.prepHole(hi); const a = evaluate(now, p.shot, sp, 21, s.lieAdd);
      before(hi).prepHole(hi); const b = evaluate(before(hi), p.shot, sp, 21, s.lieAdd);
      (res[p.name] = res[p.name] || {})[k] = { a, b };
      const cell = r => `${pct(r.hazard)} ${pct((r.surfs.GREENS || 0) / r.n)} ${r.score.toFixed(2)}`;
      console.log(`  ${pad(p.name, 10)} ${pad(k, 7)} ${pad('      ' + cell(b), 25)}       ${cell(a)}`);
    }
    if (s.plans.length === 2) {                         // payoff of the first plan over the second, in expected strokes (positive = the first plan is better)
      const [p0, p1] = s.plans.map(p => p.name), gap = (k, w) => (res[p1][k][w].score - res[p0][k][w].score);
      console.log(`  payoff of ${p0} over ${p1} (strokes saved): ` + Object.keys(SKILL).map(k => `${k} ${gap(k, 'b').toFixed(2)} → ${gap(k, 'a').toFixed(2)}`).join(', ') + '   (before → after)');
    }
  }
}
console.log('\n"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).');
