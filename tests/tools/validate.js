#!/usr/bin/env node
// validate.js — the whole "Validate" step for one hole in one command.
//
//   node tests/tools/validate.js <id> [--ref=<git ref>] [--all] [--strict]
//
//   1. hole tests    the hole's shot and strategy checks (tests/holes.test.js, filtered to <id>); --all runs every suite (node --test tests/*.test.js)
//   2. map           node tests/hole-map.js <id>      -> docs/maps/<id>.png
//   3. slope         node tests/tools/slope.js <id>   -> docs/maps/<id>-slope.png, band shares and the realism bounds
//   4. report        node tests/hole-report.js --hole=<id>   the hole's before → after section (paste it into the spec's §7)
// Exit code is non-zero if the tests fail or a step cannot run. Realism-bound WARNs from the slope step do not fail it unless --strict.
// The report step needs history: in a shallow clone run `git fetch --unshallow` first. The in-game views (tee, bird's-eye, key shot) are the one
// part left to do by hand: `python3 tests/tools/render.py <id>`.
const { spawnSync, execSync } = require('child_process');
const path = require('path');
const { args, die } = require('./lib');
const CHECKS = require('../hole-checks');

const { pos, flags } = args();
if (pos.length < 1) die('usage: node tests/tools/validate.js <id> [--ref=<git ref>] [--all] [--strict]');
const id = pos[0], root = path.join(__dirname, '..', '..');
if (!flags.all && !CHECKS[id]) die(`no checks for '${id}' in tests/hole-checks.js. Known: ${Object.keys(CHECKS).join(', ')}.\nWrite the hole's checks first (docs/ICONIC-HOLES.md §2, step 5).`);

const results = [];
const run = (label, cmd, argv, { quiet = false, parse } = {}) => {
  console.log(`\n━━ ${label} ${'━'.repeat(Math.max(3, 70 - label.length))}`);
  const r = spawnSync(cmd, argv, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
  const out = (r.stdout || '') + (r.stderr || '');
  if (!quiet) process.stdout.write(out); else if (r.status) process.stdout.write(out);
  const extra = parse ? parse(out) : '';
  results.push({ label, ok: r.status === 0, extra });
  return { r, out };
};

// 1. tests
const fs = require('fs');
const suites = fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.js')).map(f => path.join('tests', f));
const testArgs = flags.all ? ['--test', '--test-reporter=tap', ...suites]
  : ['--test', '--test-reporter=tap', `--test-name-pattern=^${id}:`, path.join('tests', 'holes.test.js')];
{
  const { out } = run(flags.all ? 'tests (all suites)' : `tests (${id} checks)`, process.execPath, testArgs, {
    quiet: true,
    parse: o => { const g = k => (/^# (\w+) (\d+)$/m.exec(o.split('\n').filter(l => l.startsWith(`# ${k} `)).join('\n')) || [])[2]; return `${g('pass') || 0} passed, ${g('fail') || 0} failed of ${g('tests') || 0}`; },
  });
  const ran = +((/^# tests (\d+)$/m.exec(out) || [])[1] || 0);
  if (!ran) { results[results.length - 1].ok = false; results[results.length - 1].extra = 'no tests matched'; }
  console.log(results[results.length - 1].extra);
}
// 2. map
run('map', process.execPath, ['tests/hole-map.js', id], { parse: o => (/wrote (\S+)/.exec(o) || [])[1] || '' });
// 3. slope
run('slope', process.execPath, ['tests/tools/slope.js', id, ...(flags.strict ? ['--strict'] : [])], { parse: o => (/(\d+) bounds? outside/.exec(o) ? `${/(\d+) bounds? outside/.exec(o)[1]} realism WARN` : 'bounds ok') });
// 4. report (needs history)
{
  const ref = flags.ref || '548d49a';
  let have = true;
  try { execSync(`git cat-file -e ${ref}^{commit}`, { cwd: root, stdio: 'ignore' }); } catch (e) { have = false; }
  if (!have) {
    console.log(`\n━━ report ${'━'.repeat(61)}\ncommit ${ref} is not in this clone (shallow?). Run: git fetch --unshallow`);
    results.push({ label: 'report', ok: false, extra: `no ${ref} in history` });
  } else run('report', process.execPath, ['tests/hole-report.js', ...(flags.ref ? [flags.ref] : []), `--hole=${id}`], { parse: () => '' });
}

console.log(`\n━━ summary: ${id} ${'━'.repeat(60)}`);
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.label.padEnd(30)} ${r.extra || ''}`);
process.exit(results.every(r => r.ok) ? 0 : 1);
