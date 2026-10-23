# Iconic hole spec: St Andrews Old Course No. 17 (the Road Hole)

## 1. Inspiration

| | |
|---|---|
| Real hole | St Andrews Old Course, hole 17, the Road Hole |
| Par / yardage (real) | Par 4, about 495 yards (lengthened for recent Opens) |
| Par / yardage (game) | Par 4, **438 yards** tee → pin since the OpenFairway physics (2026-10-21: the tee moved 50 yd forward, §6; `cards/card4.jpg` reads 438). 488 after the lidar rebuild moved the pin behind the bunker, 470 before that. A pure driver lands at 245 and runs 54 yd on the firm fairway, leaving 138 yards: a full iron. |
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
| Dogleg / corner to cut | Yes | Drive | Over the corner of the hotel's grounds: the black shed hides the fairway (a blind drive) and the grounds are out of bounds (2026-10-23) |
| Elevation change | No | | |
| Sloping lies | No | | |
| Narrow landing zone | Yes | Approach | The green is narrow and angled |
| Deep or pot bunkers | Yes | Approach | The Road Hole Bunker |
| Green contours | Mild | Approach | A gentle tilt away from the road |
| Penal surrounds | Yes | Approach | Road and wall |
| Wind exposure | Yes | Both | 8–20 mph, exposed links |
| Risk/reward split | Yes | Both | Drive: over the sign, down the right by the hotel (the better angle in, out of bounds close), or bail out left. Approach: fly it, attack the tucked pin, or play the front |
| Firm/fast turf | Yes | Both | `firm:1.5`, fast greens |

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Road Hole Bunker | bunker, outline from the lidar (a 5 m pot cutting into the green's left end) | `depth:2.6, lip:0.6` (§5) | Very deep; escapes sideways but not forwards |
| The green | ellipse laid along the lidar's plateau (no aerial yet) | 38 × 16 yd, rotated 0.9 rad: front-right to back-left along the road; `tilt` from the lidar plane (1.2 % down to the left) | A long, narrow, angled target |
| Heights | `ramp`s from the lidar and a 0.8 yd `rise` under the green | links ground within a yard of flat; the green 0.7 m above its apron | |
| The road | **new** `ROAD` surface via a `cover` band | on the lidar's flat strip below the green's back edge, from the right of the green diagonally behind it, `w:3.4`, `over:['ROUGH','FAIRWAY']` | Hard and fast: balls skip and roll out |
| The wall | **new** `wall` obstacle (generic `OBSTACLES` registry) | at the foot of the lidar's rise beyond the road, `t:1.2, h:2.2, e:0.3` | Stops balls in flight and on the roll; kicks them back |
| Firm links turf and wind | play profile | `firm:1.5, wind:[8,20], windPush:0.6, greens:{speed:1.15, firm:3.5}` | Run-out everywhere; an iron flown onto the green releases (§5) |
| Scholar's and Progressing bunkers | bunkers, outlines from the lidar (named on the yardage book) | short-left of the green, 1.0 and 0.6 m deep | Positional; the two invented fairway pots are gone (no hollows there) |
| Dunes | `theme:'links'` backdrop | | Golden dunes behind |
| The drive over the hotel's corner (2026-10-23) | the shed: three `barn` props (`solid`, dead timber); the hotel: eight `building` props (`solid`, stone); the stone wall round the grounds: a `wall` obstacle; the gravel path beside it: a `PATH` cover; the fairway moved left of the grounds. All measured on the Scottish lidar's surface model (rooftops: DSM − DTM), `docs/holes/trace/standrews-17.json` `landmarks` | wall 1.2 yd high, straight from beside the tee to the corner (22, 98) and straight again down the right; the shed's front 25.5 yd wide, 5.3 yd to the eaves, ~55 yd out, its sign facing the tee; the hotel 8.7–19.7 yd to the eaves from beside the tee to z 255 | Aim over the sign: a pure drive at the pin carries the corner and finds the fairway, 138 yd out; a low shot is stopped by the shed and drops out of bounds |
| Out of bounds right: the hotel's grounds | **new** `ob` area (generic: a polygon; a ball at rest inside is out of bounds, +1 and replay) and a `LAWN` cover | right of the wall, from behind the tee to the hotel's far end | Down the right a shaky player is out about one time in five (§6) |

**The look** (step 6b, from the owner's video of the St Andrews Links flyover and the lidar's rooftops):

| From the tee, a player would name… | Look expression | Does it touch the ball? |
|---|---|---|
| The black shed with OLD COURSE HOTEL painted on it, straight ahead | `barn` props: black horizontal boards, ribbed grey metal roofs, `sign` lettering (white serif capitals, no crest) | yes: `solid` (e 0.2, f 0.2, fy 0.15); the check "a low 3-wood into the shed" |
| The hotel towering down the right | `building` props: sandstone blocks with windows, balcony rails, a dark stone ground floor, hipped and mansard slate roofs (dormers) | yes: `solid` (stone); a sliced drive strikes it and drops out of bounds |
| The stone wall and the path running away to the left, white stakes | `wall` obstacle (rubble stone), `PATH` cover, `posts` | the wall: yes (1.2 yd); the stakes: no |
| The ball-stop netting by the hotel's near end, the trees behind the tee, the garden behind the shed | `net` prop, oak and shrub zones (`ob:true`: planted inside the grounds) | no |
| The town and its spires on the horizon | `town` | no |

**Capability gaps**: since 2026-10-23 the drive is the real one: the shed hides the fairway (blind, without a primitive: it is in the way) and the hotel's grounds are out of bounds (`ob`). Still missing: the hotel's detail (one generic sandstone block per wing: no bay windows, towers or the glazed spa), the Jigger Inn and the car park by the road, and a revetted face for the Road Hole bunker.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 495 yd | 438 yd (the tee 50 yd forward, the sheds and hotel with it) | A pure driver plus a full iron. Under OpenFairway's flight a driver runs 10 yd on flat fairway (main: 41), so at 488 the drive left 197 yd |
| Firmness | firm | `firm:1.5`, greens firm 3.5 (1.3 before the OpenFairway physics) | The run-out is the point: a flown pin ball runs through to the road. With real landing angles (irons 42–49°) a green at 1.3 holds everything within 2–4 yd of its pitch mark, and an iron flown at the pin holed out; at 3 the middle no longer beat the attack (3.08 vs 3.02 for a sharp player), at 4 the attack runs off too often to be a temptation. 3.5 is between |
| Road Hole Bunker depth | 1.4 m below the green, 1.8 m below its back face, the face revetted (near vertical) | depth 2.6, lip 0.6 (the lidar's 1.6 yd ×1.6) | The game has no revetted face: at the lidar's depth a wedge from the middle flies out (it holed out on the probe). 2.6/0.6 is the least that keeps the forward escape failing, standing in for the face (the owner's choice, 2026-10-20) |
| Pin | the Sunday pin, tucked behind the bunker | (24.5, 487.1): the card reads 488 tee → pin, not 470 | The attack-over-the-bunker decision needs a pin beyond it, and the lidar puts the bunker at the green's left end, not in front of the old pin (the owner's choice) |
| Road | tarmac | ROAD: e .36, mu .16, dec 5.0 | A wedge rolls ~6 yd, an iron ~17 on it (fairway: 3 and 7) |
| Wall | stone, ~1.5 m | height 2.2 yd, restitution 0.3 | Reads as solid; makes the back of the green a real penalty |

| The tee-shot landmarks' place (2026-10-23) | the lidar's surface model, in the frame | 10 yd right of the frame (x − 10), as well as the tee shift's z − 50 | The frame's tee is the owner's back-tee pin, which sits on the wall's line; the tee the flyover shows is left of the wall. So the wall, path, shed and hotel stand from the game tee as they stand from the real one; the green, road and bunkers keep the frame |
| The sign | about 45 % of the shed's front, regular serif lettering | 14 of 25.5 yd, the letters thickened, unlit paint | It is the aiming point: readable from the tee on a phone |
| Building heights | DSM − DTM | × 1.161 (the hole's scale) | Proportions as the hole's |

Simplified: the hotel is eight boxes (its real outline is stepped and set back), the garden is shrubs and four oaks, and the hotel's far end, the Jigger Inn and the car park are left out.

**Realism bounds** (`node tests/tools/slope.js standrews-17`, `docs/maps/standrews-17-slope.png`): one gentle plane (the lidar's, 1.2 %), 100 % of the surface in the 1–2.5 % band, no steep ring and not a dome; "flat pockets" reads WARN. The green's contours are mild by §3's own account; the hole is decided by the bunker, the road and the wall, not by putting, so the green is left as it is.

## 6. Validation — the contract

| Shot | Expected |
|---|---|
Coordinates since 2026-10-21 (the tee 50 yd forward): the pin (24.5, 437.1), the second shot from (0, 301), where a pure drive stops.

| Shot | Expected |
|---|---|
| A pure drive runs out on the firm fairway | Fairway, a full iron left (125–150) |
| An iron flown at the pin, from (0, 301) | Runs through the green and off the back |
| Landed short of the tucked pin and run up, at (22, 422) | Holds the green, ≤ 10 yd |
| The attack over the bunker's edge (28, 426), pulled a little | The Road Hole bunker |
| Into an 18 mph headwind, an iron flown at the pin | Loses carry but lands steeper and still runs off the back |
| With an 18 mph tailwind, the attack | Barely flies further, lands flatter and softer, and still holds the green (≤ 10 yd) |
| A 3-wood flown over the road into the stone wall, (14, 460) | Is stopped by it |
| A wedge from the middle of the bunker at the pin | Cannot get out forwards |
| The safe line to the wide front, (10, 410) | Holds the green |
| Aimed over the sign on the shed at the pin, a pure drive (2026-10-23) | Carries the corner of the hotel's grounds and finds the fairway, a full iron left (125–150) |
| From the line down the right by the hotel, (−8, 245), a pushed drive (needle 0.45) | Out of bounds in the hotel's grounds |
| A low 3-wood at the pin (power 0.35) | Stopped by the shed's wall; drops out of bounds in front of it |

| Decision | Plans | Must hold |
|---|---|---|
| The drive (2026-10-23) | over the sign at the pin / down the right by the hotel, (−8, 245) / bail out left, (34, 245) | A sharp player stays in bounds on every line; down the right a shaky player is out of bounds at least one time in eight (19 %); over the sign keeps a shaky player in bounds; bailing out left costs a sharp player at least 0.2 stroke against the line over the sign (0.39) and buys a shaky player nothing (4.29 against 4.16). **What the baseline cannot see**: the right-hand line's reward is the angle into the green (along it, rather than across the Road Hole bunker), and the baseline prices distance and lie only, so down the right shows as the sharp player's equal (3.97 against 3.95) and the shaky player's worst plan. The checks assert the risk side only |
| The second shot | fly the tucked pin / attack it over the bunker's edge / play to the middle and run up | Flying it holds the green less than half the time for a sharp player (never: it runs off the back) and is the worst plan for both players; attacking puts even a sharp player in the bunker at least one time in five (4 in 21); the middle holds a sharp player four times in five (20 in 21), beats the attack, and keeps a shaky player out of the bunker twice as often (0 against 3). |

**Real downwind flight** (measured on the attack from (0, 301), the arc on (28, 426), OpenFairway's drag and lift, `windPush` 0.6): an 18 mph tailwind adds 0.5 yd of carry (128.1 → 128.6), the ball lands 7° flatter (42° → 35°) and a little faster, and runs 9.3 yd after landing against 17.1 in still air (which finishes on the fringe past the pin): Penner's bounce keeps more run from a steeper landing, so the downwind ball sits down. Flown at the pin the same holds: +1.4 yd of carry, 37° against 44°, 29 yd of run against 40. Into the wind the attack's arc loses 4.4 yd of carry and lands at 53°; flown at the pin it loses 6 yd (138 → 132) and, landing at 55°, runs further (47 yd against 40) and off the back. The old checks (tailwind flies the green; headwind comes up short) described main's flight, where wind moved carry 8–10 yd either way.

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
| **All shots and the strategy (2026-10-21, OpenFairway physics)** | the tee at the old origin; second shots from (1, 345); every target as above | the tee 50 yd forward (the sheds, their collider and the hotel moved with it, so the drive over the sheds is the same); every z 50 less; second shots from (0, 301) | Under OpenFairway's flight and bounce a pure drive stopped 197 yd from the pin (`firm` alone gained 7 yd). From the new tee it lands on the start of the lidar's fall toward the green and runs 54 yd to 138 out: a full iron again. The hole's base landform (`seed`, `roll`, `ridge`) is a function of absolute coordinates, so its small invented rolls under the moved ground are not the same ones; the lidar's ramps, the bunkers, road and wall moved exactly |
| `greens.firm` (play profile) | 1.3 | 3.5 | Irons now land at 42–49° and checked within 2–4 yd: flown at the pin one holed out, the run-up stopped 13 yd short. At 3.5 the flown iron runs 40 yd off the back again and the run-up finishes 0.8 yd from the pin (§5) |
| The attack line (shot, headwind/tailwind shots, strategy) | (27.5, 476.5), the bunker's edge with 4 sharp shots in 21 in the sand | (28, 426): the same edge, half a yard further onto it | At (27.5, 426) the tee move and the firmer green left 3 in 21 in the sand; (28, 426) gives 4 (and 28.5 gives 5), as the line was first chosen |
| Into an 18 mph headwind | the attack comes up short of the green (fringe, rough or sand, ≥ 10 yd from the pin) | an iron flown at the pin loses carry but lands steeper and still runs off the back (road or rough) | Real into-wind flight: the attack's arc lands 4.4 yd short, on the fringe, and the steep landing runs onto the green (6.0 yd). Penner's bounce keeps more run from a steeper landing, so the wind does not save the flown pin: it loses 6 yd of carry and runs off anyway (§6 above) |
| With an 18 mph tailwind | flies the green into the rough behind | barely flies further, lands flatter and softer, and still holds the green (≤ 10 yd) | Real downwind flight: +0.5 yd of carry, 7° flatter, half the run (§6 above). "Flies the green" was main's +8 yd |
| A 3-wood and the wall | landed on the road at (14, 446), strikes the wall | flown over the road at (14, 460), is stopped by the wall | A ball landed on the road now runs 9 yd and stops in the rough strip ~6 yd short of the wall. Flown at it, the wall stops 3-woods aimed from z 458 to 462 (and lets higher ones over) |
| The strategy's middle | "holds it 21 times in 21" (text only; the check was ≥ 17) | 20 in 21 | One sharp shot finishes on the fringe |
| `tests/holes.test.js` lieAdd and recovery tests, `tests/tools.test.js` probe test | from (1, 345), aim (27.5, 476.5), the bunker at (32.5, 474.5), lieAdd aim (8, 455) | from (0, 301), aim (28, 426), the bunker at (32.5, 424.5), aim (8, 405) | The tee move |
| **The real tee shot (2026-10-23)**: three drive shots and the drive strategy | (none) | added (above) | New checks for the new layout, written after it was built from the lidar (the layout was not tuned to them). Every existing check is unchanged and its numbers are identical to main's (§7) |
| `tests/ball.test.js` hand-over test | rest, water and leaving the hole | also: a ball at rest in an `ob` area goes to out of bounds | The new rule |

## 7. Results

**The real tee shot (2026-10-23)**: `node tests/hole-report.js origin/main --hole=standrews-17`, "before" = main at `b2cbef3`. The second shot is untouched (identical numbers); the drive is new.

```
=== St Andrews Old Course (standrews-17) — A long second into a narrow green on firm links turf, angled from front-right to back-left along the road: the deep Road Hole bunker eats into its left end (a ball in it cannot play out forwards), the Sunday pin is tucked behind it, and a hard road and a stone wall sit behind. Land it short and let it run; fly the pin and it runs off the back.
shot                                                                           before           after
a pure drive runs out on the firm fairway and leaves a full iron               FAIRWAY 138y     FAIRWAY 138y
aimed over the sign on the shed at the pin, a pure drive carries the corner o  ROUGH 186y       FAIRWAY 138y
from the line down the right by the hotel, a pushed drive finishes out of bou  ROUGH 221y       OOB 227y
a low 3-wood into the shed is stopped by its wall and drops out of bounds in   FAIRWAY 364y     OOB 388y
an iron flown at the pin runs through the green and off the back               ROUGH 40y        ROUGH 40y
landed short of the tucked pin and run up, an iron holds the green             GREENS 1y        GREENS 1y
the attack over the bunker's edge, pulled a little, drops into the Road Hole   SAND 16y         SAND 16y
into an 18 mph headwind, an iron flown at the pin loses carry but lands steep  ROUGH 41y        ROUGH 41y
with an 18 mph tailwind the attack barely flies further, lands flatter and so  GREENS 6y        GREENS 6y
a 3-wood flown over the road into the stone wall is stopped by it              ROUGH 25y        ROUGH 25y
from the middle of the bunker a wedge at the pin cannot get out forwards       SAND 14y         SAND 14y
the safe line to the wide front of the green holds it                          GREENS 26y       GREENS 26y

  strategy: the drive: over the sign at the pin, down the right by the hotel (the better angle in), or bail out left
  plan       skill   before: wet green score   after: wet green score
  sign       sharp           0%   0% 4.33              0%   0% 3.95
  sign       shaky           0%   0% 4.31              0%   0% 4.16
  right      sharp           0%   0% 4.03              0%   0% 3.97
  right      shaky           0%   0% 4.25             19%   0% 4.47
  left       sharp           0%   0% 4.33              0%   0% 4.34
  left       shaky           0%   0% 4.41              0%   0% 4.29

  strategy: the second shot: fly the tucked pin, attack it over the bunker's edge, or play to the middle and run up
  plan       skill   before: wet green score   after: wet green score
  fly        sharp           0%   0% 3.68              0%   0% 3.68
  fly        shaky           0%   0% 3.73              0%   0% 3.73
  attack     sharp           0%  52% 3.23              0%  52% 3.23
  attack     shaky           0%  48% 3.29              0%  48% 3.29
  middle     sharp           0%  95% 3.00              0%  95% 3.00
  middle     shaky           0%  52% 3.31              0%  52% 3.31

"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).
```

**Earlier** (2026-10-21, the OpenFairway redesign):

`node tests/hole-report.js --hole=standrews-17` after the OpenFairway redesign (2026-10-21: the tee 50 yd forward, `greens.firm` 3.5). "before" is the hole-report baseline (commit 548d49a with the signature stripped), not the branch before this change; that comparison is in §6's log and in PR #22.

```
=== St Andrews Old Course (standrews-17) — A long second into a narrow green on firm links turf, angled from front-right to back-left along the road: the deep Road Hole bunker eats into its left end (a ball in it cannot play out forwards), the Sunday pin is tucked behind it, and a hard road and a stone wall sit behind. Land it short and let it run; fly the pin and it runs off the back.
shot                                                                           before           after
a pure drive runs out on the firm fairway and leaves a full iron               FAIRWAY 183y     FAIRWAY 138y
an iron flown at the pin runs through the green and off the back               GREENS 0y        ROUGH 40y
landed short of the tucked pin and run up, an iron holds the green             GREENS 15y       GREENS 1y
the attack over the bunker's edge, pulled a little, drops into the Road Hole   ROUGH 18y        SAND 16y
into an 18 mph headwind, an iron flown at the pin loses carry but lands steep  GREENS 10y       ROUGH 41y
with an 18 mph tailwind the attack barely flies further, lands flatter and so  GREENS 11y       GREENS 6y
a 3-wood flown over the road into the stone wall is stopped by it              ROUGH 26y        ROUGH 25y
from the middle of the bunker a wedge at the pin cannot get out forwards       GREENS 0y        SAND 14y
the safe line to the wide front of the green holds it                          FRINGE 29y       GREENS 26y

  strategy: the second shot: fly the tucked pin, attack it over the bunker's edge, or play to the middle and run up
  plan       skill   before: wet green score   after: wet green score
  fly        sharp           0% 100% 2.27              0%   0% 3.68
  fly        shaky           0%  76% 2.80              0%   0% 3.73
  attack     sharp           0%  62% 3.16              0%  52% 3.23
  attack     shaky           0%  52% 3.32              0%  48% 3.29
  middle     sharp           0%  86% 3.23              0%  95% 3.00
  middle     shaky           0%  43% 3.43              0%  52% 3.31

"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).
```

## 8. Review — does it look like the hole?

**The tee shot, rebuilt (2026-10-23).** The owner found the tee shot "ridiculous" against photos of the real one: a fold of sheds next to the tee, the hotel 60 yd off to the right, no wall, no path. Laid over the lidar's rooftops, the reason was plain: the fairway ran straight through where the real hotel stands, so the buildings had been pushed out of its way. Now the wall, path, shed and hotel stand where the lidar has them (10 yd right of the frame, §5), the fairway runs beyond the shed and left of the hotel as the real one does, and the hotel's grounds are out of bounds.

**References used**: the owner's screen recording of St Andrews Links' own drone flyover of the 17th (a Facebook reel, not in the repo): the tee and the view from it, the shed's black boards, grey roof and sign, the stone wall, the path, the netting and the hotel. The Scottish Public Sector LiDAR Phase 5 50 cm **DSM** (surface model, rooftops) with the DTM, tiles NO41NE and NO51NW (Open Government Licence v3; not in the repo): footprints and heights (DSM − DTM) of the shed, the hotel, the wall, the trees. `docs/holes/trace/standrews-17.json` `landmarks` records what was read.

**What changed**

| Item | Was | Now |
|---|---|---|
| Sheds | a fold of dark sheds 19–31 yd ahead, by eye, a dead wall on their front line | the real shed in the corner of the hotel's grounds: three black barns (front 25.5 × 12 yd, eaves 5.3 yd, ridge +2.2), ~53–91 yd out, straight down the line to the pin; its painted sign faces the tee |
| Hotel | one 150 × 30 yd stone block, 21 yd high, 82 yd right of the line | eight sandstone blocks from beside the tee (z 6) to z 255, 8.7–19.7 yd to the eaves, hipped and mansard slate roofs, balconies, solid |
| Wall and path | none at the tee | a 1.2 yd stone wall and a gravel path from beside the tee to the corner (22, 98), then down the right of the hole |
| Out of bounds | only off the end of the modelled area | the hotel's grounds (`ob`): a ball at rest there is out, +1, replay |
| Fairway | straight down the line from z 35 (through the real hotel's footprint) | from z 120, beyond the corner, bending right along the grounds 3+ yd off the path; unchanged from z 300 to the green |

**Renders**: `docs/maps/standrews-17-tee.png` (the new tee view), `docs/maps/standrews-17.png` (the map, out of bounds tinted red).

**Verdict** (this pass)
- Tee and direction: **matches** (the flyover: the tee left of the wall, the shed straight ahead).
- **The view from the tee**: **close** — the shed, its sign, the wall and path, the hotel looming right and the town beyond are all there and in their real places; the hotel is boxes (no bays, towers or the glazed spa).
- Heights: **matches** (lidar); buildings: **matches** for footprint and height (DSM).
- Green: **close** (unchanged: an ellipse on the lidar's plateau).
- Bunkers: unchanged.
- Water and surroundings: **close** — the Jigger Inn and the car park by the road are still missing.

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

**Open items** (as of 2026-10-23)
1. An aerial of the green: trace its outline (the real green wraps round the bunker).
2. A revetted-face primitive, so the Road Hole bunker can take its real depth.
3. The hotel's detail (bays, the glazed spa, its stepped outline), the Jigger Inn and the car park, for the approach view.
4. The baseline cannot price the angle into the green, so the right-hand drive's reward is unmeasured (§6).

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

**Visual pass (2026-10-21, PR #13).** The hole was the first one dressed with the look layer (`docs/ICONIC-HOLES.md` §1.5): a run of dark timber sheds across the right of the drive that folds in toward the line and out again (`props` sheds on `[[-3,31],[-15,22],[-31,28],[-52,19]]`, 7 yd high, with a dead `wall` collider on the same line: a drive aimed at (-30, 240) clears them, one aimed at (-40, 240) hits and drops back about 20 yd), the hotel as a 150 yd stone block down the right (`building`, replacing the red-roofed clubhouse), a stone-town skyline with spires, the links theme (dry turf, gold fescue, warm sky), the Road Hole bunker and the two short-left bunkers drawn with revetted stacked-turf faces, and a rubble-stone wall. Verdicts that change: *Landmarks a player would name* → **close** (sheds and hotel are there and the sheds play; sizes are by eye, not measured); *Tee and line* → **close** for the look, the drive is still not blind and there is still no OB along the hotel.

**Tee move (2026-10-21, OpenFairway physics).** The tee went 50 yd forward along the hole and the sheds, their collider and the hotel went with it, so the drive over the corner of the sheds is the same picture; the green is 50 yd nearer (438). `docs/maps/standrews-17-tee.png` is the new tee view. The lidar frame in `docs/holes/trace/standrews-17.json` is unchanged and its `tee_shift` says to subtract 50 from z in `lidar.py` output. Verdict lines unchanged; *Tee and direction* is still **matches** for the line, but the yardage now **differs on purpose** (§5).

**Open items**, most important first:
1. The blind drive and OB along the hotel: the sheds now block a low or wide drive, but the target is visible and there is no out of bounds (needs a blind-shot primitive and side OB).
2. Trace the green and the Road Hole Bunker from an aerial.
3. Measure the sheds' and the hotel's size and place from a photo (they are by eye).
