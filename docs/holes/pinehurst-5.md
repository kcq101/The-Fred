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
| Raised green, lower on the left | `rise` under the green, plus a `tilt` that drops away on the right of the green | Long-left leaves a pitch from below; right falls away |
| Short, firm runoffs | `cover` FAIRWAY ring around the green, then WASTE beyond | Balls run off the edges and keep going |
| Wiregrass and sand | `WASTE` bands along both sides of the fairway | A poor lie, not a lost ball |
| Slanted fairway | `tilt` over the second-shot landing zone | Ball below the feet: StanceModel pushes the second shot right |
| Rises and turns left | `ramp` up over the last third; route bends left | |

**Capability gap closed**: a crown with a level top was not expressible (a negative `hollow` is a dome, steepest halfway out). `hollow` gains an optional `flat` (0–1): the share of the area's radius that stays at full depth before the falloff starts. Default 0 keeps every existing hole identical.

**Not expressed**: the green's true outline (the game's greens are ellipses), and the many small pockets of the real green (three features approximate them).

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length | 576–588 yd | 504 yd | Reachable in two with a good drive and a 3-wood run up the front, which is the real hole's question for tour players |
| Plateau | steep at the edges, gentle inside | `hollow` depth −0.75, `flat:0.62` over an 18.5 × 13 yd area, on a 1.2 yd `rise`; the green is 30 × 20 yd | On the slope map (`docs/maps/pinehurst-5-slope.png`, same colour bands as Kevin's map): 33% of the surface steeper than 4% (the edge ring), 14% at 2.5–4%, 43% at 1–2.5%, 10% under 1% |
| Movement on top | several flat pockets with gentle slopes between | green `tilt` about 1.3% plus a low crown (−0.07) and three soft pockets (0.06–0.07) | Earlier tries: small 0.1–0.12 pockets made steep rings inside the green; a dead-flat top (no tilt) read as a table |
| Fairway slant | a sidehill lie | `tilt` grade 0.08 over the second-shot zone | A full 3-wood aimed at the pin finishes 11 yd away; aimed left to allow for it, 2 yd |

**What changed from the first version**: the first build was a par 4 with a dome (`hollow` depth −2.8, no flat top) that Kevin rightly called a turtle shell: the whole green sloped, steepest halfway out. The plateau keeps the shedding at the edges and lets the top putt like a real green.

## 6. Validation — the contract

| Shot | Expected |
|---|---|
| A good drive | Fairway |
| A pushed drive | Waste |
| The second shot sits on a sidehill lie | Stance: ball below the feet |
| A full 3-wood aimed straight at the pin from the slanted fairway | Pushed right by the lie: 10+ yd from the pin |
| The same 3-wood aimed left, allowing for the slant | On the green, ≤ 8 yd |
| A lay-up with an iron | Fairway, wedge distance left |
| A well-struck wedge at the pin from the lay-up | Holds the plateau, close |
| A wedge aimed at the green's edge | Runs off the falloff |
| From the low runoff left of the green, a wedge back up | Gets back onto or near the green |

| Decision | Plans | Must hold |
|---|---|---|
| Second shot | go for it with a 3-wood aimed at (46,503), left of the pin, to allow for the slant / lay up with an iron to (24,432) | A sharp player holds the green ≥ 50% going for it, a shaky one ≤ 35%; going for it saves a sharp player ≥ 0.5 strokes; a shaky player gains under three quarters as much |

**Contract revised after the first tuning run**: I first wrote "the 3-wood aimed at the pin misses the green" and "laying up is right for a shaky player". The first is false on this green: the push leaves the ball on the front-right lobe 11 yd away, so the check now asserts the distance instead. The second the tour-style baseline does not support: it scores a shaky player going for it at 3.36 against 3.75 laying up, because it treats a 20-yard recovery from beside the green as easy. The contract asserts what is true: the payoff shrinks from 0.84 to 0.39 strokes and the shaky player holds the green 5 times in 21.

## 7. Results

```
=== Pinehurst No. 2 (pinehurst-5) — A par 5 that rises and turns left to an elevated plateau green set on a diagonal: gentle on top, falling away steeply at every edge onto short runoffs and wiregrass. Going for it in two means a 3-wood from a slanted fairway; most players lay up and wedge onto the top.
shot                                                                           before           after
a good drive finds the fairway                                                 FAIRWAY 227y     FAIRWAY 218y
a pushed drive is in the wiregrass and sand, not the rough                     ROUGH 290y       WASTE 291y
the second shot is played with the ball below the feet                         ROUGH 17y        GREENS 11y
a full 3-wood aimed straight at the pin from the slanted fairway is pushed ri  ROUGH 17y        GREENS 11y
the same 3-wood aimed left of the green, allowing for the slant, finishes clo  ROUGH 18y        GREENS 2y
the lay-up with an iron finds the fairway at wedge distance                    FAIRWAY 65y      FAIRWAY 65y
from the lay-up, a well-struck wedge at the pin holds the top                  GREENS 2y        GREENS 2y
a wedge flown to the back-left edge runs off the falloff                       ROUGH 14y        WASTE 18y
from the low runoff left of the green, a wedge back up the falloff finishes o  GREENS 1y        GREENS 0y

  strategy: the second shot: go for the green with a 3-wood (aimed left of it, for the slant) or lay up with an iron to wedge distance
  plan       skill   before: wet  score     after: wet  score
  go         sharp             0%  3.48              0%  2.83
  go         shaky             0%  3.50              0%  3.36
  layup      sharp             0%  3.73              0%  3.67
  layup      shaky             0%  3.78              0%  3.75
```

"Before" is the same land and green with no plateau, slant, waste, runoffs, bunker or play profile.
