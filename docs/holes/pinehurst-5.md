# Iconic hole spec: Pinehurst No. 2, No. 5

## 1. Inspiration

| | |
|---|---|
| Real hole | Pinehurst No. 2, hole 5 |
| Par / yardage (real) | Par 5, 576 yards (Golf Today) to 588 yards (AP, 2024 U.S. Open). It played as a long par 4 in the 1999 and 2005 Opens and has been a par 5 since 2014. |
| Par / yardage (game) | Par 5, 504 yards tee → pin. A good drive leaves about 220; a 3-wood, run up the front, reaches. Otherwise lay up to about 65 yards. |
| Sources | See below |

- [Golf Today — 5th hole, 576 yards, par 5](https://golftoday.co.uk/?p=231000)
- [Spectrum News / AP — A hole-by-hole description of Pinehurst No. 2](https://spectrumlocalnews.com/nc/charlotte/sports/2024/06/11/us-open--24--a-hole-by-hole-description-of-pinehurst-no--2)
- [Pinehurst — The No. 2 restoration, a hole-by-hole tour](https://www.pinehurst.com/news/the-pinehurst-no-2-restoration-a-hole-by-hole-tour/)
- [GolfPass — 2024 U.S. Open course preview: Pinehurst No. 2](https://www.golfpass.com/travel-advisor/articles/2024-u-s-open-golf-course-preview-pinehurst-no-2)
- [golf.com — 6 key U.S. Open holes at Pinehurst](https://golf.com/travel/6-key-us-open-holes-pinehurst/?amp=1)
- Kevin's green-reading map of the putting surface (slope shading with contours): a broad top with several nearly flat pockets and gentle movement between them, ringed by steep falloffs only at the edges.

## 2. What makes it iconic

- **Signature features**: a long hole that rises and turns left at the end, a slanted fairway that leaves a sidehill lie for the second shot, wiregrass and sand on both sides, and an elevated green set diagonally (front-right to back-left) whose top is gentle but whose edges fall away steeply onto short, firm runoffs. Long and left leaves a pitch from well below the green; right, the green falls away from you.
- **The strategic problem in one sentence**: going for the green in two means a long club from a sidehill lie at a raised green whose edges throw back anything that isn't solid, so most players lay up to wedge distance and attack the top from there.
- **Where scores are made and lost**: the second shot (go or lay up) and the approach to the plateau. A ball that runs off an edge leaves a hard recovery up the falloff.

## 3. Analysis — the challenge archetypes

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Risk/reward split | Yes (primary) | Second shot | Go for it with a 3-wood or lay up |
| Green contours | Yes | Approach | A plateau with steep falloffs at its edges; gentle inside |
| Sloping lies | Yes | Second shot | The fairway slants: ball below the feet, the shot leaks right |
| Penal surrounds | Yes | Approach | Short runoffs off the falloffs, then wiregrass waste |
| Dogleg | Yes | Second shot | Turns left at the end |
| Elevation change | Mild | Approach | The green sits above the fairway |
| Narrow landing zone | Mild | Drive | Waste on both sides |
| Firm turf | Yes | All | Firm fairways and runoffs |

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | What it does to play |
|---|---|---|
| Elevated plateau green with steep edges | `hollow` with negative `depth` and the new `flat` option: the top stays nearly level over most of the green and the drop happens in a ring at the edges | A ball that stays on the top holds; one that reaches an edge runs off |
| Internal movement on the green | two small `hollow` swales and one low bump inside the plateau | Gentle breaks between flatter pockets, like the map |
| Green on a diagonal | green ellipse rotated so its long axis runs front-right → back-left | The approach from the right plays to a shallow target |
| Raised green | the DEM's rise along the line (about 5 yd over the last 100 yd) under the plateau `hollow`; the old 1.2 yd `rise` removed (it stacked on the DEM's) | Long-left leaves a pitch from below; right falls away |
| Short, firm runoffs | `cover` FAIRWAY ring around the green, then WASTE beyond | Balls run off the edges and keep going |
| Wiregrass and sand | `WASTE` bands along both sides of the fairway | A poor lie, not a lost ball |
| Slanted fairway | `tilt` over the second-shot landing zone, falling to the left (2003 DEM) | Ball above the feet: StanceModel hooks the second shot left |
| Rolls, dips, then rises and turns left | thirteen `ramp`s from the 2003 NC DEM (`lidar.py build`): ±1 yd of roll, a 3.5 yd dip at 250–360, then 5 yd up to the green; route bends left | |

**Capability gap closed**: a crown with a level top was not expressible (a negative `hollow` is a dome, steepest halfway out). `hollow` gains an optional `flat` (0–1): the share of the area's radius that stays at full depth before the falloff starts. Default 0 keeps every existing hole identical.

**Not expressed**: the green's true outline (the game's greens are ellipses), and the many small pockets of the real green (three features approximate them).

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 576–588 yd | 504 yd | Reachable in two with a good drive and a 3-wood run up the front, which is the real hole's question for tour players |
| Plateau | steep at the edges, gentle inside | `hollow` depth −0.75, `flat:0.62` over an 18.5 × 13 yd area, on the DEM's rise (the 1.2 yd `rise` was removed, 2026-10-20); the green is 30 × 20 yd | On the slope map (`node tests/tools/slope.js pinehurst-5` → `docs/maps/pinehurst-5-slope.png`, same colour bands as Kevin's map): 34% of the surface steeper than 4% (the edge ring), 14% at 2.5–4%, 43% at 1–2.5%, 10% under 1% |
| Movement on top | several flat pockets with gentle slopes between | green `tilt` about 1.3% plus a low crown (−0.07) and three soft pockets (0.06–0.07) | Earlier tries: small 0.1–0.12 pockets made steep rings inside the green; a dead-flat top (no tilt) read as a table |
| Fairway slant | falls 4–6 % to the left (2003 DEM) | `tilt` grade −0.10 over the second-shot zone | Doubled so the lie, not the DEM's downhill run along the line, decides the stance at (−8, 288) (at −0.08 the stance read DOWNHILL). A full 3-wood at the pin finishes 17 yd away; aimed right of the pin, on the green |

**What changed from the first version**: the first build was a par 4 with a dome (`hollow` depth −2.8, no flat top) that Kevin rightly called a turtle shell: the whole green sloped, steepest halfway out. The plateau keeps the shedding at the edges and lets the top putt like a real green.

**Realism bounds** (`node tests/tools/slope.js pinehurst-5`): the green these bounds were written from, and the only one so far inside all four.

| Bound | Default | This hole | Note |
|---|---|---|---|
| Falloff ring: surface steeper than 4 % | ≤ ~35 % | 34 % | The edge ring, just inside the bound |
| Top: 1–2.5 % of the non-steep surface | mostly (≥ half) | 64 % | |
| Flat pockets: surface under 1 % | 5–40 % | 10 % | Three soft pockets, as the real green has |
| No full-green dome | not (> 60 % steeper than 2.5 % *and* slopes every which way) | 48 % steeper than 2.5 %; tilt coherence 0.51 | The first build (`hollow` depth −2.8, no `flat`) reads 100 % over 4 % and coherence 0.03: flagged on all four bounds, which is what `tests/tools.test.js` asserts |

## 6. Validation — the contract

| Shot | Expected |
|---|---|
| A good drive | Fairway |
| A pushed drive | Waste |
| The second shot sits on a sidehill lie | Stance: ball above the feet |
| A full 3-wood aimed straight at the pin from the slanted fairway | Hooked left by the lie: 10+ yd from the pin |
| The same 3-wood aimed right of the pin, at (25, 505), allowing for the slant | On the green, ≤ 8 yd |
| A lay-up with an iron | Fairway, wedge distance left |
| A well-struck wedge at the pin from the lay-up | Holds the plateau, close |
| A wedge aimed at the green's edge | Runs off the falloff |
| From the low runoff left of the green, a wedge back up | Gets back onto or near the green |

| Decision | Plans | Must hold |
|---|---|---|
| Second shot | go for it with a 3-wood aimed at (25,505), right of the pin, to allow for the slant / lay up with an iron aimed at (13,432) | A sharp player holds the green ≥ 50% going for it, a shaky one ≤ 35%; going for it saves a sharp player ≥ 0.5 strokes; a shaky player gains under three quarters as much |

**Contract revised after the first tuning run**: I first wrote "the 3-wood aimed at the pin misses the green" and "laying up is right for a shaky player". The first is false on this green: the push leaves the ball on the front-right lobe 11 yd away, so the check now asserts the distance instead. The second the tour-style baseline does not support: it scores a shaky player going for it at 3.36 against 3.75 laying up, because it treats a 20-yard recovery from beside the green as easy. The contract asserts what is true: the payoff shrinks from 0.84 to 0.39 strokes and the shaky player holds the green 5 times in 21.

**Re-measured with the recovery term** (the baseline's new charge for a ball with a steep face to climb or a short-sided pin): going for it is 3.42 against 3.75 laying up for a shaky player, so the baseline still favours going, only a little less (0.33 strokes instead of 0.39; 0.84 for a sharp player, unchanged). The term does not flip it because the shaky balls that miss finish in the waste about 33 yd from the pin, with no face to climb within its 10 yd window. No check changed; the contract still asserts the rates and the gap, not that laying up is right.

**Check-change log** (2026-10-20, heights and slant from the 2003 NC DEM)

| Check | Was | Now | Why |
|---|---|---|---|
| The second shot's stance | ball below the feet (slices) | ball above the feet (hooks) | The DEM has the fairway falling 4–6 % to the left from 150 to 525 yd, not rising: the lie hooks. The project owner chose the real slant (2026-10-20) |
| The 3-wood at the pin | pushed right | hooked left | Same |
| The go shot's aim (shot and strategy) | (46, 503), left of the pin | (25, 505), right of the pin | Allowing for a hook, not a slice: aimscan's best for both skills |
| The lay-up's aim (shot and strategy) | (24, 432) | (13, 432) | The hook takes an iron aimed at (24, 432) into the waste left; aimed at (13, 432) it finishes about (22, 430), where the wedge checks start |

## 7. Results

`node tests/hole-report.js --hole=pinehurst-5` after the DEM rebuild:

```
=== Pinehurst No. 2 (pinehurst-5) — A par 5 that rises and turns left to an elevated plateau green set on a diagonal: gentle on top, falling away steeply at every edge onto short runoffs and wiregrass. Going for it in two means a 3-wood from a slanted fairway; most players lay up and wedge onto the top.
shot                                                                           before           after
a good drive finds the fairway                                                 FAIRWAY 227y     FAIRWAY 210y
a pushed drive is in the wiregrass and sand, not the rough                     ROUGH 290y       WASTE 305y
the second shot is played with the ball above the feet                         ROUGH 18y        GREENS 0y
a full 3-wood aimed straight at the pin from the slanted fairway is hooked le  ROUGH 17y        FAIRWAY 17y
the same 3-wood aimed right of the pin, allowing for the slant, finishes clos  ROUGH 18y        GREENS 0y
the lay-up with an iron finds the fairway at wedge distance                    FAIRWAY 68y      FAIRWAY 67y
from the lay-up, a well-struck wedge at the pin holds the top                  GREENS 2y        GREENS 2y
a wedge flown to the back-left edge runs off the falloff                       ROUGH 14y        FAIRWAY 16y
from the low runoff left of the green, a wedge back up the falloff finishes o  GREENS 1y        GREENS 0y

  strategy: the second shot: go for the green with a 3-wood (aimed right of the pin, for the slant) or lay up with an iron to wedge distance
  plan       skill   before: wet green score   after: wet green score
  go         sharp           0%   0% 3.52              0%  76% 2.81
  go         shaky           0%   5% 3.54              0%  29% 3.32
  layup      sharp           0%   0% 3.68              0%   0% 3.72
  layup      shaky           0%   0% 3.74              0%   0% 3.81
  payoff of go over layup (strokes saved): sharp 0.16 → 0.91, shaky 0.20 → 0.49   (before → after)

"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).
```

## 8. Review — does it look like the hole?

**Fast lane, coarse heights** (2026-10-20). No 1 m lidar covers this pin: the National Map's only elevation here is the 2003 NC statewide DEM (1/9 arc-second, about 3.4 m; before the 2010–11 restoration), resampled to a 1 m UTM tile in `tests/tools/refs/` (not in the repo). Heights and the fairway's slant come from it; bunkers, waste and the green's edge cannot (3.4 m, and pre-restoration). Frame: `docs/holes/trace/pinehurst-5.json`, from the owner's pins on the green and the tee (444.5 m at 246.0°; 1.134 game yd per m, so the straight line matches the card's 504). A flyover rendering confirms the layout; it is oblique, so nothing was traced.

**What changed**

| Item | Was | Now |
|---|---|---|
| Heights along the hole | +2 yd over z 370–490, a 1.2 yd rise under the green | thirteen DEM ramps: ±1 yd of roll, a 3.5 yd dip at 250–360, 5 yd up to the green |
| Fairway slant (second-shot zone) | rises to the left, grade 0.08: ball below the feet | falls to the left, grade −0.10: ball above the feet (§5) |
| Fairway bunker at (−20, 270) | depth 1.4, lip 0.5 | depth 0.5, lip 0.25; its shape and place are still from words |
| Highest hop, ten seeds (from the first touchdown) | 2.72 yd | 3.21 yd (under the 3.5 guard; the worst is a drive off the bunker's lip) |

**Verdict**
- Tee and direction: **matches** (the owner's two pins).
- Heights: **close** — from a 3.4 m, 2003 DEM.
- Green: **no reference** — still the ellipse and the plateau features.
- Bunkers and waste: **no reference** — the DEM is too coarse and too old.
- Slant: **matches** the DEM (and, as far as I know, descriptions of the hole as right-to-left): **differs from this spec's first version**.

**Open items**
1. Newer lidar (NC 2015 QL2, on `sdd.nc.gov`: not reachable from the sandbox) for the bunkers and waste, and a top-down aerial of the green.
2. Going for it now pays a sharp player 0.91 strokes and a shaky one 0.49 (the baseline favoured going before too, by 0.84 and 0.33): the hole leans further toward going than "most players lay up".

### Earlier review-only pass


**Review-only pass, no reference image yet** (2026-10-19). The verdicts below compare the game's renders (`python3 tests/tools/render.py pinehurst-5 tee bird approach green aerial`; the green-complex view is committed as `docs/maps/pinehurst-5-aerial.png`) with this spec's sources and what is widely known of the hole. Nothing here was traced, so no shape is measured: "close" means the parts are there and in the right places, not that their sizes are right, and every **no reference** row waits for a photo. The step and its tools: `docs/ICONIC-HOLES.md` §2, step 7.

**Photos to get**: an aerial of the plateau green from the lay-up area, and one up the slanted fairway from the landing area of the drive.

| Area | Item | Verdict | Evidence (render against sources) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | **close** | The hole rises and turns left at the end | — |
| | Elevation: tee, landing area, green | **close** | `ramp` up over the last third; the plateau green raised above its runoffs | Heights from a topographic source |
| | Ground between | **close** | The slanted fairway that gives the sidehill second shot | — |
| Fairway and fairway bunkers | Fairway outline and width | **close** | — | — |
| | Fairway bunkers: count, place, shape | **no reference** | One, right of the second-shot area | A photo up the fairway |
| | Rough, waste, paths | **close** | Sandy waste with wiregrass tufts along both sides | — |
| Green and greenside bunkers | Green outline and size | **close** | Diagonal, front-right to back-left, as an ellipse; the real outline is irregular (spec §4: "not expressed") | Trace from the aerial: now expressible |
| | Green contours as seen | **close** | A level top with steep falloffs (the `flat` plateau), and small swales | — |
| | Greenside bunkers: count, place, shape, depth | **no reference** | None at the green | The aerial will say |
| | Collar, banks and falloffs | **close** | Short firm runoffs into waste, as the spec has them | — |
| Surroundings and landmarks | Trees: kind and where | **close** | Longleaf-style pines | — |
| | Water, cliffs, structures, backdrop | **matches** | None | — |
| | Landmarks a player would name | **close** | The turtle-back green is the landmark, and is there | — |

**Open items**, most important first:
1. Trace the green's real outline: the spec listed it as not expressible; it now is.
2. Whether a bunker guards the green: the aerial will say.
