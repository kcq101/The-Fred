// Shared helpers for the tools in this folder: argument parsing and opening a hole on the game's real terrain code.
const { loadCourse } = require('../harness');

// --flag, --flag=value and positional arguments
function args(argv = process.argv.slice(2)) {
  const pos = [], flags = {};
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) flags[m[1]] = m[2] === undefined ? true : m[2]; else pos.push(a);
  }
  return { pos, flags };
}

function die(msg, code = 2) { console.error(msg); process.exit(code); }

// the course with hole `id` prepared (heights, surfaces, water, pin), or a clear error listing the known ids
function openHole(id) {
  const course = loadCourse();
  const hi = course.HOLES.findIndex(h => h.id === id);
  if (!id || hi < 0) die(`unknown hole ${id ? `'${id}'` : '(none given)'}. Known holes: ${course.HOLES.map(h => h.id).join(', ')}`);
  course.prepHole(hi);
  return { course, hi, hole: course.HOLES[hi] };
}

// 'tee' | 'pin' | 'x,z'  ->  'tee' | 'pin' | [x, z]   (the forms hole-play.js takes)
function point(s) {
  if (s === 'tee' || s === 'pin') return s;
  const p = String(s).split(',').map(Number);
  if (p.length !== 2 || p.some(Number.isNaN)) die(`bad point '${s}': use tee, pin or x,z`);
  return p;
}

const f1 = n => (Math.round(n * 10) / 10).toFixed(1);

module.exports = { args, die, openHole, point, f1 };
