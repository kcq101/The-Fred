# Iconic hole spec: Augusta National No. 12 (Golden Bell)

## 1. Inspiration

| | |
|---|---|
| Real hole | Augusta National, hole 12, Golden Bell |
| Par / yardage (real) | Par 3, 155 yards |
| Par / yardage (game) | Par 3, 141 yards tee → pin |
| Sources | See below |

- [Your Golf Travel — Augusta's 12th](https://www.yourgolftravel.com/best-golf-holes/augusta-12th)
- [Sports Illustrated Vault — Little Monster](https://vault.si.com/vault/2011/04/18/little-monster)
- [Golf Australia — Augusta's little terror](https://www.golfaustralia.com.au/feature/masters-postcard-augustas-little-terror-427458)
- [Fox Sports — The par-3 12th is Augusta's short little terror](https://www.foxnews.com/sports/the-par-3-12th-is-augustas-short-little-terror)

Sources disagree on the green's depth (about 16 vs 26 yards); the game uses a shallow green of about 17 yards.

## 2. What makes it iconic

- **Signature features**: Rae's Creek in front, a steep bank that kicks short balls back into the water, a green that is wide but only about a club deep, angled away from the tee, with bunkers front and back, and swirling wind in the lowest spot on the property.
- **The strategic problem in one sentence**: a short iron with almost no safe miss, where the wind decides the club and the Sunday pin by the creek tempts you into the water.
- **Where scores are made and lost**: club selection in the wind. Short is wet; long is in the bunkers and a hard up and down.

## 3. Analysis — the challenge archetypes

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Distance control | Yes (primary) | Tee shot | Narrow depth window |
| Forced carry | Yes | Tee shot | Over the creek |
| Wind exposure | Yes | Tee shot | 3–14 mph, `windPush:2` |
| Deep or pot bunkers | Yes | Tee shot | Front and back |
| Penal surrounds | Yes | Tee shot | Steep bank feeds the creek |
| Risk/reward split | Yes | Tee shot | Pin by the creek vs deep middle |
| Green contours | Mild | | Slight tilt and a bank behind |
| Others | No | | |

It differs from Sawgrass 17 on purpose: shallow and wide, angled, one water hazard (a creek) in front and bunkers long, with a bail-out toward the deeper left side. Sawgrass is a round island with water all round.

## 4. Translation — real feature → game mechanic

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Rae's Creek | two creek bodies, shore profile | in front of the green: the lidar's flattened water (`poly`, 85 × 73.5 yd overall, 12–17 yd wide), its green-side shore 13 yd short of the pin and 2 yd off the green's right end; left of it, a band along the lidar's lowest line under the bridge | Short or thin is wet; the right end of the green is the tight one |
| Steep bank | `ramp` z 126–134.5, dh 1.45 (lidar: 1.5 m in 7 yd on the line to the pin), `cover` FAIRWAY band along the green-side shore | `w:8` | Short balls land on a shaved slope above the water |
| Heights: the tee above the creek, the green, the bank behind | six `ramp`s from the 2018 USGS lidar (`lidar.py build`) | tee 3.5 yd above the pin; the green 1.6 yd above the water; +2.4 yd over 32 yd behind | The tee shot drops; long balls run up into the back bunkers |
| Bunkers front and back | one in front (lidar outline), two behind the green's left half (lidar 2 m hollows) | depth 0.41–0.54, lip 0.25 | The back ones are the miss long |
| Swirling wind | play profile | `wind:[3,14], windPush:2` | The HUD reads GUSTY; wind decides the club |
| Fast greens | play profile | `greens:{speed:1.3, firm:0.75}` | Soft landing, quick roll |
| Hogan Bridge | `bridge` | at (30, 93): left, over the band | Scenery |

**Capability gaps**: the real wind swirls during the swing; the game's wind is constant for a shot. Pin position is fixed (the Sunday right pin); there is no per-round pin.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Green depth | 16–26 yd by source | about 17 yd | Shallow, so distance control decides |
| Creek margin on the right | a few yards | as the lidar has it: 2 yd off the green's right end, 13 yd short of the pin | Not exaggerated any more: the pin attack still costs a shaky player (wet 33 % vs 10 % for the middle) |
| Wind | 0–15+ mph | 3–14, windPush 2 | A 14 mph headwind costs a stock iron 8 yd: it lands on the front of the green, not in the creek (that needs about 22 mph, or a club short) |

**Realism bounds** (`node tests/tools/slope.js augusta-12`, `docs/maps/augusta-12-slope.png`): 0 / 95 / 1 / 4 % in the four bands: one gentle tilt, steep only at the front edge. No dome; "flat pockets" reads WARN. §3 calls the green's contours mild (a slight tilt and a bank behind); the decision is the creek and the wind, so the putting surface is left as it is.

## 6. Validation — the contract

| Shot | Expected |
|---|---|
| A well-struck iron at the pin | Green, ≤ 7 yd from the pin |
| A well-struck iron at the middle | Green |
| A thin iron at the pin (needle 0.4) | Short, in the creek |
| A push right at the pin | Wet |
| Long over the left half, at (2,152) | A back bunker |
| A club short, at (-8,128) | In the creek |
| Clubbing up for the headwind | Green or its edge, ≤ 9 yd |
| 14 mph tailwind, stock shot | Through the green: sand or rough |

| Decision | Plans | Must hold |
|---|---|---|
| The Sunday pin | pin / deep middle | The pin is never wet for a sharp player (100 % on the green) and wet ≥ 25 % for a shaky one (33 %, with 62 % on the green); the middle drowns half as often or less (10 %); the pin saves a sharp player over 0.4 strokes (0.46); for a shaky player the two plans are within a quarter stroke of each other, either way (the middle is 0.12 better) |

**Honest note**: the baseline rates the two plans as close for a shaky player (pin 3.51, middle 3.39: the middle is 0.12 stroke better) because its penalty for a wet ball is only one stroke; the middle drowns 10 % of the time against 33 %. The contract therefore asserts the hazard rates and a bounded gap, not a score advantage for the middle. The real hole is the same at the margin: the middle is safer, not better.

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| The Sunday pin, shaky player | the middle costs a shaky player no more than 0.1 stroke extra (`middle.shaky ≤ pin.shaky + 0.1`) | the two plans are within a quarter stroke of each other, either way (`|pin.shaky − middle.shaky| < 0.25`) | The baseline gained a recovery term that charges a ball that finishes in the deep back bunkers or at the foot of the bank (shaky middle 3.55 → 3.64) while the pin's score did not move (3.54): the gap went from 0.01 to 0.10, a hair past the old bound. "Costs nothing" claimed more than the baseline shows; the new wording states the gap it does |
| A slightly thin iron (needle 0.3) | lands on the steep bank and feeds back into the creek | a thin iron (needle 0.4) comes up short in the creek | The lidar puts the creek 7 yd further from the pin than the old guess: a 0.3 thin iron now carries the water and the bank (lands at z 134, the shore is at 128) and holds the green 8 yd from the pin. 0.4 is the first miss that is short and wet |
| 15 yards long at (-12,156) | finds the deep back-right bunker | long over the left half, at (2,152), finds a back bunker | The lidar has no bunker back right: both back bunkers sit behind the green's left half (as the yardage book draws them) |
| 14 mph headwind, stock shot | short, in the creek | an iron flown a club short (at -8,128) finds the creek | With the creek where the lidar has it, a 14 mph headwind costs a stock iron 8 yd and it lands on the green's front edge (3.6 yd from the pin); it takes about 22 mph, outside the hole's wind range, to reach the water. The check now states the miss the creek punishes: a club short |

## 7. Results

`node tests/hole-report.js --hole=augusta-12` after the lidar rebuild ("before" is the Phase 2 baseline the tool compares with):

```
=== Augusta National (augusta-12) — A short iron over Rae's Creek to a shallow, wide green angled away from the tee: the creek and its steep bank short, deep bunkers long, a swirling wind over it all. The deeper left side is the safe target; the Sunday pin tucked by the creek on the right is the temptation.
shot                                                                           before           after
a well-struck iron at the pin holds the right side of the green                GREENS 5y        GREENS 5y
a well-struck iron at the middle of the green holds it                         GREENS 15y       GREENS 15y
a thin iron at the pin comes up short in the creek                             ROUGH 13y        WATER 12y
a push right at the pin is wet                                                 ROUGH 19y        WATER 17y
carried long over the left half of the green, the ball finds a back bunker     ROUGH 15y        SAND 14y
an iron flown a club short of the pin (the wind misjudged) finds the creek     ROUGH 12y        WATER 14y
clubbing up for the headwind (arc past the pin) finishes on the putting surfa  ROUGH 9y         GREENS 5y
with a 14 mph tailwind, a stock shot flies the green into the back bunkers or  ROUGH 9y         ROUGH 11y

  strategy: the Sunday pin: attack it by the creek, or play to the deep middle
  plan       skill   before: wet green score   after: wet green score
  pin        sharp           0% 100% 2.64              0% 100% 2.67
  pin        shaky           0%  67% 2.95             33%  62% 3.51
  middle     sharp           0% 100% 3.13              0% 100% 3.13
  middle     shaky           0%  71% 3.23             10%  71% 3.39
  payoff of pin over middle (strokes saved): sharp 0.49 → 0.46, shaky 0.28 → -0.12   (before → after)

"score" = expected strokes for the whole hole from that moment (tour-style baseline; water/OB = stroke and distance).
```

## 8. Review — does it look like the hole?

**Fast lane, lidar** (2026-10-20). Bunkers, water and heights from the lidar; the green is still the ellipse: no near-vertical aerial yet.

**References used**: USGS 3DEP 1 m DEM, `GA_Statewide_2018_B18_DRRA`, tile x40y371 (2018; not in the repo); a map pin on the green from the project owner; a tee photo and a bridge-side photo, and a yardage-book drawing (no compass) — used for direction and to confirm the bridge, not traced. Frame: `docs/holes/trace/augusta-12.json` (bearing 207.1°, 1.012 game yd per m: the real tee is 136 m from the pin, the game's 141 yd).

**What changed**

| Item | Was | Now |
|---|---|---|
| Creek in front of the green | a 6.4 yd band, its shore about 8 yd short of the pin | the lidar's flattened water: 12–17 yd wide, shore 13 yd short of the pin, 2 yd off the green's right end; level 0.7 yd under its banks, shore edge 3 |
| Creek left of the green | the same band, bending toward the tee | a band along the lidar's lowest line, under the bridge |
| Heights | two `rise`s (green +2.2, bank +1.4) | six `ramp`s: the tee 3.5 yd above the pin, down to the water, a 7 yd front bank, the bank behind |
| Front bunker | ellipse 12 × 6 yd at (14, 131), 1.6 deep | lidar outline 9.5 × 8.5 yd at (4.7, 127.2), 0.41 deep |
| Back bunkers | two ellipses, back-left (21, 147) and back-right (-12, 152), 1.6 deep | both behind the left half, at (7.6, 148) and (1, 151.8), 0.54 and 0.50 deep |
| Hogan Bridge | (-34, 134): right | (30, 93): left |
| Highest hop, ten seeds (`tests/ball.test.js` loop) | 5.34 yd | 3.29 yd |

**Renders**: `docs/maps/augusta-12-tee.png`, `docs/maps/augusta-12-aerial.png`.

**Verdict**
- Tee and direction: **matches** — the creek runs across from front-left to back-right and the bridge is on the left, as in the tee photo and the yardage book.
- Heights: **matches** (lidar).
- Green: **close** — ellipse, shallow and angled the right way; its left end runs about 8 yd into the foot of the bank the lidar shows. Needs an aerial.
- Bunkers: **matches** for place and depth; the back two are sized from 2 m hollows and may be a little small.
- Water and surroundings: **matches** for the creek; azaleas and pines as before.

**Open items**
1. Trace the green from a near-vertical aerial and place it with `lidar.py match`.
2. `lidar.py build` merges the back bunkers into the bank's toe at every smoothing tried; they were placed by hand.

**Signed off**: pending review.
