# Iconic hole spec: TPC Sawgrass No. 17

![map](../maps/sawgrass-17.png)

## 1. Inspiration

| | |
|---|---|
| Real hole | TPC Sawgrass (Stadium Course), No. 17 — the island green |
| Par / yardage (real) | Par 3, about 137–141 yards depending on the day |
| Par / yardage (game) | Par 3, 137 yards |
| Sources | [The Golf News Net: size of the island green](https://thegolfnewsnet.com/ryan_ballengee/2026/03/14/what-is-the-size-of-the-island-green-par-3-17th-hole-at-tpc-sawgrass-and-the-players-125558/) |

## 2. What makes it iconic

- **Signature features**: a green that is almost entirely surrounded by water, about 78 × 81 feet; a small pot bunker; a walkway to the mainland.
- **The strategic problem**: there is no bail-out. Short, long, left or right is usually wet, so the shot is pure distance and direction control — and the wind decides what "the right distance" is.

## 3. Analysis

| Archetype | Applies? | Shot | Notes |
|---|---|---|---|
| Penal surrounds (island) | **primary** | tee | |
| Wind exposure | **primary** | tee | the variable the player has to read |
| Deep bunker | yes | tee | the one dry miss, and a hard one |
| Green contours | yes | putt | |

## 4. Translation

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Island green | water body (`lake`, `wall` bulkhead) with an island; green 28 × 22 yd (about the real size) | unchanged from before | |
| Little margin around the green | `rise` (crown) | +0.9 yd over the island, edge 6 | the strip around the green slopes down to the bulkhead, so marginal shots run toward the water |
| Tier in the green | `step` | line through the green, back-left +0.45 yd | the pin sits on the lower front-right level; long putts climb or fall a ridge |
| Pot bunker | bunker | `depth 1.5, lip 0.4` | |
| Exposed, swirling wind | `play` | wind 7–19 mph, `windPush` 3 (HUD: GUSTY) | the arc shows still air; the player must read the wind |

**Capability gaps**: the walkway; the swirl itself (wind is constant during a shot).

## 5. Exaggeration

| Characteristic | Real | Game | Why |
|---|---|---|---|
| Wind effect | strong, swirling | 3× the ball's normal wind response | with our drag model a 15 mph cross only moved a 137-yd iron ~2 yd; reading the wind has to matter |
| Shedding margin | collar and rough | crowned strip falls to the bulkhead | a "just off" shot should still be in danger |
| Green tier | (invented) | 0.45-yd step | gives the putting surface a feature; labelled as an arcade invention |

## 6. Validation

All in `tests/hole-checks.js` → `sawgrass-17`.

| Shot | Expected | Result |
|---|---|---|
| Well-struck iron (0.1) | green within 8 yd | ✅ 6 yd |
| Carried 12 yd long | water | ✅ |
| Bad miss right (0.6) | water | ✅ |
| Stock shot into a 17 mph following wind | water | ✅ (was rough) |
| Land it short into the same wind | green | ✅ |
| Stock shot to a front pin into a 17 mph headwind | water | ✅ (was green) |
| Arc 11 yd past the pin into that headwind | green within 6 yd | ✅ 2 yd |

| Decision | Must hold | Result (wet %, expected score) |
|---|---|---|
| Reading a following wind: stock vs read | stock is a disaster even for a sharp player; reading keeps a sharp player dry and saves strokes | stock: sharp 86% / 4.72, shaky 33% / 3.91 · read: sharp 0% / 2.76, shaky 38% / 3.65 |
| Skill in still air | sharp always dry; shaky wet at least 1 in 7 | sharp 0%, shaky 19% |
