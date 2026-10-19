# Iconic hole spec: Riviera Country Club No. 6

## 1. Inspiration

| | |
|---|---|
| Real hole | Riviera Country Club (Pacific Palisades, CA; George C. Thomas, 1926), hole 6 |
| Par / yardage (real) | Par 3. 199 yards on the Tour scorecard (Genesis Invitational's 2020 hole-by-hole guide, golf.com, The Fried Egg); "200 yards" (Golf News Net, 2026); "around 190" (a 2026 betting preview, the weakest source); 164 yards as set up for the 2026 U.S. Women's Open (USWO.com). |
| **Matches the request?** | Par yes. Yardage no: the request called it a "short par 3", and at 199 yd it is one of the longer par 3s on the course (No. 14 is 192, No. 16 is 166). Asked before building; answer: **real 199 yd, scaled**. It is short only in the size of the target. |
| Par / yardage (game) | Par 3, **138 yards** tee → pin (green centre 144 yd). That is 0.69 of the real figure, a harder scale than Augusta No. 12's 0.91, and it is set by the clubs, not by taste: the longest club that holds a green this small is the iron (155 carry). On the first 161-yd build a 3-wood aimed at the pin landed on the green and ran through it (22.8 yd from the pin at default firmness; 8.3 yd even with greens at `firm:0.6`), while a full iron only just reached the pin and could not reach any aim point beyond it, so the back-left target and the back bunker were out of range. §5 has the rest. |
| Sources | See below |

- [Genesis Invitational — A hole-by-hole guide to Riviera](https://genesisinvitational.com/news/hole-hole-guide-riviera/) (199 yd)
- [The Fried Egg — Riviera Country Club profile](https://www.thefriedegg.com/articles/riviera-country-club) (199 yd; a lot of back-to-front slope; a large deep front bunker, a back bunker and the central one)
- [USWO.com — Sixth Sense: Riviera's unique par 3](https://www.uswomensopen.com/2026/articles/sixth-sense--riviera-country-club-s-unique-par-3-.html) (164 yd for the Women's Open; holes can be cut only short-right and back-left, because the pitch is too severe in the other two quadrants)
- [Golf Digest — Why does Riviera's sixth hole have a bunker in the middle of the green?](https://www.golfdigest.com/story/riviera-sixth-green-bunker-george-thomas) (two areas for pins, a lower front-right one with feeder slopes and a flatter upper back-left one; recoveries mean a pitch over the bunker or a bending putt)
- [Golf News Net — Why is there a bunker in the middle of the green?](https://thegolfnewsnet.com/ryan_ballengee/2026/02/17/riviera-country-club-6th-hole-bunker-middle-green-103169) (four quadrants; sideboards and backboards on each)
- [golf.com — weirdest elements in a golf hole](https://golf.com/travel/weirdest-elements-golf-hole/) (bunkers front-left and back as well)
- [Break 80 Golf — Golf's Golden Age of Architecture takes center stage at Riviera](https://break80golf.substack.com/p/golfs-golden-age-of-architecture) (front pins and quadrants are very small from the tee)

No source gives the green's size or the middle bunker's dimensions beyond "small, almost a pot bunker".

**No source I read describes a false front on No. 6** (Golf Digest's piece, the closest, describes feeder slopes into the lower front-right area and says nothing of a false front). The real feature the game keeps is that tier: a lower front-right area and an upper back-left one with severe pitch between them. §6 says what the baseline cannot see of it.

## 2. What makes it iconic

- **Signature features**: a small pot bunker in the middle of the green that cuts it into four quadrants, a large deep bunker front-left, a nasty one behind, a green that falls from back to front, and a tier: a lower front-right area and a flatter upper back-left one, with pitch too severe between them for a pin. Chipping over the bunker from the green is legal and has been done.
- **The strategic problem in one sentence**: the middle of the green is a bunker, so you cannot aim at "the green"; you pick a quadrant, and a miss on the wrong level or the wrong side of the bunker leaves a pitch over it or a putt bent around it.
- **Where scores are made and lost**: the tee shot's *target*, not its club. The right pin is a small, lower target; the safe quadrant is bigger and above it, across the bunker.

## 3. Analysis — the challenge archetypes

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Risk/reward split (aggressive vs safe line) | **Yes (primary)** | Tee shot | Attack the short-right pin, or bail to the big back-left quadrant |
| Green contours (tiers, false front, tilt) | **Yes** | Tee shot, putt | A tier between the two pin areas and a back-to-front tilt (no false front found in the sources, see §1) |
| Deep or pot bunkers | **Yes** | Tee shot | One in the middle of the green; a deep one front-left, one behind |
| Distance control / run-out | Mild | Tee shot | A full iron; long goes into the back bunker |
| Penal surrounds | Mild | Recovery | Bunkers on three sides of the green |
| Forced carry, dogleg, elevation, sloping lies, narrow landing zone, wind, firm turf | No | | |

It differs from Augusta No. 12 (the other par 3 here) on purpose: no water, no wind; the whole hole is the green.

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Pot bunker in the middle of the green | a bunker whose ellipse sits inside the green ellipse (`S` checks bunkers before the green, `H` digs them into it) | at the green's centre; 9.4 × 7.4 yd (`rx` 4.7, `rz` 3.7), `depth` 1.6, `lip` 0.45 | The obvious target is sand; a ball aimed at it that is not caught rolls into a quadrant on either side |
| Large deep bunker front-left | bunker | 13 × 7.2 yd, `depth` 1.9, `lip` 0.6 | The miss left and short |
| Bunker behind the green | bunker | 17 × 10 yd, `depth` 1.4, `lip` 0.3 | The miss long: a downhill sand shot to a front pin |
| Back-to-front slope | green `tilt` | `z` 0.010, `x` 0.003 (rises toward back-left) | Above the hole is the wrong side (milder than the real green: see §5) |
| Lower short-right area, upper back-left area, severe pitch between | a `step` along the front-left → back-right diagonal, so the back-left side sits higher; a broad soft `hollow` around the pin | `step` `dh` 0.4 over `w` 7; `hollow` 24 × 16 yd, `depth` 0.08 | The two pin areas, a belt of pitch across the other two quadrants, and a flat pocket at the pin |
| Pins only short-right and back-left | the hole's one `pin`, short-right | (−7, 137.5) | The small, lower target |

**Capability gaps**:
- **One pin per hole.** The real decision flips round to round (short-right or back-left). The game has a fixed pin, as Augusta No. 12 does; this hole is the short-right day. A per-round pin list would cover it.
- **The green's true outline** ("strangely shaped", per The Fried Egg): the green is an ellipse, deliberately (see `ICONIC-HOLES.md` §2, "When the catalogue is not enough").
- **Putts in the test tools.** `playShot` cannot play a putt: the Putter has no launch arc, so the aim-power search returns NaN. Putting around a bunker, the other half of the real hole's recovery, is therefore not tested here, and is not seen by the baseline either (§6).

Nothing else is missing: a bunker inside a green needed no new primitive.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 199 yd (164 for the Women's Open) | 138 yd | See §1: an iron is the longest club that holds a green this small |
| Green size | not given by the sources | 30 × 23 yd ellipse | Each quadrant is about 11 × 8 yd, a target an iron can pick but a shaky swing cannot |
| Middle bunker | "small, almost a pot bunker"; no figures | 9.4 × 7.4 yd, depth 1.6 | **Enlarged from 6.8 × 5.4 yd** (first build) so that aiming at the middle finds the sand at least half the time for a sharp player, as the check asks (a ball that misses it rolls round it into a quadrant). The sand share does not rise smoothly with size: by half-width in yards, 3.5 → 38 %, 3.9 → 43 %, 4.1 → 57 %, 4.3 → 48 %, 4.5 → 52 %, 4.7 → 57 %, 5.1 → 57 %, 5.5 → 67 %. 4.7 (9.4 × 7.4 yd) was taken as the first size where it reads 57 % and does not drop back at the larger sizes: 12 of 21 swings. The check was not relaxed |
| Back bunker | "nasty"; no figures | 17 × 10 yd, depth 1.4, lip 0.3 | **Softened from 16 × 6 yd, depth 1.7, lip 0.5.** The first build failed the shared random-shot guard in `tests/ball.test.js` (the highest hop on dry ground must stay under 3.5 yd): long clubs hitting its steep lip hopped 4.97 and 5.25 yd. Removing it cleared the guard; the wider, shallower shape (wall steepness, depth over 0.45 × the short radius, about 0.6 against 1.3) passes, with the worst hop on this hole at 2.58 yd. The guard was not touched |
| Tier | severe pitch in two quadrants (USWO) | `step` 0.4 yd over 7 yd, a diagonal belt | 31 % of the surface is steeper than 4 %, part of that the bunker rims; the belt is what makes two quadrants unfit for a pin |
| Back-to-front slope | "a lot" (The Fried Egg) | 1.0 % plane (`z` 0.010, `x` 0.003) | **Milder than the real green, on purpose.** The first build used 2.2 % and the flat-pockets bound read 2 % (needs 5–40 %): a tilt that steep leaves no putting surface under 1 %. The back-to-front feel now comes from the tier and the pocket, not the plane. This is the one place the hole is less like the real one than the bound allowed it to be |
| Wind, greens | not sourced | `wind:[0,6]`, `greens:{speed:1.15, firm:0.8}` | A light breeze; greens a little fast and soft so a full iron holds. Tuning, not research |

**Realism bounds** (`node tests/tools/slope.js riviera-6`, `docs/maps/riviera-6-slope.png`): 11 / 54 / 3 / 31 % in the four bands. The red diagonal in the map is the tier; the red rings are the bunker rims (the middle bunker's ring is counted: its lip sits inside the green).

| Bound | Default | This hole | Note |
|---|---|---|---|
| Falloff ring: surface steeper than 4 % | ≤ ~35 % | 31 % | The tier belt and the rims, not an edge ring |
| Top: 1–2.5 % of the non-steep surface | mostly (≥ half) | 79 % | |
| Flat pockets: surface under 1 % | 5–40 % | 11 % | The pin pocket, short-right |
| No full-green dome | not (> 60 % steeper than 2.5 % *and* slopes every which way) | 34 % steeper than 2.5 %; tilt coherence 0.85 | One tilted plane with a tier, not a dome |

## 6. Validation — the contract

Written into `tests/hole-checks.js` under `riviera-6` before any tuning (commit `8288cec`); the later changes are in the log below.

**Shots**:

| Shot | Expected |
|---|---|
| A well-struck iron at the pin | Short-right quadrant of the green, ≤ 7 yd |
| Aimed at the middle of the green | In the middle bunker |
| A well-struck iron at the big back-left quadrant | Green, 10+ yd from the pin (across the bunker) |
| Aimed at the front-left bunker | In the sand |
| Aimed past the green | Runs through into the back bunker |
| From the back-left quadrant, a wedge | Over the bunker, on the green, ≤ 9 yd |
| From the middle bunker, a wedge | Out, on the green, ≤ 12 yd |

**Strategies** (sharp ±0.2, shaky ±0.55; every plan is an iron, so the club is not the decision):

| Decision | Plans | Must hold (rates and gap, not "X is right") |
|---|---|---|
| The pin | at the short-right pin / to the big back-left quadrant / at the middle | A sharp player holds the green at the pin ≥ 70 % (100 %); aiming at the middle finds the sand ≥ 50 % for a sharp player (57 %); the back-left quadrant leaves a sharp player ≥ 6 yd more than the pin; a shaky player holds the green at least as often there as at the pin (62 % against 43 %); the pin saves a sharp player ≥ 0.1 stroke (0.54); for a shaky player the two are within 0.35 stroke either way (0.21, the pin ahead) |

No water on this hole, so the hazard rate is 0 for every plan; the rates that matter are green and sand.

**What the baseline can and cannot see here** (measured; the throwaway script is described under §7):

- **It under-charges the safe plan, and by a count I can give but not a size.** A ball on the green pays only `PUTT[distance to the pin]`, whichever quadrant it is in. For the back-left plan, **20 of a sharp player's 21 finishes, and 8 of a shaky player's 13 green finishes, have the middle bunker on the straight line to the pin**; the baseline prices each as an open putt (the plan scores 3.18 sharp and 3.23 shaky: one stroke plus the putt table at 15–20 yd). A putt straight across ends in the sand, and the real recovery is a chip over it or a putt bent round it. I cannot say how much more it costs, because `playShot` cannot play a putt (§4). For the pin plan the count is 0 of 30 green finishes. The recovery term cannot help: it returns 0 for any ball on the green, and its `up` face only looks along the line to the pin for ground above a ball that is off the green. The bunker in the green affects the baseline only when a ball finishes in it.
- **That error is in the direction the contract already assumes**: the safe plan looks cheaper than it is, so the pin's real payoff is at least what the baseline says (0.54 sharp, 0.21 shaky). The checks assert lower bounds and a bounded gap; none says the bail-out is the right play, and none could be satisfied by the under-charge.
- **It cannot see a tier or a false front as such, only where the ball finishes.** A ball that pitches onto the lower tier and stays, or trickles back to the foot of it, is charged by distance. (And §1: no source says there is a false front here.)
- **Charges it does make, with no figures to say whether they are right.** A ball resting at the bottom of the middle bunker, 9.6 yd from the pin, is charged 2.68 (2.48 without the recovery term): the sand lie 0.35 plus 0.20 for the 1.6 + 0.45 yd wall less the 1.0 yd allowance. A ball resting on the near wall, 5.3 yd from the pin, pays 1.98 and no recovery charge: the face it has to climb is smaller. So the charge changes by 0.7 stroke inside one 9-yd bunker, because the term is a function of the face under the ball. The front-left bunker, 21.5 yd out, is charged 3.35 (2.76 without recovery, +0.59, mostly depth × 0.35); the back bunker 3.23 (2.77, +0.46). The back bunker was charged +0.55 before it was softened to pass the hop guard (§5): the baseline moved because a parameter changed for a physics reason, not because the real bunker got easier. I have no tour figures for these bunkers, so I do not say any of this over- or under-charges the real hole.
- **Short-siding is nearly invisible.** The pin is 4 yd from the front edge, short-sided in the real sense, but a ball in the rough 7.5 yd short of it is charged 0.08 of the term's 0.30. Across a shaky player's pin plan, the recovery term moves the score by under 0.02.
- **Where the recovery term does bite is the aim-at-the-middle plan**: +0.14 stroke for a sharp player (3.19 → 3.33), +0.16 shaky (3.22 → 3.38), because most of its misses are in the sand. For the pin and safe plans it moves the score by 0.03 or less.
- `lieAdd` is not used.

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| Putt straight from the back-left quadrant runs into the middle bunker (shot) | in the contract as first written | removed | `playShot` cannot play a putt (Putter has no launch arc; NaN). The check could not be run, and I did not write one that could pass without testing the claim |
| The leave from the back-left quadrant: putt straight / wedge over (strategy) | in the contract as first written | removed; its wedge half survives as a shot check | The putt half cannot be played, for the same reason |
| Aim points: pin-side bunker, middle, front-left bunker, long, back-left target | (0,168), (13,152), (0,186), (8,174), for a 161-yd hole | (0,144), (13,131), (0,160), (8,145), for a 138-yd hole | The hole was rescaled (§1) after the first probe showed a full iron only just reaches a 161-yd pin and cannot reach aims beyond it, and a 3-wood runs through the green. Not a tuning of results. The back-left target (8,145) is short of the quadrant's centre (8,149.5) because a ball runs about 5 yd after landing |
| "Carried 18 yards long, in the back bunker" | named a carry | "Aimed past the green, runs through into the back bunker" | An iron at full power lands about 155 yd out and runs; there is no carrying it 18 yd long. The check's content (long ends in the back bunker) is unchanged |
| Wedge over the bunker from the back-left quadrant | no needle offset | needle offset 0.1 | At offset 0 the wedge holed out, so the check passed on a perfect strike only |

Not check changes but tuning, recorded in §5: the middle bunker was enlarged to meet the "aiming at the middle finds the sand ≥ 50 %" check (the check was not relaxed); the back bunker was softened for the shared hop guard; the plane tilt was cut so the green clears the flat-pockets bound.

**Visual checks**: `node tests/hole-map.js riviera-6` → `docs/maps/riviera-6.png`; `node tests/tools/slope.js riviera-6` → `docs/maps/riviera-6-slope.png`; `python3 tests/tools/render.py riviera-6`: the ball is clear of the bottom HUD in all three views (tee +146 px, bird's-eye +31 px, approach +124 px), pin in view. The key shot by hand is not done: it needs a person with the game open.

## 7. Results

```
=== Riviera Country Club (riviera-6) — A par 3 whose decision is the pin, not the tee shot: a small pot bunker in the middle of the green cuts it into quadrants, a back-to-front slope and a tier separate the lower short-right pin area from the upper back-left one, and deep bunkers guard the front-left and the back. Every plan is a full iron; what matters is which quadrant you aim at.
shot                                                                           before           after
a well-struck iron at the pin holds the short-right quadrant                   GREENS 5y        GREENS 5y
aimed at the middle of the green, a pure iron drops into the middle bunker     GREENS 15y       SAND 11y
a well-struck iron at the big back-left quadrant holds the green, across the   GREENS 18y       GREENS 18y
aimed at the deep front-left bunker, a pure iron finds the sand                ROUGH 21y        SAND 21y
aimed past the green, a pure iron runs through it into the back bunker         ROUGH 22y        SAND 22y
from the back-left quadrant, a wedge over the bunker finishes on the green cl  GREENS 1y        GREENS 1y
from the middle bunker, a wedge gets out and onto the green                    GREENS 0y        GREENS 0y

  strategy: the pin: attack the short-right pin, play to the big back-left quadrant, or aim at the middle (every plan an iron)
  plan       skill   before: wet green score   after: wet green score
  pin        sharp           0% 100% 2.66              0% 100% 2.64
  pin        shaky           0%  43% 3.03              0%  43% 3.02
  safe       sharp           0% 100% 3.17              0% 100% 3.18
  safe       shaky           0%  67% 3.19              0%  62% 3.23
  middle     sharp           0% 100% 3.08              0%  43% 3.33
  middle     shaky           0%  71% 3.13              0%  33% 3.38
```

"Before" is the same land and green with the signature stripped: no features (the tier and the pin pocket), play profile, obstacles, bunkers or water. The green's plane tilt stays. Expected strokes ("score") come from the baseline in `tests/hole-play.js`, including its recovery-difficulty term (see `docs/ICONIC-HOLES.md`). There is no water on this hole, so the `wet` column is 0 throughout; the decision is read from the green and score columns.

A throwaway script (not committed) produced the baseline counts in §6: for each plan and skill it played the 21 swings, tested whether the straight line from each green finish to the pin crosses the middle bunker's ellipse, and compared `evaluate()` with and without `opts.recovery`; `recovery()` and `expected()` were called directly for the hazard lies. Rerunning it needs only `loadCourse()` and `course.BUNKERS[0]`.
