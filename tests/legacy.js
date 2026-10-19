// The swing math as it was at commit 11d2b3f (shoot(), index.html lines 1448-1457), copied here ONLY so the
// before/after comparison has something to compare against. Not used by the game.
// Returns the same {speedMult, yawErr, spinErr} shape as SwingModel.resolve. rng is injected so runs are reproducible.
function legacyResolve(club, offset, rng) {
  const a = Math.abs(offset), miss = a < 0.1 ? 0 : offset;
  if (club.putt) return { speedMult: 1, yawErr: -miss * club.dev, spinErr: 0 };
  const speedMult = 1 + (rng() - 0.5) * 0.03 * (1 + a * 2);
  const yawErr = -miss * club.dev + (rng() - 0.5) * 0.012;
  return { speedMult, yawErr, spinErr: miss * (club.curve || 0) };
}
// CLUB dev/curve values at 11d2b3f (the new file has retuned them)
const LEGACY_CLUB_TUNING = {
  Hammer: { dev: 0.06, curve: 3.6 }, '3-Wood': { dev: 0.055, curve: 3.2 }, Iron: { dev: 0.05, curve: 2.6 }, Wedge: { dev: 0.05, curve: 1.6 }, Putter: { dev: 0.07, curve: 0 },
};
function legacyClub(club) { return Object.assign({}, club, LEGACY_CLUB_TUNING[club.name]); }
module.exports = { legacyResolve, legacyClub };
