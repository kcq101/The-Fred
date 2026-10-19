// Slope statistics and realism bounds for the putting surface, shared by slope.js (which draws them) and the tests.
// Grade is rise over run from height differences of ±e yd; bands are < 1 / 1–2.5 / 2.5–4 / > 4 %.
const BANDS = ['< 1 %', '1 – 2.5 %', '2.5 – 4 %', '> 4 %'];
const band = p => p < 1 ? 0 : p < 2.5 ? 1 : p < 4 ? 2 : 3;

function gradient(course, e = 0.2) {
  const H = course.H;
  return (x, z) => { const hx = (H(x + e, z) - H(x - e, z)) / (2 * e), hz = (H(x, z + e) - H(x, z - e)) / (2 * e); return { hx, hz, pct: 100 * Math.hypot(hx, hz) }; };
}

// every 0.25 yd cell whose surface is the putting green: band shares, tilt coherence, and the four realism-bound verdicts
function analyze(course, { e = 0.2, ringMax = 35 } = {}) {
  const grad = gradient(course, e), G = course.GREEN, GREENS = course.game.GREENS;
  const counts = [0, 0, 0, 0]; let total = 0, ux = 0, uz = 0, nDir = 0;
  const half = Math.max(G.rx, G.rz) + 1;
  for (let x = G.x - half; x <= G.x + half; x += 0.25) for (let z = G.z - half; z <= G.z + half; z += 0.25) {
    if (course.S(x, z) !== GREENS) continue;
    const q = grad(x, z); counts[band(q.pct)]++; total++;
    if (q.pct >= 1) { const l = Math.hypot(q.hx, q.hz); ux += q.hx / l; uz += q.hz / l; nDir++; }     // direction of the slope, where there is one
  }
  if (!total) return null;
  const share = counts.map(c => 100 * c / total);
  const coherence = nDir ? Math.hypot(ux, uz) / nDir : 1;       // 1 = every slope points the same way (a tilted plane), 0 = pointing every which way (a dome, a bowl)
  const nonSteep = 100 - share[3];
  const checks = [
    { id: 'ring', what: `falloff ring: steeper than 4 % is ≤ ${ringMax}% of the surface`, ok: share[3] <= ringMax, val: `${share[3].toFixed(0)}%` },
    { id: 'top', what: 'gentle top: at least half of the non-steep surface is 1–2.5 %', ok: nonSteep > 0 && share[1] / nonSteep >= 0.5, val: `${nonSteep > 0 ? (100 * share[1] / nonSteep).toFixed(0) : 0}%` },
    { id: 'pockets', what: 'flat pockets: 5–40 % of the surface under 1 %', ok: share[0] >= 5 && share[0] <= 40, val: `${share[0].toFixed(0)}%` },
    { id: 'dome', what: 'no dome: not (more than 60 % steeper than 2.5 % AND slopes pointing every which way)', ok: !(share[2] + share[3] > 60 && coherence < 0.5), val: `${(share[2] + share[3]).toFixed(0)}% steeper than 2.5 %, tilt coherence ${coherence.toFixed(2)}` },
  ];
  return { counts, total, share, coherence, checks, grad };
}

module.exports = { BANDS, band, gradient, analyze };
