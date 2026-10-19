# Iconic hole spec: Riviera Country Club No. 6

## 1. Inspiration

| | |
|---|---|
| Real hole | Riviera Country Club (Pacific Palisades, CA; George C. Thomas, 1926), hole 6 |
| Par / yardage (real) | Par 3. 199 yards on the Tour scorecard (Genesis Invitational's hole-by-hole guide, golf.com, The Fried Egg); "200 yards" (Golf News Net); "around 190" (a betting preview, weakest source); 164 yards as set up for the 2026 U.S. Women's Open (USWO.com). The hole itself has not been lengthened; the other par 3s have (No. 4 is now 273 yd). |
| **Matches the request?** | Par yes. Yardage no: the request called it a "short par 3", and at 199 yd it is one of the longer par 3s on the course (No. 14 is 192, No. 16 is 166). Asked before building; answer: **real 199 yd, scaled**. It is short only in the size of the target. |
| Par / yardage (game) | Par 3, 161 yards tee → pin (green centre 168 yd). A full iron (155 carry) with a little run; the club is not the decision. |
| Sources | See below |

- [Genesis Invitational — A hole-by-hole guide to Riviera](https://genesisinvitational.com/news/hole-hole-guide-riviera/) (199 yd)
- [The Fried Egg — Riviera Country Club profile](https://www.thefriedegg.com/articles/riviera-country-club) (199 yd; a lot of back-to-front slope; a large deep front bunker, a back bunker and the central one)
- [USWO.com — Sixth Sense: Riviera's unique par 3](https://www.uswomensopen.com/2026/articles/sixth-sense--riviera-country-club-s-unique-par-3-.html) (164 yd for the Women's Open; holes can be cut only short-right and back-left, because the pitch is too severe in the other two quadrants)
- [Golf Digest — Why does Riviera's sixth hole have a bunker in the middle of the green?](https://www.golfdigest.com/story/riviera-sixth-green-bunker-george-thomas) (two areas for pins, a lower front-right one with feeder slopes and a flatter upper back-left one; recoveries mean a pitch over the bunker or a bending putt)
- [Golf News Net — Why is there a bunker in the middle of the green?](https://thegolfnewsnet.com/ryan_ballengee/2026/02/17/riviera-country-club-6th-hole-bunker-middle-green-103169) (four quadrants; sideboards and backboards on each)
- [golf.com — weirdest elements in a golf hole](https://golf.com/travel/weirdest-elements-golf-hole/) (bunkers front-left and back as well)
- [Break 80 Golf — Golf's Golden Age of Architecture takes center stage at Riviera](https://break80golf.substack.com/p/golfs-golden-age-of-architecture) (front pins and quadrants are very small from the tee)

**No source I read describes a false front on No. 6** (Golf Digest's piece, the closest, describes feeder slopes into the lower front-right area and says nothing of a false front). The real feature the game keeps is that tier: a lower front-right area and an upper back-left one with severe pitch between them. §6 says what the baseline cannot see of it.

## 2. What makes it iconic

- **Signature features**: a small pot bunker in the middle of the green that cuts it into four quadrants, a large deep bunker front-left, a nasty one behind, a green that falls from back to front, and a tier: a lower front-right area and a flatter upper back-left one, with pitch too severe between them for a pin. Chipping over the bunker from the green is legal and has been done.
- **The strategic problem in one sentence**: the middle of the green is a bunker, so you cannot aim at "the green"; you pick a quadrant, and a miss on the wrong level or the wrong side of the bunker leaves a pitch over it or a putt bent around it.
- **Where scores are made and lost**: the tee shot's *target*, not its club. The right pin is a small, lower target; the safe quadrant is bigger and above it, across the bunker.

## 3. Analysis — the challenge archetypes

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Risk/reward split (aggressive vs safe line) | **Yes (primary)** | Tee shot | Attack the short-right pin, or bail to the big back-left quadrant |
| Green contours (tiers, false front, tilt) | **Yes** | Tee shot, putt | Back-to-front tilt and a tier between the two pin areas (no false front found in the sources, see §1) |
| Deep or pot bunkers | **Yes** | Tee shot | One in the middle of the green; a deep one front-left, one behind |
| Distance control / run-out | Mild | Tee shot | A full iron; long goes into the back bunker |
| Penal surrounds | Mild | Recovery | Bunkers on three sides of the green |
| Forced carry, dogleg, elevation, sloping lies, narrow landing zone, wind, firm turf | No | | |

It differs from Augusta No. 12 (the other par 3 here) on purpose: no water, no wind; the whole hole is the green.

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Pot bunker in the middle of the green | a bunker whose ellipse sits inside the green ellipse (`S` checks bunkers before the green, `H` digs them into it) | at the green's centre; `depth` 1.6, `lip` 0.45 | The obvious target is sand; a putt straight across it stops in it |
| Large deep bunker front-left | bunker | `depth` 1.9, `lip` 0.6 | The miss left and short |
| Bunker behind the green | bunker | `depth` 1.7, `lip` 0.5 | The miss long: a downhill sand shot to a front pin |
| Back-to-front slope | green `tilt` | `z` 0.02, `x` 0.01 (rises toward back-left) | Above the hole is the wrong side |
| Lower short-right area, upper back-left area, severe pitch between | a `step` along the front-left → back-right diagonal, so the back-left side sits higher | `dh` and `w` set by `slope.js`; a soft `hollow` pocket in the short-right area | The two pin areas, and a ridge of pitch across the other two quadrants |
| Pins only short-right and back-left | the hole's one `pin`, short-right | | The small, lower target |

**Capability gaps**:
- **One pin per hole.** The real decision flips round to round (short-right or back-left). The game has a fixed pin, as Augusta No. 12 does; this hole is the short-right day. A per-round pin list would cover it.
- **The green's true outline** ("strangely shaped", per The Fried Egg): the green is an ellipse, deliberately (see `ICONIC-HOLES.md` §2, "When the catalogue is not enough").

Nothing else is missing: a bunker inside a green needed no new primitive.

## 5. Exaggeration

(filled in after tuning)

## 6. Validation — the contract

Written into `tests/hole-checks.js` under `riviera-6` before any tuning.

**Shots**:

| Shot | Expected |
|---|---|
| A well-struck iron at the pin | Short-right quadrant of the green, ≤ 7 yd |
| Aimed at the middle of the green | In the middle bunker |
| A well-struck iron at the big back-left quadrant | Green, 10+ yd from the pin (across the bunker) |
| Aimed at the front-left bunker | In the sand |
| Carried 18 yd long | In the back bunker |
| From the back-left quadrant, a putt straight at the pin | Runs into the middle bunker |
| From there, a wedge over the bunker | Green, ≤ 9 yd |
| From the middle bunker, a wedge | Out, on the green, ≤ 12 yd |

**Strategies** (sharp ±0.2, shaky ±0.55; every plan is an iron, so the club is not the decision):

| Decision | Plans | Must hold (rates and gap, not "X is right") |
|---|---|---|
| The pin | at the short-right pin / to the big back-left quadrant / at the middle | A sharp player holds the green at the pin ≥ 70 %; aiming at the middle finds the sand ≥ 50 % for a sharp player; the back-left quadrant leaves a sharp player at least 6 yd more than the pin; it is a bigger target (shaky green rate at least the pin's); the pin saves a sharp player ≥ 0.1 stroke; for a shaky player the two are within 0.35 stroke either way |
| The leave from the back-left quadrant | putt straight at the pin / wedge over the bunker | A straight putt ends in the sand at least half the time for both players; the wedge holds the green ≥ 70 % for a sharp player |

**What the baseline can and cannot support** (written before tuning, measured after; §7):
- *Under-charges*: a ball on the green pays only `PUTT[distance to pin]`, so a ball in the far quadrant, with the bunker between it and the pin and a tier to cross, costs the same as one the same distance away in the pin's own quadrant. The safe plan therefore looks cheaper than it is. The recovery term cannot help: it is not charged on the green at all, and its `up` measure only looks for a face above the ball in the 10 yd toward the pin, which a bunker lip crossed by a putt is not.
- It also cannot see a tier or false front as such: only where the ball finishes.
- *Charges*: a ball in the middle bunker pays the sand lie (0.35) plus `up` from the lip and depth; a ball in the front-left bunker also takes `short` when the pin is near the edge it is on. I have no figures for what a tour player really scores from the real bunker, so I do not claim it over- or under-charges the real hole; §7 gives what it charges here.
- `lieAdd` is not used. The contract asserts rates and a bounded gap, never that the bail-out is the right play.

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|

**Visual checks**: `node tests/hole-map.js riviera-6`, `node tests/tools/slope.js riviera-6`, and `python3 tests/tools/render.py riviera-6`, then the key shot by hand.

## 7. Results

(filled in after tuning)
