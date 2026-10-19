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
| Uphill drive to a plateau | `ramp` | z 30→200, +5 yd | drives land sooner (shorter carry); the far end is hidden from the tee |
| Plateau tips to the cliff edge | `ramp` | z 195→262, −2.2 yd | a long drive keeps rolling toward the edge |
| Fairway runs out at the cliff | `fairway` interval ends at z 262; ocean inlet cut into the coastline (`outside` polygon) | inlet z 266–357, head at x ≈ +11 | anything that rolls past ~265 yards falls into the sea |
| Land beyond the chasm is lower | `ramp` | z 262→335, −6 yd | the approach plays downhill |
| Green perched above the chasm | `rise` | ellipse around the green, +3 yd, edge 11 | banks fall away on every side, steepest toward the chasm |
| Bank in front of the green | `cover` → FAIRWAY | polygon z 346–368 | closely mown, so short balls roll back to the sea instead of stopping in rough |
| Small green, back to front | `green` | 26 × 22 yd, `tilt.z` −0.03 | putts from above are fast; balls feed toward the front |
| Coastal wind, fast greens | `play` | wind 6–18 mph, `greens.speed` 1.1 | |

**Capability gaps**: the blind aiming rock on the real tee (no obstacle primitive yet); the real green's specific contours (approximated by tilt).

## 5. Exaggeration

| Characteristic | Real | Game | Why |
|---|---|---|---|
| Run-out off the tee | longest hitters club down | a pure driver (and a 90% one) goes into the sea; a pure 3-wood stops ~16 yd short of the edge | makes club choice the tee decision, as it is for pros |
| Chasm | carry over the cove | ~70 yd of ocean between plateau and green-side bank | a chunk (−20%+ distance) must pay |
| Shaved bank | rough slope | fairway-cut slope from the green to the cliff | short-right feeds into the sea |
| Downhill approach | moderate | ~6 yd lower than the plateau | |

## 6. Validation

All in `tests/hole-checks.js` → `pebble-8`.

| Shot | Expected | Result |
|---|---|---|
| Pure driver, down the middle | water | ✅ water (was fairway before Phase 3) |
| 90% driver | water | ✅ water |
| Pure 3-wood | fairway, short of the cliff | ✅ fairway, 130 yd left |
| Iron from there, slight mishit (0.1) | green within 8 yd | ✅ 7 yd |
| Chunked iron (0.7) | water | ✅ (was rough) |
| Thin-right iron (0.55) lands on the shaved bank | water | ✅ (was rough) |
| Bail-out left around the cove (0.5 miss) | dry | ✅ |

| Decision | Must hold | Result |
|---|---|---|
| Tee club: driver / 3-wood / iron | driver wet more often than not; 3-wood dry and best for both skills; iron leaves 60+ yd more | driver wet 100% (sharp) / 48% (shaky); 3-wood 0% wet, best score; iron leaves 222 vs 137 |
| Approach: pin / bail left | pin risks the chasm for a shaky player; sharp always greens it; bail is dry but costs 0.5+ strokes | pin wet 10% for shaky (0% before); bail costs ~0.9 strokes |
