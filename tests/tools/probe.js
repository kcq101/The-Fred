#!/usr/bin/env node
// probe.js — play single shots on a hole's REAL terrain and print where each one ends.
//
//   node tests/tools/probe.js <id> '<json shots>' [--json]
//
// <json shots> is one shot object or an array of them, in the format documented at the top of tests/hole-play.js:
//   {from:'tee'|[x,z], club:'Hammer'|'3-Wood'|'Iron'|'Wedge', at:'pin'|[x,z], power:0..1, offset:-1..1, shape:-1..1, wind:{mph,dir:'head'|'tail'|'left'|'right'}}
// Leave `power` out to pull until the aiming arc lands on `at`, as a player would; `offset` is the needle on release (0 = dead center).
// An optional "name" labels the row. Prints, per shot: how it ended (rest/water/oob/holed), the surface and the yards to the pin, the first bounce
// (where, on what surface, how far from the pin), the carry, the power used, the stance the lie gave, and wall strikes. --json prints the raw results.
//
//   node tests/tools/probe.js standrews-17 '[{"from":[0,334],"club":"Iron","at":[18,464]},{"from":[0,334],"club":"Iron","at":[18,464],"offset":-0.25}]'
const { args, die, openHole, f1 } = require('./lib');
const { playShot } = require('../hole-play');

const { pos, flags } = args();
if (pos.length < 2) die("usage: node tests/tools/probe.js <id> '<json shots>' [--json]");
let shots;
try { shots = JSON.parse(pos[1]); } catch (e) { die(`could not parse the shots as JSON: ${e.message}`); }
if (!Array.isArray(shots)) shots = [shots];

const { course } = openHole(pos[0]);
const names = ['TEE', 'FAIRWAY', 'ROUGH', 'FRINGE', 'GREENS', 'SAND', 'WATER', 'PINE', 'ROAD', 'WASTE', 'PATH', 'LAWN'];
const pt = p => p == null ? '?' : (p === 'tee' ? 'tee' : p === 'pin' ? 'pin' : Array.isArray(p) ? `(${p[0]},${p[1]})` : `(${f1(p.x)},${f1(p.z)})`);
const rows = shots.map((shot, i) => {
  let r;
  try { r = playShot(course, shot); } catch (e) { die(`shot ${i + 1}: ${e.message}`); }
  const b = r.first ? { ...r.first, surf: names[course.S(r.first.x, r.first.z)], toPin: Math.hypot(r.first.x - course.PIN.x, r.first.z - course.PIN.z) } : null;
  return { i: i + 1, shot, r, b };
});

if (flags.json) {
  console.log(JSON.stringify(rows.map(({ i, shot, r, b }) => ({ n: i, shot, end: r.end, surf: r.surf, at: r.p, toPin: r.toPin, firstBounce: b, carry: r.carry, power: r.power, stance: r.stance && r.stance.tag, wallHits: r.hits.wall })), null, 1));
} else {
  console.log(`${pos[0]}: pin at (${course.PIN.x}, ${course.PIN.z})`);
  console.log(['#', 'shot', 'ends', 'on', 'to pin', 'first bounce', 'carry', 'power', 'stance', 'wall'].map((h, k) => h.padEnd([2, 38, 6, 11, 8, 36, 7, 6, 28, 4][k])).join(' '));
  for (const { i, shot, r, b } of rows) {
    const desc = `${shot.name ? shot.name + ': ' : ''}${shot.club || 'Iron'} ${pt(shot.from || 'tee')}→${pt(shot.at || 'pin')}${shot.offset ? ` n${shot.offset}` : ''}${shot.wind ? ` ${shot.wind.mph}${shot.wind.dir}` : ''}`;
    const fb = b ? `(${f1(b.x)},${f1(b.z)}) ${b.surf} ${f1(b.toPin)}y` : '-';
    console.log([String(i), desc.slice(0, 37), r.end, r.surf, f1(r.toPin) + 'y', fb.slice(0, 35), f1(r.carry), r.power.toFixed(2), (r.stance && r.stance.tag) || '-', r.hits.wall || ''].map((c, k) => String(c).padEnd([2, 38, 6, 11, 8, 36, 7, 6, 28, 4][k])).join(' ').trimEnd());
  }
}
