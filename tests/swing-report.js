// Before/after comparison on the flat-ground mirror.  node tests/swing-report.js
// "Before" = the swing math at commit 11d2b3f (tests/legacy.js). "After" = SwingModel in index.html.
// Deterministic: both models are run with jitter switched off (rng = 0.5) except where a seed is stated.
const { loadGame, mulberry32, flatShot } = require('./harness');
const { legacyResolve, legacyClub } = require('./legacy');
const g = loadGame(), SM = g.SwingModel, FULL = g.CLUBS.filter(c => !c.putt), noJit = () => 0.5;
const f = (x, d = 0, w = 0) => x.toFixed(d).padStart(w);
const run = (model, club, off, rng = noJit) => { const m = model(club, off, rng); return flatShot(g, club, club.v0 * m.speedMult, m.yawErr, m.spinErr); };
const before = (c, o, r) => run(legacyResolve, legacyClub(c), o, r), after = (c, o, r) => run(SM.resolve, c, o, r);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const grid = (lo, hi, n = 200) => Array.from({ length: n }, (_, i) => lo + (hi - lo) * (i + 0.5) / n);

console.log('FLAT-GROUND MIRROR, still air, full pull, jitter off. carry/total in yards, lateral = sideways at rest.\n');
console.log('1) Needle offset -> result (before | after)');
console.log('club     |off |  carry       |  total       |  lateral      | error vector (carry shortfall + sideways)');
for (const c of FULL) {
  const ref = after(c, 0).carry;
  for (const o of [0, 0.2, 0.35, 0.5, 0.7, 1]) {
    const b = before(c, o), a = after(c, o);
    const vec = r => Math.hypot(ref - r.carry, r.lateral);
    console.log(`${c.name.padEnd(8)} |${f(o, 2, 4)}|${f(b.carry, 0, 5)} ->${f(a.carry, 0, 4)} |${f(b.total, 0, 5)} ->${f(a.total, 0, 4)} |${f(Math.abs(b.lateral), 1, 6)} ->${f(Math.abs(a.lateral), 1, 5)} |${f(vec(b), 1, 6)} ->${f(vec(a), 1, 5)}`);
  }
}
console.log('\n2) Expected outcome by player profile (release spread uniform over the stated needle range; avg of 200 releases)');
console.log('club     | profile (|offset| range) | avg carry lost  before->after | avg sideways yd before->after');
for (const c of FULL) for (const [n, hi] of [['sharp 0-0.10', 0.1], ['decent 0-0.35', 0.35], ['loose 0-1.00', 1]]) {
  const ref = after(c, 0).carry;
  const st = m => { const rs = grid(0, hi).map(o => m(c, o)); return [100 * (1 - mean(rs.map(r => r.carry)) / ref), mean(rs.map(r => Math.abs(r.lateral)))]; };
  const b = st(before), a = st(after);
  console.log(`${c.name.padEnd(8)} | ${n.padEnd(24)} | ${f(b[0], 1, 6)}% ->${f(a[0], 1, 5)}%       | ${f(b[1], 1, 6)} ->${f(a[1], 1, 5)}`);
}
console.log('\n3) Randomness on a PERFECT swing, 400 seeded shots (before | after): sd carry yd, sd lateral yd');
for (const c of FULL) { const sb = (m) => { const r = mulberry32(5); const rs = Array.from({ length: 400 }, () => m(c, 0, r)); return [sd(rs.map(x => x.carry)), sd(rs.map(x => x.lateral))]; }; const b = sb(before), a = sb(after); console.log(`${c.name.padEnd(8)} | carry ${f(b[0], 1)} -> ${f(a[0], 1)} | lateral ${f(b[1], 2)} -> ${f(a[1], 2)}`); }
console.log('\n4) Randomness on a WORST swing (offset 1.0), same 400 seeds: sd carry yd (before -> after). Before: jitter grew with mistiming; after: unchanged');
for (const c of FULL) { const sb = (m) => { const r = mulberry32(5); return sd(Array.from({ length: 400 }, () => m(c, 1, r).carry)); }; console.log(`${c.name.padEnd(8)} | ${f(sb(before), 1)} -> ${f(sb(after), 1)}`); }
console.log('\n5) Full-pull carry vs lie (after, perfect contact): rough/sand with the lie label the HUD now shows');
for (const c of FULL) for (const [n, lie] of [['Rough', g.ROUGH], ['Bunker', g.SAND]]) { const pen = g.lieMult(lie, c), r = flatShot(g, c, c.v0 * pen, 0, 0, undefined, lie), full = flatShot(g, c, c.v0, 0, 0); console.log(`${c.name.padEnd(8)} ${n.padEnd(6)} carry ${f(r.carry, 0, 4)} (flat fairway ${f(full.carry, 0)}), old label "-${Math.round((1 - pen) * 100)}% power", new label "-${Math.round((1 - SM.carryFactor(c, pen)) * 100)}% distance"`); }
console.log('\n6) Recovery after the worst contact from the tee on the 338-yd hole shape (Hammer, flat, no hazards): ball is left this far from the pin line');
{ const c = g.CLUBS[0], r = after(c, 1), tot = 338; console.log(`Hammer worst swing: total ${f(r.total)} yd, ${f(Math.abs(r.lateral), 1)} yd off line, ${f(tot - r.depth)} yd left to the pin -> reachable with ${tot - r.depth <= g.CLUBS[1].carry ? '3-Wood' : 'Hammer'} next (carry ${g.CLUBS[1].carry}/${g.CLUBS[0].carry}), i.e. one stroke lost, not a lost hole.`); }
