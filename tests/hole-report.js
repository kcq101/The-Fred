// Before/after: every hole's declared checks (hole-checks.js) played on the current holes and on an older version of index.html.
// Shows that the iconic features change what happens, not just how the hole looks.
//   node tests/hole-report.js            compare with the last commit before Phase 3 (548d49a)
//   node tests/hole-report.js <git-ref>  compare with any other version
// The older version is matched hole by hole in order (it has no hole ids) and has no stance model or play profiles.
const { execSync } = require('child_process');
const path = require('path');
const { loadCourse } = require('./harness');
const { playShot, evaluate, CHECKS } = require('./hole-play');

const ref = process.argv[2] || '548d49a';
const oldSrc = execSync(`git show ${ref}:index.html`, { cwd: path.join(__dirname, '..'), encoding: 'utf8', maxBuffer: 1 << 26 });
const now = loadCourse(), then = loadCourse(oldSrc);
const SKILL = { sharp: 0.2, shaky: 0.55 };
const pad = (s, n) => String(s).padEnd(n);
const fmt = r => `${r.end === 'rest' || r.end === 'holed' ? r.surf : r.end.toUpperCase()} ${r.toPin.toFixed(0)}y`;

for (const [hi, h] of now.HOLES.entries()) {
  const spec = CHECKS[h.id]; if (!spec) continue;
  console.log(`\n=== ${h.name} (${h.id}) — ${spec.challenge}`);
  console.log(`${pad('shot', 78)} ${pad('before', 16)} after`);
  for (const c of spec.shots || []) {
    now.prepHole(hi); const a = playShot(now, c.shot);
    then.prepHole(hi); const b = playShot(then, c.shot);
    console.log(`${pad(c.name.slice(0, 77), 78)} ${pad(fmt(b), 16)} ${fmt(a)}`);
  }
  for (const s of spec.strategies || []) {
    console.log(`\n  strategy: ${s.name}`);
    console.log(`  ${pad('plan', 10)} ${pad('skill', 7)} ${pad('before: wet  score', 22)} after: wet  score`);
    for (const p of s.plans) for (const [k, sp] of Object.entries(SKILL)) {
      now.prepHole(hi); const a = evaluate(now, p.shot, sp);
      then.prepHole(hi); const b = evaluate(then, p.shot, sp);
      console.log(`  ${pad(p.name, 10)} ${pad(k, 7)} ${pad(`        ${(b.hazard * 100).toFixed(0).padStart(3)}%  ${b.score.toFixed(2)}`, 22)}        ${(a.hazard * 100).toFixed(0).padStart(3)}%  ${a.score.toFixed(2)}`);
    }
  }
}
console.log('\n"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).');
