# Iconic hole spec: Oakmont Country Club No. 3

## 0. References

| Reference | Required? | Have it? | Source / note (never commit photos or lidar tiles) |
|---|---|---|---|
| Map pin on the green (lat, lon) | yes | yes | the project owner, 2026-10-23: 40.531671, -79.817549 (and the tee: 40.528317, -79.816369) |
| Lidar tile | yes | yes | USGS 3DEP 1 m DEM, PA_WesternPA_2019_D20, tiles x59y449 and x60y449 (flown 2019: before Hanse's 2023-24 restoration) |
| Aerial of the green complex | yes, for green and bunker edges | no | the green is the lidar's flat top round the pin (§4); the bunkers are the lidar's hollows |
| The hole's direction | one of them | yes | the owner's two pins: tee → green 385.5 m at 344.2° |
| Backdrop photos | optional | no | the owner sent a video link (not reachable from the sandbox); screenshots of the tee shot asked for |
| Low-sun or rain photo of the green | optional | no | |

## 1. Inspiration

| | |
|---|---|
| Real hole | Oakmont Country Club (Oakmont / Plum, Pennsylvania), No. 3, the Church Pews hole |
| Par / yardage (real) | Par 4. 425 yd (1973), 426 yd (2007), 428 yd (2016), 462 yd (2025, a new back tee behind the 2nd green). The owner's pins measure 422 yd tee → green |
| **Matches the request?** | Yes: asked for a par 4; every source has a par 4 |
| Par / yardage (game) | Par 4, **397 yd** tee → pin: real scale (1 m = 1.0936 yd), the game tee 25 yd up the line from the owner's tee pin, on a forward tee the lidar shows as a level pad, so a pure driver (245 carry) lands beside the Pews and a full iron is left |
| Sources | [NBC Sports hole by hole (2025)](https://www.nbcsports.com/golf/news/u-s-open-2025-hole-by-hole-look-at-oakmont-country-club), [Pittsburgh Post-Gazette course guide (2025)](https://newsinteractive.post-gazette.com/2025-us-open-oakmont-country-club/course.php), [Golf.com: the Church Pew bunker explained](https://golf.com/news/oakmont-church-pew-bunker-explained/?amp=1), [Golf Digest: the Church Pew bunkers](https://www.golfdigest.com/story/oakmont-country-club-church-pew-bunkers), [GolfWRX: the redesigned holes for 2025](https://golfwrx.com/761364/the-redesigned-holes-at-oakmont-that-are-new-for-the-2025-u-s-open/), [Tribune-Review hole by hole (No. 3, No. 4)](https://triblive.com/sports/u-s-open-hole-by-hole-birdie-opportunity-within-reach-on-no-4-at-oakmont), [Fox Sports hole by hole (2016)](https://www.foxnews.com/sports/us-open-hole-by-hole), [Wikipedia](https://en.wikipedia.org/wiki/Oakmont_Country_Club) |

## 2. What makes it iconic

- **Signature features**: the Church Pews, a bunker about 100 yd long and 40 wide crossed by grass ridges (12 in the 2019 lidar; Hanse added a 13th and 15 yd for 2025), between the 3rd and 4th fairways; five deep bunkers on the right of the landing zone; a blind, uphill short iron to a tabletop green.
- **The strategic problem in one sentence**: the drive has to find a narrow valley between the Pews and the right-hand bunkers, and the approach has to be exactly right up the hill, because short rolls 20-30 yd back down it and long runs off the back.
- **Where scores are made and lost**: a hooked drive in the Pews (often more than one shot to get out) or a pushed one in the bunkers; then an approach short of the tabletop.

## 3. Analysis

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Distance control / run-out | Yes | Approach | Short rolls back down the hill; long runs off the back |
| Forced carry | No | | |
| Dogleg / corner to cut | No | | |
| Elevation change | Yes | Both | The drive falls 5.6 yd into the valley; the approach climbs 8 yd to the green |
| Sloping lies | Mild | Approach | An uphill lie in the valley (plays short) |
| Narrow landing zone | **Yes (primary)** | Drive | 30-35 yd between the Pews and the five bunkers where a driver lands |
| Deep or pot bunkers | Yes | Drive | The Pews; five deep bunkers right (0.6-1.0 m) |
| Green contours | Mild | Approach | A tabletop, gently away from the fairway ("relatively flat by Oakmont standards") |
| Penal surrounds | Yes | Approach | The run-off in front, the falls left and behind |
| Wind exposure | No | | |
| Risk/reward split | Yes | Drive | Driver into the neck, or a 3-wood or iron short of it and a longer approach up the hill |
| Firm/fast turf | Yes | Approach | Close-cut, fast: `play.hold` (§4) |

## 4. Translation

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| The line | the owner's tee and green pins | +z at 344.2°, real scale, the game tee 25 yd up the line | The drive runs along the Pews' inner edge |
| Heights along the line | `ramp`s from `lidar.py build` | down 5.6 yd to the valley at z 140-190, up 8 yd to the green, a dip short of it, the fall behind | A downhill drive, an uphill blind approach |
| Heights across the hole | **new, generic: `grid`** (`lidar.py build --grid 10`): the lidar's ground relative to the line, every 10 yd, read with a smooth curve | 23 × 59 heights | The hill and the green fall away 10-12 % to the left, the plateau sits higher on the right, a bank and a swale down the far right |
| The Church Pews | 13 bunkers (the sand between the ridges: the lidar's bunker outline cut along the pews' crests) and a `rise` along each of the 12 crests | troughs 0.6 deep, lip 0.2; ridges +0.3, 1.4 yd above the sand, 7-8 yd apart, angled across the bunker as the lidar has them | A hook ends in a trough. At the foot of a pew there is no shot forwards; from the middle of a trough a wedge gets out; sideways along the trough always does |
| Five bunkers right | bunkers, outlines and depths from the lidar | 0.69-1.08 deep, 15-40 yd right of the line from z 204 to 288 | A push ends in one |
| The green | the lidar's flat top round the pin (within 0.45 m of it, under 5 %), corners rounded; `tilt` the lidar's plane | 34 × 30 yd; down 1 % away from the fairway, up 1.2 % to the left | A big, mild tabletop |
| The run-off in front | the lidar's 9-14 % front slope (fairway), and **new, generic: `play.hold`** 0.45 | short grass holds a stopped ball on a slope only to 45 % of its usual grade | A ball landed 20 yd short rolls back down the hill to 40+ yd away |
| Closely mown behind the green | `cover` FAIRWAY | | Long runs away |
| Greenside bunkers | four from the lidar: three in a row short-right, one short-left | 0.42-0.51 deep | |
| The 4th hole | its fairway beyond the Pews (`cover` FAIRWAY) and its seven bunkers from the lidar | | A hook over the Pews finds the 4th fairway, as in the real hole |

**The look** (step 6b; no photo of the tee shot yet):

| From the tee / the approach, a player would name… | Look expression | Does it touch the ball? |
|---|---|---|
| The Church Pews, left of the landing zone | the troughs and ridges above (the bunker meshes draw each trough with flashed faces) | yes |
| The five bunkers right, then the hill up to a green you cannot see | lidar bunkers and heights | yes |
| Open ground, few trees (Oakmont took out thousands) | oaks and pines only at the edges, which also hide where the modelled land ends | no |

**Capability gaps**: none for play. Look: a photo of the tee shot (asked for), the turnpike, the clubhouse and the grandstands; the far ground beyond the modelled area shows as a pale band low on the left from the tee (the land falls away there, below the hole's edge).

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 422 yd (the owner's pins), 428 on the 2016 card | 397 yd (the tee 25 yd up the line) | Under OpenFairway's flight a pure driver totals about 258 here; at 422 it would leave 165 yd uphill, out of iron range |
| Hold on short grass | a ball short of the green rolls 20-30 yd back down a 9-14 % slope | `play.hold` 0.45 (fairway and fringe hold to 10 % instead of 22 %) | The game's default hold keeps a ball on any fairway slope under 22 %, so the run-off did nothing; the slope itself is the lidar's |
| Pews | ridges about 1 m above the sand (lidar 1.0-1.4 m, smoothed) | 1.4 yd | Within the lidar's range; the troughs follow its crests |
| Everything else | lidar | lidar | |

**Realism bounds** (`node tests/tools/slope.js oakmont-3`):

| Bound | Default | This hole | Note |
|---|---|---|---|
| Falloff ring: surface steeper than 4 % | ≤ ~35 % | 0 % | |
| Top: 1–2.5 % of the non-steep surface | mostly | 100 % | |
| Flat pockets: surface under 1 % | 5–40 % | 0 % | **WARN**: the green is one plane (the lidar's, 1.5 %), and the 1 m lidar resolves a plane, not break. The sources call it relatively flat by Oakmont standards; the hole is decided by the drive and the run-off, not by putting |
| No full-green dome | | not a dome (0 % steeper than 2.5 %) | |

## 6. Validation

**Shots**

| Shot | Expected |
|---|---|
| A pure drive at the pin | Fairway beside the Pews, 125-150 yd left (139) |
| Hooked (needle −0.5) | The Church Pews |
| Pushed (needle +0.5) | The five bunkers on the right |
| From the fairway (0, 258), a pure iron | Holds the green within 8 yd |
| The same iron 20 yd short (power 0.8) | Rolls back down the hill: fairway, 35+ yd from the pin (42) |
| A 3-wood approach (power 0.85) | Flies the green and runs off the back, 25+ yd (40) |
| From the 3-wood's landing (0, 230), a full iron | Comes up short and rolls back down: fairway, 35+ yd (41) |
| At the foot of a pew (24, 220), a wedge at the green | Cannot get out forwards |
| The same ball played sideways along the trough | Reaches the fairway |

**Strategies** (from `hole-report.js`; "sand" counts balls of 21 that finish in a bunker: the baseline charges sand as a lie, not a hazard)

| Decision | Plans | Must hold |
|---|---|---|
| The tee club | driver at the pin / 3-wood / iron | A sharp driver stays out of the sand and leaves the shortest approach (141 against 170 and 228 yd); a shaky driver finds sand at least one time in five (7 of 21: the Pews or the five bunkers); the iron keeps a shaky player out of the sand but leaves 80+ yd more; for a sharp player the driver is the best plan (3.95 against 4.06 and 4.33). **What the baseline shows for a shaky player**: the driver is still the best plan (4.16 against 4.21 and 4.42): it charges a sand lie 0.35 and the troughs' faces a little, but not a ball that takes two to get out of the Pews. The checks assert the sand rates, not a shaky player's best club |
| The approach | at the pin / 8 yd past it | A sharp player holds the green from either line at least 70 % of the time (21 of 21 both); a shaky player at the pin finishes further away than a sharp one (9.4 against 2.3 yd: some roll back off the front). The baseline prices the green by distance only, so "past" never pays here; the line is kept to show the run-off |

**Check-change log**: none (the checks were written before tuning; the only tuning after them was the run-off's `hold`, which the run-off check needed and §5 records, and softer pews, 0.45 → 0.3 rise and 0.7 → 0.6 deep, closer to the lidar).

## 7. Results

`node tests/tools/validate.js oakmont-3` (11 of 11). The "before" column is the hole-report baseline: the same land with its signature stripped.

```
shot                                                                           before           after
a pure drive lands beside the Pews and finishes in the fairway, a full iron l  FAIRWAY 142y     FAIRWAY 139y
a hooked drive finds the Church Pews                                           ROUGH 183y       SAND 179y
a pushed drive finds the five bunkers on the right                             ROUGH 183y       SAND 176y
from the fairway a pure iron up the hill holds the tabletop green              GREENS 0y        GREENS 0y
an iron 20 yd short lands on the run-off and rolls back down the hill          GREENS 10y       FAIRWAY 42y
a 3-wood approach flies the tabletop and runs away off the back                ROUGH 52y        ROUGH 40y
from the 3-wood's landing, a full iron comes up short and rolls back down      GREENS 8y        FAIRWAY 41y
at the foot of a pew a wedge at the green cannot get out forwards              FAIRWAY 104y     SAND 179y
played out sideways, along the trough, the same ball reaches the fairway       FAIRWAY 170y     FAIRWAY 186y

  strategy: the tee club              before: wet green score   after: wet green score
  driver     sharp                            0%   0% 3.96              0%   0% 3.95
  driver     shaky                            0%   0% 4.12              0%   0% 4.16
  3-wood     sharp                            0%   0% 4.09              0%   0% 4.06
  3-wood     shaky                            0%   0% 4.21              0%   0% 4.21
  iron       sharp                            0%   0% 4.38              0%   0% 4.33
  iron       shaky                            0%   0% 4.45              0%   0% 4.42
```

The ball-physics guards (`tests/ball.test.js`, 600 random shots): highest hop on dry ground 2.47 yd (limit 3.5), slowest settle 15.3 s (the failing budget test's worst is still Augusta 13's 17.7 s). One drive played headless in the real game: flight → settle → aim, at rest on the fairway 140 yd out.

## 8. Review — does it look like the hole?

**References used**: the owner's two map pins; the 2019 USGS lidar (two 1 m tiles, not in the repo). No photo yet: the tee video could not be opened here.

**What changed**: a new hole. Everything on the ground is the lidar's: the line (the pins), the heights along it and across it (the grid), the Pews (bunker outline and 12 crests), the five bunkers, the greenside bunkers, the green's flat top and plane, the 4th hole's bunkers.

**Renders**: `docs/maps/oakmont-3-tee.png`, `-bird.png`, `-approach.png`, `-aerial.png`; the map `docs/maps/oakmont-3.png`.

**Verdict**
- Tee and direction: **matches** (the owner's pins).
- The view from the tee: **close**: the Pews left of the landing zone, the bunkers right, the valley and the hill; no photo to compare yet.
- Heights: **matches** (lidar, along and across).
- Green: **close**: the lidar's flat top, no aerial for its edge.
- Bunkers: **matches** for place and depth (lidar 2019); the 2025 changes (13th pew, the right-hand bunkers moved left) **differ**: not in the lidar.
- Water and surroundings: no water; the turnpike, clubhouse and grandstands are not modelled.

**Open items**, most important first:
1. A screenshot of the real tee shot, to check the view and dress it.
2. An aerial of the green, to trace its edge.
3. The far ground beyond the modelled area reads as a pale band low on the left from the tee.
