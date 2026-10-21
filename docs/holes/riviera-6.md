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

Two reference photos (not in the repo: someone else's pictures, see §8), both supplied by the project owner: an aerial of the green complex from short of it, and a photo from behind the tee (a phone screenshot of a Facebook post). Traced in `docs/holes/trace/riviera-6.json`.

**Lidar.** The 2025 USGS 3DEP 1 m elevation survey of the area (project `CA_2025LosAngelesPostWildfire_C25`, public domain; 127 MB, not in the repo), located by a map pin from the project owner on the middle bunker. It gives what the photos could not: the heights from tee to green and behind it, the green's real tilt, and a check on the tracing's size (§5, §8). Recorded under `lidar` in the trace file.

No written source gives the green's size or the middle bunker's dimensions beyond "small, almost a pot bunker". The photos and the lidar do, at the game's scale (§8): the green is about 23 × 20 yd, the middle bunker's sand about 2.4 × 2.8 yd.

**No source I read describes a false front on No. 6** (Golf Digest's piece, the closest, describes feeder slopes into the lower front-right area and says nothing of a false front). The real feature the game keeps is that tier: a lower front-right area and an upper back-left one with severe pitch between them. §6 says what the baseline cannot see of it.

## 2. What makes it iconic

- **Signature features**: a small pot bunker in the middle of the green that cuts it into four quadrants, a big two-lobed bunker short of the green with a grass tongue into it (the sources' "large deep bunker front-left": the photos put it straight in front of the pin, its left lobe the larger), a nasty one behind, a small one off the left end, a green that falls from back to front, and a tier: a lower front-right area and a flatter upper back-left one, with pitch too severe between them for a pin. Behind it all a steep grass bank climbs to a hedge and the houses on the hill. Chipping over the bunker from the green is legal and has been done.
- **The strategic problem in one sentence**: the middle of the green is a bunker, so you cannot aim at "the green"; you pick a quadrant, and a miss on the wrong level or the wrong side of the bunker leaves a pitch over it or a putt bent around it.
- **Where scores are made and lost**: the tee shot's *target*, not its club. The right pin is a small, lower target; the safe quadrant is bigger and above it, across the bunker.

## 3. Analysis — the challenge archetypes

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Risk/reward split (aggressive vs safe line) | **Yes (primary)** | Tee shot | Attack the short-right pin, or bail to the big back-left quadrant |
| Green contours (tiers, false front, tilt) | **Yes** | Tee shot, putt | A tier between the two pin areas and a back-to-front tilt (no false front found in the sources, see §1) |
| Deep or pot bunkers | **Yes** | Tee shot | One in the middle of the green; a big one short of it, small ones behind and off the left end |
| Distance control / run-out | Mild | Tee shot | A full iron; long goes into the back bunker |
| Penal surrounds | Mild | Recovery | Bunkers on three sides of the green |
| Forced carry, dogleg, elevation, sloping lies, narrow landing zone, wind, firm turf | No | | |

It differs from Augusta No. 12 (the other par 3 here) on purpose: no water, no wind; the whole hole is the green.

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| The green's outline | traced outline `green:{pts}` | 22.6 × 19.7 yd, 295 yd²: traced from the aerial, sized by the lidar (§8) | A wide, shallow-ish green running from a back-left arm (above the left bunker) to a rounded front-right end |
| Pot bunker in the middle of the green | a traced bunker inside the green's outline (`S` checks bunkers before the green, `H` digs them into it) | 4.7 × 5.6 yd (the traced 2.4 × 2.8 yd ×2: §5), `depth` 0.46, `lip` 0.25 (lidar 0.61 m) | The obvious target is sand; a ball aimed at it that is not caught rolls into a quadrant on either side |
| Big two-lobed bunker short of the green | traced bunker | 11.9 × 15.7 yd, 98 yd² of sand round a grass tongue, `depth` 0.68, `lip` 0.25 (lidar 0.90 m) | The miss short, under the pin |
| Bunker behind the green | traced bunker | 6.7 × 5.1 yd, `depth` 0.61, `lip` 0.25 (lidar 0.81 m) | The miss long: a downhill sand shot to a front pin |
| Small bunker off the left end | traced bunker (new: the hole did not have it) | 2.5 × 5.5 yd, `depth` 0.48, `lip` 0.25 (lidar 0.64 m) | The pull past the back-left quadrant |
| Back-to-front slope | green `tilt` | `z` 0.025, `x` 0.015: 2.9 %, rising toward back-left (the lidar: 4.9 % and 2.7 %) | Above the hole is the wrong side, and a putt from the back-left quadrant runs (§5) |
| The ground from tee to green | `ramp` down, then up | −2.3 yd over z 20–95; +2.3 yd over z 112–134 | The tee sits level with the low pin area; the ground dips in front of the green complex and climbs back through the front bunker, as the lidar has it. The tee shot plays over a hollow |
| The bank behind the green, up to the houses | `ramp` ×2 | +1.6 yd over z 150–164 (the apron round the back bunker); +16 yd over z 165–192 (about 40°) | A big miss long stops on the bank, 27 yd from the pin, instead of running 70 yd on (§6) |
| Lower short-right area, upper back-left area, severe pitch between | a `step` along the front-left → back-right diagonal, so the back-left side sits higher; a broad soft `hollow` around the pin | `step` `dh` 0.4 over `w` 7; `hollow` 21.8 × 14.4 yd, `depth` 0.08 | The two pin areas, a belt of pitch across the other two quadrants, and a flat pocket at the pin. On the traced green the two pin quadrants are also the big ones (front-right 112 yd², back-left 111 yd²; front-left 66, back-right 49), which is what USWO.com says limits the real pins to those two |
| Pins only short-right and back-left | the hole's one `pin`, short-right | (−6.3, 138.1), 3.3 yd from the front edge | The small, lower target. The aerial's pin that day was 4 yd left of it, in the same area |

**Capability gaps**:
- **One pin per hole.** The real decision flips round to round (short-right or back-left). The game has a fixed pin, as Augusta No. 12 does; this hole is the short-right day. A per-round pin list would cover it.
- ~~The green's true outline~~ ("strangely shaped", per The Fried Egg): **closed by the visual review.** Greens and bunkers can now be traced outlines (`pts`), read through the same `ell()` by heights, surfaces, colours and the green's shader.
- **The hedge and houses behind the green** (§8): props the game does not have (its one building, `clubhouse`, is a single red-roofed block). ~~The bank~~: built from the lidar, with a check for the long miss.
- **Putts in the test tools.** `playShot` cannot play a putt: the Putter has no launch arc, so the aim-power search returns NaN. Putting around a bunker, the other half of the real hole's recovery, is therefore not tested here, and is not seen by the baseline either (§6).

A bunker inside a green needed no new primitive; the traced shapes needed one (`pts` outlines), added once for every hole.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 199 yd (164 for the Women's Open) | 138 yd | See §1: an iron is the longest club that holds a green this small |
| Green size | not given by the written sources; 23 × 20 yd at this scale from the photos, sized by the lidar | traced and lidar-sized: 22.6 × 19.7 yd, 295 yd² (was 25 × 22 yd, 359 yd², from the photos alone; before that a 30 × 23 yd ellipse, 542 yd²) | **Not exaggerated.** The lidar made every traced shape 0.906 the size (§8). The pin and safe plans still hold for a sharp player (95 % and 81 %); a shaky one holds 38 % and 48 % |
| Middle bunker | "small, almost a pot bunker"; the photos and lidar: 2.4 × 2.8 yd of sand at this scale | 4.7 × 5.6 yd: the traced outline **×2** about its middle (`exaggerate` in the trace file), `depth` 1.3 | **Exaggerated, and the one place the hole is drawn bigger than the photo.** Before the tracing it was a 9.4 × 7.4 ellipse, enlarged from a first 6.8 × 5.4 so that aiming at the middle found the sand half the time (§6). The photos say that was 3.5 × the real width. At ×1 a pure iron at the middle still stops in the sand, but a sharp player's spread finds it 4 times in 21 and from the tee it is a dot; ×2 catches 7 in 21 (6 in 21 at the lidar's size), reads from the tee, and is still a small pot beside a 25-yd green. ×3 (the old size) is what the old 50 % check needed: the check changed instead (§6) |
| Back bunker | "nasty"; no figures | traced 7.5 × 5.7 yd, depth 0.9, lip 0.15 | Smaller than the 17 × 10 ellipse it replaces. **Shallower than the old one (1.4 / 0.3)** for the same reason that one was softened: the shared random-shot guard in `tests/ball.test.js` (highest hop on dry ground under 3.5 yd). A traced outline's walls are as wide as 0.45 of its depth inside (the largest circle that fits), so a small or thin bunker gets steep walls at a depth an ellipse of the same length carried; at 0.3 lip a 3-wood landing on the back lip hopped 4.0 yd |
| Front and left bunkers, depths | front "large deep"; no figures | front 1.2 / lip 0.35 (was 1.9 / 0.6 as an ellipse); left 0.6 / 0.2 | The same guard, checked over nine seeds, not only the test's: at front 1.6 the hops off its front lip reach 4.0 yd; the left bunker at 0.7 / 0.3 threw one 3-wood 8.9 yd. At these depths the worst hop over nine seeds is 3.56 yd, against 4.17 for the hole before the tracing. The baseline charges the front bunker 0.23 for its face (it charged 0.59): shallower than the real one, said here rather than hidden |
| Tier | severe pitch in two quadrants (USWO) | `step` 0.4 yd over 7 yd, a diagonal belt | 31 % of the surface is steeper than 4 %, part of that the bunker rims; the belt is what makes two quadrants unfit for a pin |
| Back-to-front slope | "a lot" (The Fried Egg); **the lidar: a plane rising 4.9 % to the back and 2.7 % to the left**, 1.6 m of fall across the green | 2.9 % plane (`z` 0.025, `x` 0.015), up from 1.0 % | **Still milder than the real green, but now close to it, by decision** (the project owner chose this over keeping 1 %). The 1 % plane was cut to pass the flat-pockets bound; the lidar showed it was a third of the real slope, and the slope is part of why the pin decision is hard: a ball above the hole, or a putt from the back-left quadrant, runs. It costs the realism bounds below |
| Ground from tee to green | the photos: a raised tee looking down into a dip; no figures | the lidar, at 0.69 scale: tee level with the low pin area, a 2.3 yd dip short of the green complex, back up through the front bunker | **Not exaggerated.** Heights at the hole's length scale (real m × 0.755). The "raised tee" in the tee photo is the dip in front of it |
| The bank behind the green | steep grass up to a hedge and the houses | +1.6 yd apron round the back bunker, then +16 yd over 27 yd (about 40°) | **Not exaggerated** (the lidar: 19 m over 25 m, at 0.69 scale). It passes the shared hop guard as built |
| Wind, greens | not sourced | `wind:[0,6]`, `greens:{speed:1.15, firm:0.8}` | A light breeze; greens a little fast and soft so a full iron holds. Tuning, not research |

**Realism bounds** (`node tests/tools/slope.js riviera-6`, `docs/maps/riviera-6-slope.png`): 0 / 10 / 50 / 39 % in the four bands with the 2.9 % tilt (12 / 57 / 4 / 27 % at 1 %; 11 / 54 / 3 / 31 % on the first ellipse). **Three WARNs, accepted**: the real green is one steep tilted plane with a tier, and the bounds are written for a green with a gentle top. The no-dome bound, the one that guards against a green with no putting surface, still holds: the slopes all point one way (coherence 0.90). The red diagonal in the map is the tier; the red ring is the middle bunker's rim (counted: its lip sits inside the green). The map's arrows used to point uphill in z (a sign slip in `slope.js`, fixed with this review); they now run back to front, into the pin pocket.

| Bound | Default | This hole | Note |
|---|---|---|---|
| Falloff ring: surface steeper than 4 % | ≤ ~35 % | **39 % (WARN)** | The tier belt, the middle bunker's rim and the steepest part of the plane: the real green is steeper still (4.9 % by the lidar) |
| Top: 1–2.5 % of the non-steep surface | mostly (≥ half) | **17 % (WARN)** | Most of the top is 2.5–4 %: the plane itself |
| Flat pockets: surface under 1 % | 5–40 % | **0 % (WARN)** | The pin pocket (`hollow` 0.08) no longer flattens a 2.9 % plane. A real green this steep has no flat pockets either; the lidar is too coarse to say whether the pin area does |
| No full-green dome | not (> 60 % steeper than 2.5 % *and* slopes every which way) | 90 % steeper than 2.5 %; tilt coherence 0.90: **ok** | One tilted plane with a tier, not a dome |

## 6. Validation — the contract

Written into `tests/hole-checks.js` under `riviera-6` before any tuning (commit `8288cec`); the later changes are in the log below.

**Shots**:

| Shot | Expected |
|---|---|
| A well-struck iron at the pin | Short-right quadrant of the green, ≤ 7 yd |
| Aimed at the middle of the green | In the middle bunker |
| A well-struck iron at the big back-left quadrant | Green, 10+ yd from the pin (across the bunker) |
| Aimed at the big front bunker, short of the pin | In the sand |
| Aimed at the small bunker off the left end | In the sand |
| Aimed past the green | Runs through into the back bunker |
| A full Hammer flown well past the green | Stopped by the bank behind it: rough, ≤ 35 yd from the pin (27; it ran 71 yd without the bank) |
| From the back-left quadrant, a wedge | Over the bunker, on the green, ≤ 9 yd |
| From the middle bunker, a wedge | Out, on the green, ≤ 12 yd |

**Strategies** (sharp ±0.2, shaky ±0.55; every plan is an iron, so the club is not the decision):

| Decision | Plans | Must hold (rates and gap, not "X is right") |
|---|---|---|
| The pin | at the short-right pin / to the big back-left quadrant / at the middle | A sharp player holds the green at the pin ≥ 70 % (95 %); aiming at the middle finds the sand ≥ 25 % for a sharp player (29 %) and costs them ≥ 0.3 stroke against the pin (0.45); the back-left quadrant leaves a sharp player ≥ 6 yd more than the pin (18.1 against 4.7); a shaky player holds the green at least as often there as at the pin (48 % against 38 %); the pin saves a sharp player ≥ 0.1 stroke (0.60); for a shaky player the two are within 0.35 stroke either way (0.14, the pin ahead). Figures since the lidar change |

No water on this hole, so the hazard rate is 0 for every plan; the rates that matter are green and sand.

**What the baseline can and cannot see here** (measured before the lidar change, on the 359 yd² green and the 1 % tilt, and not re-run since; the throwaway script is described under §7. The steeper plane makes the under-charge below larger, not smaller: a putt across the bunker is now also downhill or sidehill):

- **It under-charges the safe plan, and by a count I can give but not a size.** A ball on the green pays only `PUTT[distance to the pin]`, whichever quadrant it is in. For the back-left plan, **all 18 of a sharp player's green finishes, and 8 of a shaky player's 11, have the middle bunker on the straight line to the pin** (on the ellipse: 20 of 21 and 8 of 13); the baseline prices each as an open putt (the plan scores 3.24 sharp and 3.25 shaky: one stroke plus the putt table at 15–20 yd). A putt straight across ends in the sand, and the real recovery is a chip over it or a putt bent round it. I cannot say how much more it costs, because `playShot` cannot play a putt (§4). For the pin plan the count is 0 of 29 green finishes. The recovery term cannot help: it returns 0 for any ball on the green, and its `up` face only looks along the line to the pin for ground above a ball that is off the green. The bunker in the green affects the baseline only when a ball finishes in it.
- **That error is in the direction the contract already assumes**: the safe plan looks cheaper than it is, so the pin's real payoff is at least what the baseline says (0.54 sharp, 0.21 shaky). The checks assert lower bounds and a bounded gap; none says the bail-out is the right play, and none could be satisfied by the under-charge.
- **It cannot see a tier or a false front as such, only where the ball finishes.** A ball that pitches onto the lower tier and stays, or trickles back to the foot of it, is charged by distance. (And §1: no source says there is a false front here.)
- **Charges it does make, with no figures to say whether they are right.** On the traced shapes: a ball at the bottom of the middle bunker, 9.5 yd from the pin, is charged 2.49 (2.47 without the recovery term: the face is barely above the 1.0 yd allowance once the green's plane is laid round it). The front bunker's deepest sand, 17.6 yd out, 2.93 (2.70 without, +0.23); the back bunker 2.74 (+0.06); the left bunker 2.75 (+0.00). On the ellipses the front and back bunkers were charged +0.59 and +0.46: they were deeper, and the tracing made them shallower for the hop guard (§5), not because the real bunkers are easier. I have no tour figures for these bunkers, so I do not say any of this over- or under-charges the real hole; the front bunker in particular is shallower here than the sources' "deep".
- **Short-siding is nearly invisible.** The pin is 3.6 yd from the front edge, short-sided in the real sense, but a ball in the rough 7.5 yd short of it is charged 0.08 of the term's 0.30. Across a shaky player's pin plan, the recovery term moves the score by 0.03.
- **The recovery term barely bites anywhere now**: +0.04 stroke on the aim-at-the-middle plan for a sharp player (3.16 → 3.20), +0.03 shaky; 0.03 or less on the others. On the ellipses it was +0.14 and +0.16 on the middle plan, from a deeper middle bunker that caught more.
- `lieAdd` is not used.

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| Putt straight from the back-left quadrant runs into the middle bunker (shot) | in the contract as first written | removed | `playShot` cannot play a putt (Putter has no launch arc; NaN). The check could not be run, and I did not write one that could pass without testing the claim |
| The leave from the back-left quadrant: putt straight / wedge over (strategy) | in the contract as first written | removed; its wedge half survives as a shot check | The putt half cannot be played, for the same reason |
| Aim points: pin-side bunker, middle, front-left bunker, long, back-left target | (0,168), (13,152), (0,186), (8,174), for a 161-yd hole | (0,144), (13,131), (0,160), (8,145), for a 138-yd hole | The hole was rescaled (§1) after the first probe showed a full iron only just reaches a 161-yd pin and cannot reach aims beyond it, and a 3-wood runs through the green. Not a tuning of results. The back-left target (8,145) is short of the quadrant's centre (8,149.5) because a ball runs about 5 yd after landing |
| "Carried 18 yards long, in the back bunker" | named a carry | "Aimed past the green, runs through into the back bunker" | An iron at full power lands about 155 yd out and runs; there is no carrying it 18 yd long. The check's content (long ends in the back bunker) is unchanged |
| Wedge over the bunker from the back-left quadrant | no needle offset | needle offset 0.1 | At offset 0 the wedge holed out, so the check passed on a perfect strike only |
| Aiming at the middle finds the sand (strategy) | ≥ 50 % for a sharp player | ≥ 25 % for a sharp player, **and** at least 0.3 stroke worse than the pin | The visual review (§8). The photos put the middle bunker's sand at 2.6 × 3.0 yd at this scale; the 50 % share needed a bunker 3.5 × that wide (it was tuned up to 9.4 yd to pass). Kept ×2 on purpose (§5), it catches 7 in 21 (33 %). The decision the check stood for, that the middle of the green is the wrong target, is now asserted directly as a cost: 0.54 stroke against the pin for a sharp player |
| Aimed at the deep front-left bunker (shot) | aim (13, 131), "front-left" | "the big front bunker, short of the pin", aim (−3.5, 120.2) | The visual review moved the bunker: traced from both photos it sits short of the green in front of the pin (centroid (0.9, 119.7)), not front-left at (13, 129.5). The aim is the middle of its right lobe; the outcome (in the sand) is unchanged |
| Aimed at the small bunker off the left end (shot) | — | new: in the sand | The bunker is new, found in the photos; the check says it plays as a bunker |
| A full Hammer flown well past the green (shot) | — | new: stopped by the bank, rough, ≤ 35 yd | The bank was built from the lidar, and it changes what a long miss meets (it was §8's first open item). No existing check changed with the lidar update: all nine passed as written, with the figures in the strategy row above |

Not check changes but tuning, recorded in §5: before the visual review the middle bunker was enlarged to meet the "aiming at the middle finds the sand ≥ 50 %" check (the review then showed that check needed a bunker the photos do not support, and the check changed, above); the bunkers' depths were set for the shared hop guard; the plane tilt was cut so the green clears the flat-pockets bound.

**Visual checks**: `node tests/hole-map.js riviera-6` → `docs/maps/riviera-6.png`; `node tests/tools/slope.js riviera-6` → `docs/maps/riviera-6-slope.png`; `python3 tests/tools/render.py riviera-6`: the ball is clear of the bottom HUD in all three views (tee +146 px, bird's-eye +31 px, approach +124 px), pin in view. The matched-camera renders and the sign-off are §8. The key shot by hand is not done: it needs a person with the game open.

## 7. Results

```
=== Riviera Country Club (riviera-6) — A par 3 whose decision is the pin, not the tee shot: a small pot bunker in the middle of the green cuts it into quadrants, a back-to-front slope and a tier separate the lower short-right pin area from the upper back-left one, a big two-lobed bunker sits short of the green in front of the pin, and small bunkers lie behind and off the left end. Every plan is a full iron; what matters is which quadrant you aim at.
shot                                                                           before           after
a well-struck iron at the pin holds the short-right quadrant                   GREENS 5y        GREENS 5y
aimed at the middle of the green, a pure iron drops into the middle bunker     GREENS 13y       SAND 9y
a well-struck iron at the big back-left quadrant holds the green, across the   GREENS 17y       GREENS 17y
aimed at the big front bunker, short of the pin, a pure iron finds the sand    ROUGH 13y        SAND 13y
aimed at the small bunker off the left end of the green, a pure iron finds th  ROUGH 20y        SAND 19y
aimed past the green, a pure iron runs through it into the back bunker         ROUGH 24y        SAND 18y
a full Hammer flown well past the green is stopped by the bank behind it, in   ROUGH 71y        ROUGH 27y
from the back-left quadrant, a wedge over the bunker finishes on the green cl  GREENS 1y        GREENS 1y
from the middle bunker, a wedge gets out and onto the green                    GREENS 0y        GREENS 3y

  strategy: the pin: attack the short-right pin, play to the big back-left quadrant, or aim at the middle (every plan an iron)
  plan       skill   before: wet green score   after: wet green score
  pin        sharp           0%  95% 2.62              0%  95% 2.64
  pin        shaky           0%  38% 3.04              0%  38% 3.10
  safe       sharp           0%  67% 3.27              0%  81% 3.24
  safe       shaky           0%  48% 3.26              0%  48% 3.24
  middle     sharp           0% 100% 3.05              0%  67% 3.09
  middle     shaky           0%  62% 3.06              0%  43% 3.08
```

"Before" is the same land and green with the signature stripped: no features (the tier, the pin pocket, and since the lidar update the dip and the bank), play profile, obstacles, bunkers or water. The green's plane tilt stays, and so does its outline: since the visual review, "before" is the traced green with nothing in or round it. Expected strokes ("score") come from the baseline in `tests/hole-play.js`, including its recovery-difficulty term (see `docs/ICONIC-HOLES.md`). There is no water on this hole, so the `wet` column is 0 throughout; the decision is read from the green and score columns.

A throwaway script (not committed) produced the baseline counts in §6: for each plan and skill it played the 21 swings, tested whether the straight line from each green finish to the pin crosses the middle bunker (`ell` below 0.95, the sand's edge), and compared `evaluate()` with and without `opts.recovery`; `recovery()` and `expected()` were called directly at each bunker's deepest sand. Rerunning it needs only `loadCourse()` and `course.BUNKERS`.

## 8. Visual review — does it look like the hole?

The first hole reviewed against photos, and the proof of the step (`docs/ICONIC-HOLES.md` §2, step 7). Reviewed on the green and its bunkers end to end; the other rows of the checklist from the same two photos.

**Reference images** (neither in the repo; `docs/holes/trace/riviera-6.json` records each by name, size, sha256 and source):

| View | What it shows | Source | Matched camera (`node tests/tools/trace.js riviera-6`) |
|---|---|---|---|
| `aerial` | The green complex from short of it and above, the bank, hedge and houses behind | Supplied by the project owner; photographer unknown | 27 yd up, 83 yd short of the green's middle and 7 yd left of the line, yaw −5.7°, pitch −14°, 30° lens. 8 constraints, rms 1.1 px |
| `lidar` | Bare-earth heights every metre: the bunkers as depressions, the tees as pads, the dip, the green's tilt and the bank (`riviera-6-lidar-vs-photo.png` is the tracing laid on its shaded relief; kept out of the repo like the photos) | USGS 3DEP 1 m, 2025 post-wildfire survey, public domain; located by the project owner's map pin | Georeferenced, no camera: the tracing is matched to its sand for centre, bearing (129.9°) and scale (0.906), IoU 0.57 |
| `tee` | The whole hole from behind the tee | Phone screenshot of a Facebook post (photographer's mark lower left); the photo is the crop inside the app | Held on the hole's line 10 yd behind the tee (see below); 20 yd up, 27° lens. 7 constraints, rms 1.2 px |

How the two photos were used, and what each assumption costs:

- **Traced on the aerial**: the green's outline by hand off a gridded zoom (`trace_photo.py grid`; the right half of the green is in shade and does not flood-fill), the four bunkers by flood fill (`trace_photo.py fill`).
- **Scale** came from the one object of known size, the flagstick (7.5 ft, at the hole's 0.69 length scale: 1.73 game yd), and **position** from one decision: the middle bunker stays at (0, 144), where the checks put it.
- **The lidar corrected the scale.** Matched to the lidar's sand, the four traced bunkers fit best at 0.906 of the flagstick-scaled size (0.905–0.908 at every sand threshold tried), with the hole's direction where the two photos had put it. The trace file applies it as `rescale` (factor 0.906 about the middle bunker), and keeps the photos fitted on the land they were fitted on (`ground: {land: ee24684}`): refitted on the new land, the oblique aerial's weak depth moved the front bunker 6 yd short of where the lidar has it, and on flat ground the shapes matched the lidar worse. Per bunker against the lidar: front IoU 0.56 (3.9 m off), back 0.66, middle 0.56, left 0.17 (shallow, hard to see at 1 m).
- **Orientation comes from the tee photo.** With the aerial alone the camera's yaw had to be assumed (0: straight down the hole), and that put the big front bunker 1.5 yd right of the middle bunker. From the tee it is plainly a little left of it. Six landmarks seen in both photos (bunker ends and tips, the left bunker) solved together with both cameras give a yaw of −5.7°; the fit with yaw held at 0 is 7.4 px rms, ruled out. The tee photo is too far from the green to say where its own camera stood (with the tee box added as a point the fit runs away to a 5° lens from 700 yd back), so that camera is held on the line 10 yd behind the tee and the photo is used for directions only. Moving it to 3 or 25 yd behind changes no outline by more than 0.5 yd.
- **No roundness assumption.** A one-photo fit needed "the pot bunker is round from above" to know how steeply the camera looks down; two photos do not. Adding it back makes every outline about 12 % shallower (green 19.1 deep instead of 21.7); it is listed as a sensitivity run, not used.

**Traced against the hole before the lidar update** (`node tests/tools/trace.js riviera-6 --ref=ee24684`; the table against the hole before the first review, `--ref=12b4aaa`, is in this file's history):

```
outline      kind     width × depth yd   area yd²   centroid (x, z)    | game shape at ee24684: width × depth, area, centroid  overlap
green        green    22.6 × 19.7             295   (0.0, 144.2)    | 24.8 × 21.5, 360, (0.0, 144.2)                  IoU 0.82
middle       bunker   4.7 × 5.6                20   (-0.0, 144.3)   | 5.0 × 6.0, 24, (-0.0, 144.3)                    IoU 0.82  exaggerated ×2 (as traced 2.4 × 2.8, 5 yd²)
front        bunker   11.9 × 15.7              98   (0.8, 122.0)    | 13.0 × 17.0, 119, (0.9, 119.8)                  IoU 0.48
back         bunker   6.7 × 5.1                24   (-2.1, 153.7)   | 7.3 × 5.5, 29, (-2.4, 154.7)                    IoU 0.55
left         bunker   2.5 × 5.5                11   (11.0, 144.9)   | 2.3 × 5.8, 13, (12.2, 145.0)                    IoU 0.29
```

The written sources had put the hole together well (a pot bunker in the middle, bunkers short, behind) but not its shapes: the green was 50 % too big, the middle bunker 3.5 × too wide, the back bunker 4.6 × too big, the "front-left" bunker 12 yd too far left, 10 yd too close to the green and the wrong shape, and the left bunker missing. Every one of those is now the traced shape, except the middle bunker, kept at ×2 on purpose (§5). The lidar then took 9 % off every length (the photos' one size assumption); the low overlaps above for the small bunkers are that 9 % on a small shape, not a move.

**Renders**: `docs/maps/riviera-6-ref-aerial.png` and `docs/maps/riviera-6-ref-tee.png` (`python3 tests/tools/render.py riviera-6 ref --out docs/maps`): the game from each photo's camera, the traced outlines drawn on top (solid: the photo's pixels; pink dots: the hole's shapes seen by the game camera; red rings and pink crosses: the camera points and landmarks, photo and game). The side-by-sides with the photos are in `tests/tools/out/` when the photos are at hand.

**Sign-off checklist**

| Area | Item | Verdict | Evidence (render against photo) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | **close** | From the tee the green complex is dead ahead in both, the front bunker just left of the middle bunker, the left bunker at the green's left end; the tee photo's directions fit the game's layout to 1.2 px | The real tee box is a long rectangle; the game's is a 9-yd square. Cosmetic |
| | Elevation: tee against landing area and green | **close** (lidar; was differs: fix) | The lidar: the back tee is a pad about 180 m back, level with the low pin area; the "raised tee" in the photo is the dip in front of it. The game now has the same: tee level with the pin area, the dip, the climb back up | Done from the lidar (`ramp` ×2). The bank behind the tee (+7 yd) is not built: it would sit under the tee camera |
| | Ground between | **close** (lidar; was differs: fix) | A 2.3 yd dip at this scale, lowest 50–70 m short of the green, in the lidar and now in the game; the real one is uneven across the fairway, the game's is a smooth trough | — |
| Fairway and fairway bunkers | Fairway outline and width | **close** | A wide cut from the tee to the front bunker in both; the game's is a 24-yd striped strip with rough banks, the real one wider and less regular | None needed for play |
| | Fairway bunkers | **matches** | None on either (the bunkers at the tee photo's left edge belong to the neighbouring hole) | — |
| | Rough, waste, paths | **differs: fix** (cosmetic) | The photo has a winding cart path left of the fairway; the game has none, and scatters grey rocks in the rough that the real hole does not have | Path: a `cover` band of `ROAD`, expressible, low priority. Rocks: **can't express yet**: the rough rocks are placed on every hole (up to 45, whatever `rocks.n` says); needs a per-hole switch |
| Green and greenside bunkers | Green outline and size | **matches** | Traced: the matched render lays the game's green on the photo's outline (rms 1.1 px); the back-left arm above the left bunker and the rounded front-right end are there. Sized by the lidar (×0.906) | — |
| | Green contours as seen | **close** on the plane (lidar); **no reference** for the detail | The lidar's plane: 4.9 % back, 2.7 % left; the game's is 2.9 % (§5, by decision). The tier and the pin pocket are from the written sources: 1 m lidar is too coarse for them | A low-sun or rain photo, or a green-reading map, for the tier |
| | Greenside bunkers: count, place, shape | **matches**; middle bunker **differs on purpose** | Four bunkers, traced; the front one with its two lobes and the grass tongue, the back one with its scalloped back edge. The middle bunker is the traced shape at ×2 (§5) | — |
| | Greenside bunkers: depth | **differs, can't express yet** | The real front bunker is "large deep" and the middle one a pot; here they are 1.2 and 1.3 yd, set by the hop guard (§5), because a traced bunker's walls are steeper than an ellipse's at the same depth and the ball model bounces off steep faces | A bunker face that takes the pace off a ball (sand plugging, or a soft-faced lip in the ball model); then the depths can follow the real ones |
| | Collar, banks and falloffs round the green | **close** | The photo has a mown collar, a striped approach band behind the green, and a dark ring of grass faces round the middle bunker; the game has its fringe ring, rough and the bunker's lip | — |
| Surroundings and landmarks | Trees: kind and where | **differs: fix** and **can't express yet** | The photos have white-barked sycamores left of and behind the green and a wall of dense trees right of the fairway; the game has palms in a row behind the green and oaks and pines along both sides | Placement: tree `zone`s, expressible (move the palms off the back; put trees where the photo has them). The sycamore: no such tree type |
| | Water, cliffs, structures, backdrop | bank **close** (lidar; was differs: fix); hedge and houses **can't express yet** | The bank is built from the lidar: +16 yd over 27 yd behind the back bunker, with a check that a long miss stops on it. The palms stand on its top where the hedge and houses should be | The hedge and the houses: the game's one building is `clubhouse` (a single red-roofed block, one per hole); the houses need a building prop with size, colour and count, on raised ground, and the hedge a tall hedge prop |
| | Landmarks a player would name | **can't express yet** | The houses above the green are what people picture from the tee; the forward tee short of the front bunker is in both photos | The building prop above; a second tee is not something a hole has |

**Signed off**: Claude (visual review, end to end on the green and its bunkers), 2026-10-19, on the branch that adds the step; lidar update (size, heights, tilt) 2026-10-19, branch `lidar-riviera`. A person should look at the side-by-sides, and play the tee shot over the new dip, before calling it done.

**Open items**, most important first:
1. A building prop (size, colour, count) for the houses and a hedge prop: the hole's signature view. One red-roofed `clubhouse` would not be it.
2. Bunker depth: the real bunkers are deeper than the hop guard allows a traced shape to be; needs the ball model to absorb a steep sand face.
3. The tier and the pin pocket: still from the written sources; the green's plane is now from the lidar.
4. Trees where the photos have them; a sycamore type.
5. The cart path; a per-hole switch for the rough rocks.
6. The bank behind the tee (lidar: +7 yd), left out because it would sit under the tee camera.

~~The bank behind the green~~ and ~~the ground from tee to green~~: built from the lidar.

**Bunker depths from the lidar** (2026-10-21). Riviera was left out of the 2026-10-20 pass that set the other holes' bunkers into the land; its depths were still the hand-set ones (middle 1.3, front 1.2, back 0.9, left 0.6; lips 0.15–0.35), up to 2.8 × the real ones, which read as craters. Measured with `lidar.py build riviera-6` (real m × 0.755): middle 0.61 m → 0.46, front 0.90 → 0.68, back 0.81 → 0.61, left 0.64 → 0.48, every lip 0.25. Shapes unchanged (the middle bunker stays ×2 wide). All checks still pass, including a pure iron at the middle finding the sand and a wedge out of it reaching the green; the baseline's middle plan for a sharp player now holds the green 57 % (was 100 %) for 3.16 (was 3.05), and the other plans move by 0.03 or less.
