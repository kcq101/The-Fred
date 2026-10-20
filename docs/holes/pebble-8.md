# Iconic hole spec: Pebble Beach No. 8

![map](../maps/pebble-8.png)

## 1. Inspiration

| | |
|---|---|
| Real hole | Pebble Beach Golf Links, No. 8 |
| Par / yardage (real) | Par 4, 428 yards |
| Par / yardage (game) | Par 4, 376 yards (card unchanged) |
| Sources | [Golfshake hole-by-hole guide](https://www.golfshake.com/news/view/13849/Pebble_Beach_Hole_by_Hole_Guide.html) |

## 2. What makes it iconic

- **Signature features**: the drive is uphill and blind to a plateau that runs out at the cliffs; the approach is played across a chasm of ocean to a green perched on the far cliff.
- **The strategic problem**: hit the tee shot far enough to leave a manageable carry, but not so far that it runs off the end of the land; then commit to a forced carry over the sea to a small green.
- **Where scores are lost**: a drive that runs out of fairway, and an approach that comes up short.

## 3. Analysis

| Archetype | Applies? | Shot | Notes |
|---|---|---|---|
| Distance control / run-out | **primary** | tee | the plateau ends at a cliff |
| Forced carry | **primary** | approach | the chasm |
| Elevation change | yes | both | uphill drive, downhill approach |
| Green contours | yes | approach, putt | small green falling toward the front |
| Penal surrounds | yes | approach | short and right is the ocean |
| Wind exposure | yes | all | coastal |
| Risk/reward split | yes | approach | at the pin vs. around the head of the cove |

## 4. Translation

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Uphill drive to a plateau | three `ramp`s from the 2017-18 USGS lidar, read along the fairway's left half | +6.6 yd over z 12→50, then +5.4 to the plateau's end (12 yd above the tee) | drives land sooner; a pure 3-wood stops 161 from the pin |
| Fairway runs out at the cliff | the lidar's coastline as the ocean (`poly`, `cliff` profile), read on the cliff face at 7 m | the plateau ends at z ≈ 245; the cove runs to z ≈ 320 on the line | anything that rolls past ~245 yards falls into the sea |
| Land beyond the chasm is lower | `ramp`s from the lidar | −4.2 yd to the far shore, +2.4 to the green (3.2 below the plateau), +7.2 up the hill behind | the approach plays downhill |
| Bank falling to the sea right of the green | a second ocean body brought 12 yd in under the green's front-right (§5) | to about the 13 m contour | short-right goes in the sea |
| Bank in front of the green | `cover` → FAIRWAY | polygon z 346–368 | closely mown, so short balls roll back to the sea instead of stopping in rough |
| Greenside bunkers | the lidar's two hollows by the green | front-left 13 × 10 yd, back-right 9 × 6 yd, 0.45 deep; no fairway bunkers (none in the lidar) | |
| Small green, back to front | `green` | 26 × 22 yd, `tilt.z` −0.03 | putts from above are fast; balls feed toward the front |
| Coastal wind, fast greens | `play` | wind 6–18 mph, `greens.speed` 1.1 | |

**Capability gaps**: the blind aiming rock on the real tee (no obstacle primitive yet); the real green's specific contours (approximated by tilt).

## 5. Exaggeration

| Characteristic | Real | Game | Why |
|---|---|---|---|
| Run-out off the tee | longest hitters club down | a pure driver (and a 90% one) goes into the sea; a pure 3-wood stops ~16 yd short of the edge | makes club choice the tee decision, as it is for pros |
| Chasm | carry over the cove | as the lidar has it (about 75 yd of sea on the line); a chunk pays | — |
| The bank right of the green | falls 12 m to the sea at about 40 % | the sea brought in to about its 13 m contour (12 yd in) | the game's heights run along the hole only, so the real sideways bank is flat in the game and short-right balls stayed on it; this makes short-right wet, as it is |
| Shaved bank | rough slope | fairway-cut slope from the green to the cliff | short-right feeds into the sea |
| Downhill approach | 3.3 m (lidar) | 3.2 yd below the plateau | |

**Realism bounds** (`node tests/tools/slope.js pebble-8`, `docs/maps/pebble-8-slope.png`): the green is one tilted plane (`tilt` 3.6 %), so all of the putting surface is in the 2.5–4 % band: no steep ring (0 % over 4 %) and not a dome (tilt coherence 1.00), but the "gentle top" and "flat pockets" bounds read WARN. Deliberate: the design wants fast putts from above and balls that feed along the slope (§4), Written before the bounds existed; recorded here, not reshaped. The green is still the ellipse: no aerial yet.

## 6. Validation

All in `tests/hole-checks.js` → `pebble-8`.

| Shot | Expected |
|---|---|
| Pure driver, down the middle | water |
| 90% driver | water |
| Pure 3-wood | fairway, short of the cliff |
| Iron from (−5, 215), slight mishit (0.1) | green within 8 yd |
| Chunked iron (0.7) | water |
| Thin-right iron (0.55) lands on the shaved bank | water |
| Bail-out left around the cove (0.5 miss) | dry |

| Decision | Must hold | Result |
|---|---|---|
| Tee club: driver / 3-wood / iron | driver wet more often than not; 3-wood dry and best for both skills; iron leaves 60+ yd more | driver wet 100% (sharp) / 57% (shaky); 3-wood best for both |
| Approach: pin / bail left | pin risks the chasm for a shaky player; sharp always greens it; bail is dry but costs 0.5+ strokes | pin wet 24% for shaky; bail costs a sharp player 1.02 strokes |

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| The approach shots and the approach strategy | from (−5, 247) | from (−5, 215) | The lidar ends the plateau at z ≈ 245, so (−5, 247) is over the sea; (−5, 215) is where the pure 3-wood now stops (161 from the pin) |
| `tests/holes.test.js` recovery test (Pebble's bunkers) | the bunker short of the raised green pays over 0.5 strokes and 3 × the one beside it | both greenside bunkers are within the lie charge (< 0.2) | The lidar has no knoll: the front-left bunker sits level with the green (floor 18.5 m, green 18.8 m), so there is no face to climb; the Road Hole bunker part of the test is unchanged |

## 7. Results

```
=== Pebble Beach (pebble-8) — Distance control off the tee (the plateau ends at a cliff), then a forced carry over an ocean chasm to a small, back-to-front green.
shot                                                                           before           after
a pure driver runs off the end of the plateau into the chasm                   FAIRWAY 90y      WATER 135y
even a 90% driver still finds the chasm                                        FAIRWAY 107y     WATER 136y
a pure 3-wood stops on the plateau, short of the cliff                         FAIRWAY 130y     FAIRWAY 161y
from there a well-struck iron carries the chasm and holds the green            GREENS 3y        GREENS 5y
a chunked approach comes up short in the chasm                                 ROUGH 39y        WATER 29y
a ball short-right on the shaved bank feeds back down to the sea               ROUGH 29y        WATER 27y
the bail-out left, around the head of the cove, stays dry                      ROUGH 35y        FAIRWAY 34y

  strategy: tee club
  plan       skill   before: wet green score   after: wet green score
  driver     sharp           0%   0% 3.82            100%   0% 5.92
  driver     shaky           0%   0% 3.99             57%   0% 5.20
  3-wood     sharp           0%   0% 3.92              0%   0% 4.04
  3-wood     shaky           0%   0% 4.07              5%   0% 4.22
  iron       sharp           0%   0% 4.26              0%   0% 4.35
  iron       shaky           0%   0% 4.31             14%   0% 4.62

  strategy: approach line
  plan       skill   before: wet green score   after: wet green score
  pin        sharp           0% 100% 2.35              0% 100% 2.66
  pin        shaky           0%  43% 3.09             24%  52% 3.40
  bail       sharp           0%   0% 3.70              0%   0% 3.68
  bail       shaky           0%   0% 3.72              0%   0% 3.66
  payoff of pin over bail (strokes saved): sharp 1.35 → 1.02, shaky 0.62 → 0.26   (before → after)

"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).
```

Expected strokes ("score") come from the baseline in `tests/hole-play.js`, including its recovery-difficulty term (see `docs/ICONIC-HOLES.md`). "Before" is the original hole as it stood at commit 548d49a: the same tee and pin, none of the iconic-hole features, play profile or hazards.

## 8. Review — does it look like the hole?

**Fast lane, lidar** (2026-10-20). Heights, the coastline and the greenside bunkers from the lidar; the green is still the ellipse (no aerial yet).

**References used**: USGS 3DEP 1 m DEM, `CA_AZ_FEMA_R9_Lidar_2017_D18`, tile x59y405 (2017-18; not in the repo); a map pin on the green from the project owner. The tee is the pad at the south-west tip of the point beside the 7th green, 386 m (422 yd; the card's 428) from the pin. Frame: `docs/holes/trace/pebble-8.json` (bearing 56.5°, 0.974 game yd per m: the straight line matches the card's 376).

**What changed**

| Item | Was | Now |
|---|---|---|
| Coastline | an invented `outside` polygon, the plateau ending at z 262 | the lidar's, read on the cliff face at 7 m: the plateau ends at z ≈ 245 and a small inlet bites the fairway's right edge at z 126–153 |
| Heights | +5 to the plateau, −2.2 toward its end, −6 beyond the chasm, a +3 knoll under the green | from the lidar: 12 yd up to the plateau (steep for the first 50 yd), the green 3.2 below it, the hill behind |
| Greenside bunkers | front-left (−6, 362), back-right (−33, 391), 1.6 deep | at the lidar's hollows (3.4, 363) and (−32.6, 390.3), 0.45 deep |
| Fairway bunkers | two, on the plateau's end | none: no hollows there in the lidar (the cliff is) |
| Highest hop, ten seeds (from the first touchdown) | 3.87 yd | 2.57 yd |

**Renders**: `docs/maps/pebble-8-tee.png`, `docs/maps/pebble-8-aerial.png`.

**Verdict**
- Tee and direction: **matches** (the lidar's tee pad; the straight line is within 6 yd of the card).
- Heights: **matches** along the hole (lidar); the sideways bank right of the green is **can't express yet** (heights run along the hole only), so the sea is brought in under it instead (§5).
- Green: **no reference** — still the ellipse.
- Bunkers: **close** — at the lidar's hollows; sizes from 3 m relief, not traced.
- Water and surroundings: **matches** for the coastline and the cove.

**Open items**
1. An aerial of the green complex: trace the green and its bunkers.
2. A sideways height primitive (a bank across the hole), so the real fall to the sea right of the green replaces the moved shoreline.

### Earlier review-only pass


**Review-only pass, no reference image yet** (2026-10-19). The verdicts below compare the game's renders (`python3 tests/tools/render.py pebble-8 tee bird approach green aerial`; the green-complex view is committed as `docs/maps/pebble-8-aerial.png`) with this spec's sources and what is widely known of the hole. Nothing here was traced, so no shape is measured: "close" means the parts are there and in the right places, not that their sizes are right, and every **no reference** row waits for a photo. The step and its tools: `docs/ICONIC-HOLES.md` §2, step 7.

**Photos to get**: an aerial of the green across the chasm from the end of the fairway (the shot that decides the hole), and one from the tee up the hill.

| Area | Item | Verdict | Evidence (render against sources) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | **close** | The drive climbs to a plateau that ends at the cliff, as the spec says; the game's tee box faces straight up the hole | — |
| | Elevation: tee, landing area, green | **close** | Uphill to the plateau (+5 yd), down across the chasm (−6 yd) to a green raised on its own knoll (+3 yd); the sources give no heights, so the sizes are guesses | Heights from a topographic source |
| | Ground between | **close** | The plateau tips toward the edge; in the render the fairway runs out at the rock face | — |
| Fairway and fairway bunkers | Fairway outline and width | **close** | One strip ending at the cliff | — |
| | Fairway bunkers: count, place, shape | **no reference** | Two in the game short of the plateau's end, one each side | A photo up the fairway |
| | Rough, waste, paths | **close** | Cypress-and-ice-plant coast rough | — |
| Green and greenside bunkers | Green outline and size | **differs: fix** | A 26 × 22 yd ellipse; the real green is small and not an ellipse | Trace it from the aerial: expressible now (`green:{pts}`) |
| | Green contours as seen | **no reference** | One back-to-front tilt | — |
| | Greenside bunkers: count, place, shape, depth | **no reference** | Two ellipses, front-left and back-right of the green | Trace from the aerial |
| | Collar, banks and falloffs | **close** | A shaved bank in front of the green runs short balls back to the sea; the knoll falls away on every side | — |
| Surroundings and landmarks | Trees: kind and where | **close** | Cypress and pines along the sides | — |
| | Water, cliffs, structures, backdrop | **matches** in kind | The ocean inlet cut into the cliff line, rock faces in bands, rocks in the surf: the hole's look | Measure the inlet's shape from the aerial |
| | Landmarks a player would name | **can't express yet** | The blind tee shot's aiming rock (spec §4) | A scenery prop that also marks a line (an aiming post or rock), or a blind-shot primitive |

**Open items**, most important first:
1. Trace the green and its bunkers from an aerial: the outline is expressible now, and it is the shot the hole is about.
2. The aiming rock on the blind drive: needs a prop (and blind shots, shared with St Andrews No. 17).
3. Heights for the climb, the chasm and the green's knoll.
