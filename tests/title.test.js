// The title menu's hole count and course line are written into the page and then filled from HOLES by the script.
// On a phone the script's text is not painted until the first hole has built, so the static text is what a player
// sees first: it must already match HOLES (it read "3 HOLES" for months after the course grew to 7).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadCourse } = require('./harness');

test('title menu: the static hole count and course line match HOLES', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const H = loadCourse().HOLES;
  const count = html.match(/id="tCount">([^<]*)</)[1];
  const courses = html.match(/id="tCourses">([^<]*)</)[1];
  const par = H.reduce((s, h) => s + h.par, 0);
  assert.equal(count, `${H.length} HOLES · PAR ${par}`, 'update #tCount in index.html');
  assert.equal(courses, [...new Set(H.map(h => h.short || h.name.split(' ')[0]))].join(' · '), 'update #tCourses in index.html');
});
