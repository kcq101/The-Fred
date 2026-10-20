# Iconic hole spec: St Andrews Old Course No. 17 (the Road Hole)

## 1. Inspiration

| | |
|---|---|
| Real hole | St Andrews Old Course, hole 17, the Road Hole |
| Par / yardage (real) | Par 4, about 495 yards (lengthened for recent Opens) |
| Par / yardage (game) | Par 4, 470 yards tee → pin. A pure driver leaves about 138 yards on the firm fairway; reaching in two takes a driver and a long second. |
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
| Road Hole Bunker | bunker | `depth:2.8, lip:0.9`, front-left, overlapping the green edge | Very deep; escapes sideways but not forwards |
| The road | **new** `ROAD` surface via a `cover` band | around the right and back of the green, `w:3.4`, `over:['ROUGH','FAIRWAY']` | Hard and fast: balls skip and roll out |
| The wall | **new** `wall` obstacle (generic `OBSTACLES` registry) | behind the road, `t:1.2, h:2.2, e:0.3` | Stops balls in flight and on the roll; kicks them back |
| Firm links turf and wind | play profile | `firm:1.5, wind:[8,20], windPush:1.6, greens:{speed:1.15, firm:1.3}` | Run-out everywhere |
| Fairway pot bunkers | bunkers | two small, at (20,300) and (-14,318) | Positional |
| Dunes | `theme:'links'` backdrop | | Golden dunes behind |

**Capability gaps**: the blind drive over the hotel/sheds corner and the out-of-bounds line along the hotel are not expressed. The game has no blind shots and no OB along a side, so the drive is a plain fairway shot.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 495 yd | 470 yd | A pure driver plus a full iron is just reachable with a long second |
| Firmness | firm | `firm:1.5`, greens firm 1.3 | The run-out is the point: a flown pin ball runs through to the road |
| Road Hole Bunker depth | very deep | depth 2.8, lip 0.9 | Deep enough that the forward escape fails; 3.4/1.1 was an inescapable bowl (a soft lock) so it was backed off |
| Road | tarmac | ROAD: e .36, mu .16, dec 5.0 | A wedge rolls ~6 yd, an iron ~17 on it (fairway: 3 and 7) |
| Wall | stone, ~1.5 m | height 2.2 yd, restitution 0.3 | Reads as solid; makes the back of the green a real penalty |

Simplified: the hotel, the sheds and the out-of-bounds line are left out.

**Realism bounds** (`node tests/tools/slope.js standrews-17`, `docs/maps/standrews-17-slope.png`): one gentle plane (`tilt` 2.3 %), 100 % of the surface in the 1–2.5 % band, no steep ring and not a dome; "flat pockets" reads WARN. The green's contours are mild by §3's own account; the hole is decided by the bunker, the road and the wall, not by putting, so the green is left as it is.

## 6. Validation — the contract

| Shot | Expected |
|---|---|
| A pure drive runs out on the firm fairway | Fairway, a full iron left |
| An iron flown right at the pin | Runs through onto the ROAD |
| Carrying the bunker and landing just over | Holds the green or its edge |
| The same shot pulled a little | The Road Hole bunker |
| Into an 18 mph headwind, the same carry | Falls short, into the bunker |
| With an 18 mph tailwind | Flies the green into the rough behind |
| A 3-wood run into the back | Strikes the stone wall and kicks back |
| A wedge from the middle of the bunker at the pin | Cannot get out forwards |
| The safe line to the wide front | Holds the green |

| Decision | Plans | Must hold |
|---|---|---|
| The second shot | fly the pin / attack the tucked pin / play to the middle | Flying it is the worst plan for sharp and shaky players (it puts a sharp player on the road 15 times in 21); attacking puts even a sharp player in the bunker at least one time in five; the middle is the best plan for a sharp player (81 % on the green) and keeps a shaky player out of the bunker twice as often as attacking. No per-hole lie costs: the baseline's recovery term charges a ball in the Road Hole bunker for its face. |

**Honest note**: this hole's geometry was tuned with scratch probes before its checks were written, contrary to the workflow. The checks were then written against the tuned hole and pass. Holes 5 and 6 had their checks written first.

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| The second shot (strategy) | `lieAdd: { SAND: 1.0 }`: any sand lie costs a full stroke | no `lieAdd` | The baseline gained a recovery-difficulty term that charges a ball short of a steep face. In the Road Hole bunker (the ground rises 4.1 yd between the ball and the pin line, so the raw charge is 1.10) it reaches its 1.0 cap on top of sand's 0.35, so the bunker now costs 1.35 where the hack gave 1.0. Every expectation holds without the override. The four plans that end in sand or at the foot of the bank score 0.06–0.10 more than before (fly shaky 3.62 → 3.71, attack sharp 3.25 → 3.33, attack shaky 3.45 → 3.56, middle shaky 3.47 → 3.53); fly and middle for a sharp player are unchanged. The order is the same for a sharp player (middle < attack < fly in strokes); for a shaky player attack and middle swap by 0.03 (attack 3.45 vs middle 3.47 before, middle 3.53 vs attack 3.56 now): the middle is the better plan for both, and fly is still the worst |

## 7. Results

```
=== St Andrews Old Course (standrews-17) — A long second into a narrow green on firm links turf: the deep Road Hole bunker eats into the front-left (a ball in it cannot play out forwards) and a hard road and a stone wall sit behind. Land it short and let it run; fly the pin and the road has it.
shot                                                                           before           after
a pure drive runs out on the firm fairway and leaves a full iron               FAIRWAY 181y     FAIRWAY 138y
an iron flown right at the pin runs through the green onto the road            GREENS 0y        ROAD 11y
carrying the bunker and landing just over it holds the green                   GREENS 1y        FRINGE 8y
the same shot pulled a little drops into the Road Hole bunker                  ROUGH 11y        SAND 12y
into an 18 mph headwind the same carry falls short, into the bunker            GREENS 6y        SAND 13y
with an 18 mph tailwind it flies the green into the rough behind               GREENS 5y        ROUGH 16y
a 3-wood run into the back of the green strikes the stone wall and kicks back  ROUGH 13y        ROAD 15y
from the middle of the bunker a wedge at the pin cannot get out forwards       GREENS 0y        SAND 13y
the safe line to the wide front of the green holds it                          GREENS 11y       GREENS 10y

  strategy: the second shot: fly the pin, attack the tucked pin over the bunker, or play to the middle
  plan       skill   before: wet green score   after: wet green score
  fly        sharp           0% 100% 2.63              0%   0% 3.52
  fly        shaky           0%  76% 2.89              0%  14% 3.71
  attack     sharp           0%  90% 2.45              0%  24% 3.33
  attack     shaky           0%  57% 3.00              0%  29% 3.56
  middle     sharp           0%  81% 3.12              0%  81% 3.11
  middle     shaky           0%  24% 3.36              0%  33% 3.53
```

"Before" is the same land and green with no features, play profile, wall, road or bunkers. Expected strokes ("score") come from the baseline in `tests/hole-play.js`, including its recovery-difficulty term (see `docs/ICONIC-HOLES.md`), so they differ slightly from earlier pastes of this table.

## 8. Visual review — does it look like the hole?

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
