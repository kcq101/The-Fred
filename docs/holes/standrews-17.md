# Iconic hole spec: St Andrews Old Course No. 17 (the Road Hole)

## 1. Inspiration

| | |
|---|---|
| Real hole | St Andrews Old Course, hole 17, the Road Hole |
| Par / yardage (real) | Par 4, about 495 yards (lengthened for recent Opens) |
| Par / yardage (game) | Par 4, 488 yards tee → pin since the lidar rebuild moved the pin behind the bunker (470 before; `cards/card4.jpg` now reads 488). A pure driver leaves about 138 yards on the firm fairway; reaching in two takes a driver and a long second. |
| Sources | See below |

- [golf.com — Inside the Old Course's Road Hole](https://golf.com/travel/inside-oid-course-road-hole-st-andrews/?amp=1)
- [golfcoursearchitecture.net — Iconic Road Hole to be lengthened](https://www.golfcoursearchitecture.net/content/iconic-road-hole-to-be-lengthened)
- [Golf Channel / AP — Open organizers give Road Hole back its danger](https://www.golfchannel.com/news/article-associated-press-open-organizers-give-road-hole-back-its-danger)
- [European Tour — Road Hole to be lengthened ahead of the 2010 Open](https://www.europeantour.com/dpworld-tour/news/articles/detail/road-hole-to-be-lengthened-ahead-of-the-2010-open/)
- [golf.com — St Andrews Old Course, Top 100](https://golf.com/courses/st-andrews-old-course-golf-top-100-courses/)

## 2. What makes it iconic

- **Signature features**: the drive over the hotel/sheds corner, the Road Hole Bunker eating into the front-left of a narrow, angled green, the tarmac road hard behind the green, and the stone wall behind the road.
- **The strategic problem in one sentence**: the pin sits behind a deep bunker you cannot play out of forwards and the "safe" long shot runs through the green onto the road, so you either play short and take a bogey-ish par, or fly the bunker with exactly the right club.
- **Where scores are made and lost**: the second shot. Long is dead (road, wall); short-left is the bunker. Par is often made from the front of the green with a putt or bump-and-run.

## 3. Analysis — the challenge archetypes

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Distance control / run-out | Yes (primary) | Approach | Firm turf: the ball runs; long is the road |
| Forced carry | Partly | Approach | Over the bunker to a pin behind it |
| Dogleg / corner to cut | Left out | Drive | The hotel corner is a blind drive; see gaps |
| Elevation change | No | | |
| Sloping lies | No | | |
| Narrow landing zone | Yes | Approach | The green is narrow and angled |
| Deep or pot bunkers | Yes | Approach | The Road Hole Bunker |
| Green contours | Mild | Approach | A gentle tilt away from the road |
| Penal surrounds | Yes | Approach | Road and wall |
| Wind exposure | Yes | Both | 8–20 mph, exposed links |
| Risk/reward split | Yes | Approach | Fly it, attack the tucked pin, or play the front |
| Firm/fast turf | Yes | Both | `firm:1.5`, fast greens |

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Road Hole Bunker | bunker, outline from the lidar (a 5 m pot cutting into the green's left end) | `depth:2.6, lip:0.6` (§5) | Very deep; escapes sideways but not forwards |
| The green | ellipse laid along the lidar's plateau (no aerial yet) | 38 × 16 yd, rotated 0.9 rad: front-right to back-left along the road; `tilt` from the lidar plane (1.2 % down to the left) | A long, narrow, angled target |
| Heights | `ramp`s from the lidar and a 0.8 yd `rise` under the green | links ground within a yard of flat; the green 0.7 m above its apron | |
| The road | **new** `ROAD` surface via a `cover` band | on the lidar's flat strip below the green's back edge, from the right of the green diagonally behind it, `w:3.4`, `over:['ROUGH','FAIRWAY']` | Hard and fast: balls skip and roll out |
| The wall | **new** `wall` obstacle (generic `OBSTACLES` registry) | at the foot of the lidar's rise beyond the road, `t:1.2, h:2.2, e:0.3` | Stops balls in flight and on the roll; kicks them back |
| Firm links turf and wind | play profile | `firm:1.5, wind:[8,20], windPush:1.6, greens:{speed:1.15, firm:1.3}` | Run-out everywhere |
| Scholar's and Progressing bunkers | bunkers, outlines from the lidar (named on the yardage book) | short-left of the green, 1.0 and 0.6 m deep | Positional; the two invented fairway pots are gone (no hollows there) |
| Dunes | `theme:'links'` backdrop | | Golden dunes behind |

**Capability gaps**: the blind drive over the hotel/sheds corner and the out-of-bounds line along the hotel are not expressed. The game has no blind shots and no OB along a side, so the drive is a plain fairway shot.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 495 yd | 488 yd | A pure driver plus a full iron is just reachable with a long second |
| Firmness | firm | `firm:1.5`, greens firm 1.3 | The run-out is the point: a flown pin ball runs through to the road |
| Road Hole Bunker depth | 1.4 m below the green, 1.8 m below its back face, the face revetted (near vertical) | depth 2.6, lip 0.6 (the lidar's 1.6 yd ×1.6) | The game has no revetted face: at the lidar's depth a wedge from the middle flies out (it holed out on the probe). 2.6/0.6 is the least that keeps the forward escape failing, standing in for the face (the owner's choice, 2026-10-20) |
| Pin | the Sunday pin, tucked behind the bunker | (24.5, 487.1): the card reads 488 tee → pin, not 470 | The attack-over-the-bunker decision needs a pin beyond it, and the lidar puts the bunker at the green's left end, not in front of the old pin (the owner's choice) |
| Road | tarmac | ROAD: e .36, mu .16, dec 5.0 | A wedge rolls ~6 yd, an iron ~17 on it (fairway: 3 and 7) |
| Wall | stone, ~1.5 m | height 2.2 yd, restitution 0.3 | Reads as solid; makes the back of the green a real penalty |

Simplified: the hotel, the sheds and the out-of-bounds line are left out.

**Realism bounds** (`node tests/tools/slope.js standrews-17`, `docs/maps/standrews-17-slope.png`): one gentle plane (the lidar's, 1.2 %), 100 % of the surface in the 1–2.5 % band, no steep ring and not a dome; "flat pockets" reads WARN. The green's contours are mild by §3's own account; the hole is decided by the bunker, the road and the wall, not by putting, so the green is left as it is.

## 6. Validation — the contract

| Shot | Expected |
|---|---|
| A pure drive runs out on the firm fairway | Fairway, a full iron left (125–150) |
| An iron flown at the pin, from (1, 345) | Runs through the green and off the back |
| Landed short of the tucked pin and run up, at (22, 472) | Holds the green, ≤ 10 yd |
| The attack over the bunker's edge (27.5, 476.5), pulled a little | The Road Hole bunker |
| Into an 18 mph headwind, the attack | Comes up short of the green |
| With an 18 mph tailwind, the attack | Flies the green into the rough behind |
| A 3-wood landed on the road behind the green | Strikes the stone wall |
| A wedge from the middle of the bunker at the pin | Cannot get out forwards |
| The safe line to the wide front, (10, 460) | Holds the green |

| Decision | Plans | Must hold |
|---|---|---|
| The second shot | fly the tucked pin / attack it over the bunker's edge / play to the middle and run up | Flying it holds the green less than half the time for a sharp player (never, now: it runs off the back) and is the worst plan for both players; attacking puts even a sharp player in the bunker at least one time in five (4 in 21); the middle holds a sharp player 21 times in 21, beats the attack, and keeps a shaky player out of the bunker twice as often. |

**Honest note**: this hole's geometry was tuned with scratch probes before its checks were written, contrary to the workflow. The checks were then written against the tuned hole and pass. Holes 5 and 6 had their checks written first.

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| The second shot (strategy) | `lieAdd: { SAND: 1.0 }`: any sand lie costs a full stroke | no `lieAdd` | The baseline gained a recovery-difficulty term that charges a ball short of a steep face. In the Road Hole bunker (the ground rises 4.1 yd between the ball and the pin line, so the raw charge is 1.10) it reaches its 1.0 cap on top of sand's 0.35, so the bunker now costs 1.35 where the hack gave 1.0. Every expectation holds without the override. The four plans that end in sand or at the foot of the bank score 0.06–0.10 more than before (fly shaky 3.62 → 3.71, attack sharp 3.25 → 3.33, attack shaky 3.45 → 3.56, middle shaky 3.47 → 3.53); fly and middle for a sharp player are unchanged. The order is the same for a sharp player (middle < attack < fly in strokes); for a shaky player attack and middle swap by 0.03 (attack 3.45 vs middle 3.47 before, middle 3.53 vs attack 3.56 now): the middle is the better plan for both, and fly is still the worst |
| All nine shots and the strategy (2026-10-20, lidar rebuild) | from (0, 334), the bunker in front of the pin at (21, 456), the pin at (18, 470) | from (1, 345), the bunker at the green's left end (32.9, 473.8), the pin tucked behind it at (24.5, 487.1) | The Scottish lidar puts the Road Hole bunker 15 yd left of the old pin, cutting into the green's left end; the owner chose to move the pin to the Sunday spot behind it so the attack-over-the-bunker decision survives. (1, 345) is where the pure drive now stops. Each shot keeps its meaning, re-aimed: the attack line is (27.5, 476.5), the bunker's edge (aimscan: 4 sharp shots in 21 in the sand), and "middle" is (18, 468) |
| An iron flown at the pin | runs through onto the road | runs through the green and off the back (road or rough) | The lidar's road runs diagonally behind the green, 12 yd behind the tucked pin; balls flown at it stop in the rough strip short of the road |
| Flying the pin (strategy) | puts a sharp player on the road more than 10 times in 21 | holds the green less than half the time | Same: it runs off the back, but into the rough before the road |
| A 3-wood into the back of the green | strikes the wall and kicks back onto the road | landed on the road, strikes the wall (rest on the road or the rough) | The wall kicks it back across the road into the rough strip |
| The middle of the bunker (wedge check) | (22, 456) | (32.5, 474.5) | The bunker moved |
| `tests/holes.test.js` recovery tests, `tests/tools.test.js` probe test | the old bunker, start and aim; the Road Hole bunker at ≥ 0.9 of the recovery cap | the new ones; ≥ 0.7 of the cap (it is 0.75) | A 5 m pot has less face around the ball than the old 18 × 10 yd bowl |

## 7. Results

`node tests/hole-report.js --hole=standrews-17` after the lidar rebuild:

```
=== St Andrews Old Course (standrews-17) — A long second into a narrow green on firm links turf, angled from front-right to back-left along the road: the deep Road Hole bunker eats into its left end (a ball in it cannot play out forwards), the Sunday pin is tucked behind it, and a hard road and a stone wall sit behind. Land it short and let it run; fly the pin and it runs off the back.
shot                                                                           before           after
a pure drive runs out on the firm fairway and leaves a full iron               FAIRWAY 198y     FAIRWAY 143y
an iron flown at the pin runs through the green and off the back               GREENS 0y        ROUGH 11y
landed short of the tucked pin and run up, an iron holds the green             GREENS 8y        GREENS 2y
the attack over the bunker's edge, pulled a little, drops into the Road Hole   ROUGH 17y        SAND 14y
into an 18 mph headwind the attack comes up short of the green                 GREENS 10y       FRINGE 16y
with an 18 mph tailwind it flies the green into the rough behind               GREENS 7y        ROUGH 14y
a 3-wood landed on the road behind the green strikes the stone wall            ROUGH 18y        ROUGH 27y
from the middle of the bunker a wedge at the pin cannot get out forwards       GREENS 1y        SAND 14y
the safe line to the wide front of the green holds it                          GREENS 26y       GREENS 16y

  strategy: the second shot: fly the tucked pin, attack it over the bunker's edge, or play to the middle and run up
  plan       skill   before: wet green score   after: wet green score
  fly        sharp           0%  33% 2.68              0%   0% 3.37
  fly        shaky           0%  24% 2.95              0%   0% 3.58
  attack     sharp           0%  76% 2.94              0%  33% 3.30
  attack     shaky           0%  62% 3.19              0%  38% 3.30
  middle     sharp           0%  90% 3.15              0% 100% 2.77
  middle     shaky           0%  52% 3.37              0%  52% 3.21

"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).
```

## 8. Review — does it look like the hole?

**Fast lane, lidar** (2026-10-20). Bunkers, the road and wall lines, heights and the green's plane from the Scottish lidar; the green is still an ellipse (no aerial), laid along the lidar's plateau.

**References used**: Scottish Public Sector LiDAR Phase 5, 50 cm DTM, tiles NO41NE and NO51NW (Open Government Licence v3; not in the repo); map pins from the project owner on the green and the back tee; two yardage-book pages (`standrews-17-yardage-1.jpg`, `-2.jpg`, not in the repo) — direction and the bunkers' names, not traced. Frame: `docs/holes/trace/standrews-17.json` (tee → pin 405 m at 140.9°; 1.161 game yd per m).

**What changed**

| Item | Was | Now |
|---|---|---|
| Road Hole bunker | an 18 × 10 yd bowl in front of the pin, 2.8 deep, lip 0.9 | the lidar's 5 m pot at the green's left end, 2.6 deep, lip 0.6 (§5) |
| Green and pin | ellipse rotated 0.22 rad; pin (18, 470) | laid along the lidar's plateau, rotated 0.9 rad; the pin tucked behind the bunker at (24.5, 487.1) |
| Road and wall | wrapped round the back of the green at z ≈ 483 | on the lidar's flat strip and rise: diagonally behind the green |
| Fairway bunkers | two invented pots | Scholar's and Progressing, short-left (lidar) |
| Highest hop, ten seeds (from the first touchdown) | 4.76 yd (the guard's own seed: a 31° grass bank at the old bunker's lip) | 2.63 yd; `tests/ball.test.js` passes |

**Renders**: `docs/maps/standrews-17-tee.png`, `docs/maps/standrews-17-aerial.png`.

**Verdict**
- Tee and direction: **matches** (the owner's two pins and both yardage pages).
- Heights: **matches** (lidar).
- Green: **close** — placed and angled on the lidar's plateau, but an ellipse.
- Bunkers: **matches** for place; the Road Hole bunker's depth **differs on purpose** (§5).
- Road and wall: **matches** for their line (lidar); the hotel, sheds and OB are still not expressed.

**Open items**
1. An aerial of the green: trace its outline (the real green wraps round the bunker).
2. A revetted-face primitive, so the Road Hole bunker can take its real depth.

### Earlier review-only pass


**Review-only pass, no reference image yet** (2026-10-19). The verdicts below compare the game's renders (`python3 tests/tools/render.py standrews-17 tee bird approach green aerial`; the green-complex view is committed as `docs/maps/standrews-17-aerial.png`) with this spec's sources and what is widely known of the hole. Nothing here was traced, so no shape is measured: "close" means the parts are there and in the right places, not that their sizes are right, and every **no reference** row waits for a photo. The step and its tools: `docs/ICONIC-HOLES.md` §2, step 7.

**Photos to get**: an aerial of the green from short-left (the Road Hole Bunker, the green, the road and the wall in one frame), and the drive over the sheds from the tee.

| Area | Item | Verdict | Evidence (render against sources) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | **can't express yet** | The real drive is blind, over the replica railway sheds at the corner of the Old Course Hotel, with out of bounds along the hotel; the game's drive is a plain open fairway (spec §4) | A blind-shot primitive and a side out-of-bounds line |
| | Elevation: tee, landing area, green | **close** | Flat links; the green on a slight plateau | — |
| | Ground between | **close** | Gentle links roll | — |
| Fairway and fairway bunkers | Fairway outline and width | **close** | One fairway bending right toward the green | — |
| | Fairway bunkers: count, place, shape | **close** | Two small pot bunkers short of the green, as the spec has them | Trace from an aerial |
| | Rough, waste, paths | **close** | Gorse-like scrub along the sides | — |
| Green and greenside bunkers | Green outline and size | **close** | Long, narrow and angled away to the right: an ellipse rotated 0.22 rad; the real one is longer and its front edge bends round the bunker | Trace from the aerial (expressible now) |
| | Green contours as seen | **no reference** | — | — |
| | Greenside bunkers: count, place, shape, depth | **close** | The Road Hole Bunker eats into the front-left of the green, very deep (2.8 + 0.9 yd) | Its round shape from the aerial; at that depth a traced outline must be checked against the hop guard (Riviera No. 6 §5) |
| | Collar, banks and falloffs | **close** | — | — |
| Surroundings and landmarks | Trees: kind and where | **matches** | None, as on the real links | — |
| | Water, cliffs, structures, backdrop | **close** | The road behind the green and the stone wall behind the road, both playing; golden dunes beyond | — |
| | Landmarks a player would name | **differs: fix** and **can't express yet** | The hotel is one small red-roofed `clubhouse` to the right of the drive; the real hotel is a long block and the sheds a black barn-like front | A building prop with size, colour and count (shared with Riviera No. 6) |

**Open items**, most important first:
1. The blind drive over the sheds, and OB along the hotel: the hole's first shot is not the real one (needs a blind-shot primitive and side OB).
2. The hotel and sheds as buildings of the right size: a building prop.
3. Trace the green and the Road Hole Bunker from an aerial.
