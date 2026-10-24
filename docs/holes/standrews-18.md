# Iconic hole spec: St Andrews Old Course No. 18 (Tom Morris, the Home hole)

## 0. References

| Reference | Required? | Have it? | Source / note (never commit photos or lidar tiles) |
|---|---|---|---|
| Map pin on the green / tee | yes | **not yet** (asked for) | read from the lidar instead (§1): tee = the raised pad north-east of the 17th green, green = the flat top in front of the R&A's terrace |
| Lidar tiles | yes | yes | Scottish Phase 5 50 cm DTM and DSM, NO41NE and NO51NW (the same as No. 17) |
| Aerial of the green | yes, for its edge | no | the green is the lidar's flat top |
| Photo of the tee shot | optional | no | asked for |

## 1. Inspiration

| | |
|---|---|
| Real hole | St Andrews Old Course, No. 18, "Tom Morris" |
| Par / yardage (real) | Par 4, 357 yd (Open card); 356–357 in every source. The lidar's tee pad → the game's pin: 364 yd |
| **Matches the request?** | Yes: par 4, and the real hole is drivable for tour players |
| Par / yardage (game) | Par 4, **292 yd** since 2026-10-23 (§6: the tee 80 yd up the line, just in front of the Swilcan Burn; 287 yd and 85 yd before), so a pure driver reaches the front of the green |
| Sources | [Wikipedia: Old Course](https://en.wikipedia.org/wiki/Old_Course_at_St_Andrews), [Wikipedia: Swilcan Bridge](https://en.wikipedia.org/wiki/Swilcan_Bridge), [Golf Monthly: the Valley of Sin](https://golfmonthly.com/tour/open-championship/what-is-the-valley-of-sin), [The Open: St Andrews guide](https://www.theopen.com/latest/st-andrews-guide) |

## 2. What makes it iconic

- **Signature features**: the Swilcan Bridge by the tee; the vast fairway shared with the 1st; Granny Clark's Wynd, a public road, crossing it; out of bounds all down the right along the town; the Valley of Sin across the front of the green; the R&A clubhouse behind its left and Hamilton Grand behind its right.
- **The strategic problem in one sentence**: drive at the green and live with the Valley of Sin (and the town right), or play left to the wide open fairway and pitch over the Valley.

## 3. Analysis

| Archetype | Applies? | Notes |
|---|---|---|
| Risk/reward split | **Yes (primary)** | Drive the green, or left at the R&A clock |
| Penal surrounds | Yes | OB right (the town) and behind (Golf Place); the Valley of Sin short |
| Distance control / run-out | Yes | Firm links: drives run through the Valley onto the front |
| Wind exposure | Yes | A wind off the left brings the town into play |
| Forced carry | Trivial | The burn by the tee |
| Bunkers | No | The 18th has none |

## 4. Translation

| Real feature | Game expression | What it does |
|---|---|---|
| The line | tee pad → pin, 92.8°, real scale | |
| Heights | `ramp`s along the line and a `grid` across it (`lidar.py build --grid 10`) | links ground within 2 yd of flat; the green 1 yd above the Valley; the bank behind |
| The Swilcan Burn | `water` creek, `wall` profile, along the lidar's channel | right of and behind the game tee; a topped push finds it |
| The Swilcan Bridge | `bridge` (the stone-arch look) where the DSM has its parapets | beside the tee, front-right |
| The shared fairway | fairway up to 120 yd wide | the left is open |
| Granny Clark's Wynd | `ROAD` cover across both fairways (lidar) | in play: a ball bounces and runs on it |
| Out of bounds right and behind | `ob` polygon beyond the lidar's fence line and the bank behind the green; white `posts` along the fence; `ROAD` for The Links and Golf Place | a push in a wind off the left; an iron flown long |
| The Valley of Sin | the lidar's swale, deepened with a `hollow` (§5) | short shots stay in it; a pure drive runs through it |
| The green | the lidar's flat top round the pin, right of the 1st tee; `tilt` the lidar's plane | |
| Run-off into the Valley | `play.hold` 0.45 (Oakmont's knob) | a ball stopped on the front slope rolls back down |
| Links turf, wind | as No. 17: `firm` 1.5, wind 8–20, `windPush` 0.6, greens 1.15 / firm 3.5 | |

**The look** (step 6b; no photo yet): from the tee a player would name Hamilton Grand (red sandstone, `building` 28 yd high from the DSM) behind the green, the R&A clubhouse (sandstone, from the DSM) behind its left, the Wynd crossing the fairway, the town down the right (seven `building` blocks from the DSM's rooftops along The Links), the bridge and the burn by the tee. All solid; all inside the out of bounds.

## 5. Exaggeration

| Characteristic | Real | Game | Why |
|---|---|---|---|
| Length | 357 yd | 292 yd: the tee 80 yd forward, just past the burn (287 and 85 yd until 2026-10-23, §6) | Under OpenFairway's flight a pure driver totals about 270 on this turf; at 357 the hole could not be driven, which is the point of it. The burn and the bridge move from 70–90 yd ahead to beside the tee (the price; §8). **The owner's choice (2026-10-23): keep it drivable** rather than a tee behind the burn (about 340 yd, the bridge in view, a 50 yd pitch left) |
| Valley of Sin | 0.8–1.0 yd below the green in the lidar (the "8 ft" is from the green's back) | + a 0.9 yd `hollow` | it must hold a ball and read from the fairway |
| Pin | | (−15, 292), back-right toward the town | the drive at the pin aims toward the out of bounds |
| Green slope | lidar plane, 1.3 % | same | `slope.js`: "flat pockets" WARN (one plane; the 50 cm lidar resolves no break) |

## 6. Validation

| Shot | Expected |
|---|---|
| A pure drive at the pin | Runs through the Valley onto the front: fringe or green, ≤ 25 yd (6.8, 2026-10-24) |
| Two-thirds power, 65 % (was 15 %, then 22 % light: §6) | Fairway short of the Valley, 30+ yd (47.8) |
| Down the right, pushed, in an 18 mph wind off the left | Out of bounds in the town |
| At the R&A clock (left), (22, 255) | Shared fairway (42.8 yd) |
| A topped iron pushed right | The Swilcan Burn |
| From the Wynd, a full iron | Flies the green, out of bounds behind |

| Decision | Plans | Must hold |
|---|---|---|
| The drive | at the green (2 yd left of the pin, 2026-10-24) / at the clock, (22, 255) / an iron to the Wynd | the green line finishes nearest and is a sharp player's best (3.47 against 3.59 and 3.86); in still air no line reaches the town for either player; the iron leaves 100+ yd. **Honest note**: the out of bounds takes a push *and* a crosswind; the baseline sees no risk in driving at the green, and a shaky player's best plan is also the drive (3.54) |

**Check-change log**: none until 2026-10-23. The tee shift was chosen from probes before the checks were written (§5).

| Check | Was | Now | Why |
|---|---|---|---|
| **Tee 5 yd back (2026-10-23, low-spin run-out)** | tee 85 yd up the line, just past the Swilcan Burn, 287 yd | tee 80 yd up the line, 4–6 yd in front of the burn, 292 yd; every z +5 (`tests/tools/teeshift.js`) | A low-spin landing now runs out (BallModel `OF.LOWSPIN`): the 15 %-light drive ran onto the fringe (17 yd) and the drive at the clock into the rough. 15 yd back put the tee in the burn (it crosses the line 10–16 yd behind the old tee); 22 yd back, behind it, passed every check but the burn wrapped round the tee and its walled banks showed as stair-steps, so the owner chose the tee in front of it. At 5 yd the clock drive stays on the fairway (47 yd) and the pure drive reaches the green (8 yd) |
| A light drive stops short of the Valley | 15 % light (power 0.85) | 22 % light (power 0.78): 38 yd out on the fairway | At 0.85 it now runs onto the fringe, 18 yd out. Same decision: a drive short of full leaves a pitch over the Valley |
| A topped iron finds the burn | aimed at (−30, 20) | the same, (−30, 20) | The tee tool moved the aim with the land (to (−30, 25)), but a topped iron's carry is fixed, so the aim stays put relative to the tee |
| **A light drive stops short of the Valley (2026-10-24, crater-wall bounce)** | 22 % light (power 0.78): 38 yd out | two-thirds power (0.65): fairway, 47.8 yd out | Under the crater-wall law a lighter drive lands shallower (30° against 36°) and keeps a little more run, where the inverted law gave it less: on flat fairway 24 yd against main's 18.5. On these firm links (`firm` 1.5) the 0.78 drive now runs through the Valley onto the green (9.7 yd). 0.7 stops 30.1 yd out (knife edge), 0.65 at 47.8. Easing `firm` to 1.3 instead kept the 0.78 drive short but made the hole all but undrivable (driving at the green: sharp 19 % on the green, against 100 % on main), so it was not taken |
| **The drive at the R&A clock (shot and the `clock` plan), same day** | aimed at (25, 255) | aimed at (22, 255) | The extra run carried the drive at (25, 255) off the left of the shared fairway into the rough (48.4 yd). At (22, 255) it finishes on the fairway, 42.8 yd out. Clock: sharp 3.57, shaky 3.47 (main at the same aim: 3.49, 3.53) |
| **Driving at the green (the `green` plan), same day** | aimed at the pin | aimed 2 yd left of it, at (−13, 292), away from the town | A shaky player's worst push (needle 0.55) now runs on across the road out of bounds (5 % OOB), which broke "in still air none of the three lines reaches the town". Aiming 2 yd left, as a player would with the town right, keeps it in bounds (0.55: rough, 40 yd). Green: sharp 100 % on the green, 2.92 (main at the same aim 3.02), shaky 62 %, 3.22 |

## 7. Results

`node tests/tools/validate.js standrews-18`: 7 of 7. 600 random shots: highest hop 1.2 yd, slowest settle 15.0 s. One drive played headless in the real game: flight → aim, at rest on the fringe 21 yd out.

## 8. Review

**Verdict**: line, heights, the burn, the Wynd, the fence and the buildings **match** the lidar (DTM, DSM); the tee **differs on purpose** (§5); the green is the lidar's flat top, not traced; no photo to compare.

**Open items**: the owner's pins and a tee-shot photo; a white flag (the 18th's is white); the R&A's detail (it is one hip-roofed block); the bridge is out of the tee camera's view at this tee.
