# Iconic hole spec: Pinehurst No. 2, No. 5

## 1. Inspiration

| | |
|---|---|
| Real hole | Pinehurst No. 2, hole 5 |
| Par / yardage (real) | Par 4 on the everyday course (a dogleg left of roughly 450–480 yards); the 2024 U.S. Open played it as a par 5. The game follows the par 4, as requested. |
| Par / yardage (game) | Par 4, 388 yards tee → pin. A pure driver leaves about 100 yards. |
| Sources | See below |

- [Pinehurst — The No. 2 restoration, a hole-by-hole tour](https://www.pinehurst.com/news/the-pinehurst-no-2-restoration-a-hole-by-hole-tour/)
- [GolfPass — 2024 U.S. Open course preview: Pinehurst No. 2](https://www.golfpass.com/travel-advisor/articles/2024-u-s-open-golf-course-preview-pinehurst-no-2)
- [golf.com — 6 key U.S. Open holes at Pinehurst](https://golf.com/travel/6-key-us-open-holes-pinehurst/?amp=1)
- [Spectrum News — A hole-by-hole description of Pinehurst No. 2](https://spectrumlocalnews.com/nc/charlotte/sports/2024/06/11/us-open--24--a-hole-by-hole-description-of-pinehurst-no--2)
- [Sports Illustrated Vault — A new No. 2](https://vault.si.com/vault/2005/06/14/a-new-no-2)

## 2. What makes it iconic

- **Signature features**: the turtleback green, an upside-down saucer that sheds any ball not struck at its crown; sandy waste areas with wiregrass instead of rough.
- **The strategic problem in one sentence**: the green rejects every approach that is not exactly right, and the shed ball ends in sand and wiregrass with a hard recovery back up the dome.
- **Where scores are made and lost**: the approach and the recovery. A missed green means a difficult up and down.

## 3. Analysis — the challenge archetypes

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Green contours | Yes (primary) | Approach | The crown |
| Penal surrounds | Yes | Approach, recovery | Waste on all sides of the green |
| Distance control | Yes | Approach | Land just short and let it run up |
| Narrow landing zone | Mild | Drive | Waste lines the fairway |
| Deep or pot bunkers | Mild | Drive | One fairway bunker |
| Dogleg | Simplified | | A gentle bend, not a corner |
| Firm turf | Yes | | `firm:1.1`, greens firm 0.9 |

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Turtleback green | `hollow` with **negative depth** (a crown) | area rx 19, rz 17, `depth:-2.8` | Highest at the heart; sheds anything off-center |
| Sandy waste areas | **new** `WASTE` surface via `cover` | bands along both sides of the fairway and an ellipse ring (rx 30, rz 27) round the green | Poor lie (0.82), grabs the ball, hard recovery |
| Fairway bunker | bunker | (-14,268) | Positional |
| Firm turf | play profile | `firm:1.1, greens:{speed:1.1, firm:0.9}` | The ball runs up the front |

**Capability gaps**: the 2024 par-5 version is not offered. The dogleg is gentle. Wiregrass is a color wash on the waste, not an obstacle.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Crown height | a yard or two across the green | 2.8 yd over a 19 × 17 yd area | At 1.7 a mishit 3 yd off center still stayed on; 2.8 sheds a 0.3-needle mishit |
| Waste | native sand and wiregrass | a waste ring out to the fringe | The shed ball must end in waste |
| Green firmness | firm | 0.9 | At 1.4 a pin-high ball ran through the back; at 0.9 a ball landed 4 yd short runs up to the heart |

## 6. Validation — the contract

| Shot | Expected |
|---|---|
| A good drive | Fairway |
| A pushed drive | WASTE, not rough |
| A well-struck approach landed 4 yd short of the pin | Green, ≤ 8 yd from the pin |
| Aimed at the green's edge | Shed into waste, rough or fringe |
| A slightly mis-hit approach (needle 0.3) | Not on the green |
| A short approach into the front slope | Turned away, 6+ yd from the pin |
| A wedge from the waste | Within 25 yd of the pin |

| Decision | Plans | Must hold |
|---|---|---|
| Approach | at the heart / land well short | Sharp holds the green ≥ 60%, shaky ≤ 40%; sharp and shaky differ by ≥ 0.5 strokes; the layup scores over 0.5 worse for a sharp player |

## 7. Results

```
=== Pinehurst No. 2 (pinehurst-5) — A par 4 to an upside-down-saucer green: the crown sheds any approach that is not struck right at its heart, and every shed ball rolls into sandy waste with a hard recovery. Sandy waste lines the fairway too, so the drive is only half the problem.
shot                                                                           before           after
a good drive finds the fairway                                                 FAIRWAY 107y     FAIRWAY 99y
a pushed drive is in the sandy waste, not the rough                            ROUGH 169y       WASTE 176y
from the fairway, a well-struck approach landed just short of the pin runs up  GREENS 1y        GREENS 2y
aimed at the green's edge, even a well-struck approach is shed off it          FRINGE 14y       WASTE 17y
a slightly mis-hit approach (needle 0.3) does not stay on the green            GREENS 5y        WASTE 17y
a short approach into the front slope is turned away, not fed to the pin       GREENS 11y       FRINGE 16y
the waste is playable: a wedge from it gets back near the green                GREENS 1y        WASTE 14y

  strategy: approach: go straight at the pin, or land it well short and hope the front slope kicks it up
  plan       skill   before: wet  score     after: wet  score
  pin        sharp             0%  2.14              0%  2.34
  pin        shaky             0%  2.71              0%  3.14
  short      sharp             0%  3.05              0%  3.30
  short      shaky             0%  3.27              0%  3.41
```

"Before" is the same land and green with no crown, waste, bunker or play profile.
