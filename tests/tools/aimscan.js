#!/usr/bin/env node
// aimscan.js — find where to aim: play one shot from one spot at a grid of aim points, as a sharp and as a shaky player.
//
//   node tests/tools/aimscan.js <id> <from> <club> <x0,x1,z0,z1,step> [--n=21] [--sharp=0.2] [--shaky=0.55] [--wind=MPH:DIR] [--no-recovery]
//
//   <from>   tee | pin | x,z        <club>  Hammer | 3-Wood | Iron | Wedge        grid  aim points x0..x1 by z0..z1 every `step` yards
//   --wind   e.g. 17:tail (head | tail | left | right, relative to the aim line)    --no-recovery  the previous distance-and-lie-only baseline
// Each aim point is played with `n` needles evenly spread over ±sharp and again over ±shaky (the same two players as the hole checks), and
// prints, for each: expected strokes for the hole, how often it finishes on the putting surface, how often it ends in water/OB.
// A '<' marks the best score in each skill column. Use it to find the line a check should aim at, or to see how forgiving a target is.
//
//   node tests/tools/aimscan.js pinehurst-5 -8,288 3-Wood 40,52,495,510,4
const { args, die, openHole, point } = require('./lib');
const { evaluate } = require('../hole-play');

const { pos, flags } = args();
if (pos.length < 4) die('usage: node tests/tools/aimscan.js <id> <from> <club> <x0,x1,z0,z1,step> [--n=21] [--sharp=0.2] [--shaky=0.55] [--wind=MPH:DIR] [--no-recovery]');
const { course } = openHole(pos[0]);
const from = point(pos[1]), club = pos[2];
const g = pos[3].split(',').map(Number);
if (g.length !== 5 || g.some(Number.isNaN) || g[4] <= 0) die('grid must be x0,x1,z0,z1,step (step > 0)');
const [x0, x1, z0, z1, step] = g;
const n = +(flags.n || 21), sharp = +(flags.sharp || 0.2), shaky = +(flags.shaky || 0.55);
const opts = flags['no-recovery'] ? { recovery: false } : {};
let wind = null;
if (flags.wind) { const [mph, dir] = String(flags.wind).split(':'); wind = { mph: +mph, dir }; if (!(mph > 0) || !['head', 'tail', 'left', 'right'].includes(dir)) die('--wind is MPH:DIR, e.g. 17:tail'); }
const xs = [], zs = [];
for (let x = x0; x <= x1 + 1e-9; x += step) xs.push(+x.toFixed(3));
for (let z = z0; z <= z1 + 1e-9; z += step) zs.push(+z.toFixed(3));
if (xs.length * zs.length > 400) die(`${xs.length * zs.length} aim points is too many (max 400): widen the step`);

const rows = [];
for (const z of zs) for (const x of xs) {
  const shot = { from, club, at: [x, z], ...(wind ? { wind } : {}) };
  rows.push({ x, z, sharp: evaluate(course, shot, sharp, n, null, opts), shaky: evaluate(course, shot, shaky, n, null, opts) });
}
const best = k => Math.min(...rows.map(r => r[k].score));
const bs = best('sharp'), bk = best('shaky');
const pct = v => (Math.round(v * 100) + '%').padStart(4);
console.log(`${pos[0]}  ${club} from ${pos[1]}  grid x ${x0}..${x1}, z ${z0}..${z1} step ${step}  n=${n}  sharp ±${sharp}  shaky ±${shaky}${wind ? `  wind ${wind.mph} ${wind.dir}` : ''}${opts.recovery === false ? '  (no recovery term)' : ''}`);
console.log('   aim x    aim z |  sharp: score  green   wet |  shaky: score  green   wet');
for (const r of rows) {
  const cell = (e, b) => `${e.score.toFixed(2)}${e.score === b ? '<' : ' '}  ${pct((e.surfs.GREENS || 0) / e.n)}  ${pct(e.hazard)}`;
  console.log(`${String(r.x).padStart(8)} ${String(r.z).padStart(8)} |  ${cell(r.sharp, bs)}      |  ${cell(r.shaky, bk)}`);
}
const at = k => { const r = rows.find(r => r[k].score === (k === 'sharp' ? bs : bk)); return `(${r.x}, ${r.z}) ${r[k].score.toFixed(2)}`; };
console.log(`best for sharp: ${at('sharp')}    best for shaky: ${at('shaky')}`);
