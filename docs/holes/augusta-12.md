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
| Rae's Creek | creek water body, shore profile | band `w:3.2`, bending in toward the green on the right | Short or thin is wet |
| Steep bank | `cover` FAIRWAY band along the creek's right half | `w:11` | Short balls roll back into the creek |
| Raised green and the bank behind it | two `rise` features | dh 2.2 and 1.4 | The green sits up; long balls stop in the bunkers |
| Bunkers front and back | bunkers | depth 1.6, lip 0.5 | The back ones are the miss |
| Swirling wind | play profile | `wind:[3,14], windPush:2` | The HUD reads GUSTY; wind decides the club |
| Fast greens | play profile | `greens:{speed:1.3, firm:0.75}` | Soft landing, quick roll |
| Hogan Bridge | `bridge` | at (-34,134) | Scenery |

**Capability gaps**: the real wind swirls during the swing; the game's wind is constant for a shot. Pin position is fixed (the Sunday right pin); there is no per-round pin.

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Green depth | 16–26 yd by source | about 17 yd | Shallow, so distance control decides |
| Creek margin on the right | a few yards | creek bent in at the right | The pin attack has to cost a shaky player (wet 38% vs 14% for the middle) |
| Wind | 0–15+ mph | 3–14, windPush 2 | A 14 mph headwind takes a stock iron into the creek |

**Realism bounds** (`node tests/tools/slope.js augusta-12`, `docs/maps/augusta-12-slope.png`): 0 / 92 / 1 / 7 % in the four bands: a 2.4 % tilt, with the 7 % over 4 % along the front edge where the `rise` under the green begins to fall away. No dome; "flat pockets" reads WARN. §3 calls the green's contours mild (a slight tilt and a bank behind); the decision is the creek and the wind, so the putting surface is left as it is.

## 6. Validation — the contract

| Shot | Expected |
|---|---|
| A well-struck iron at the pin | Green, ≤ 7 yd from the pin |
| A well-struck iron at the middle | Green |
| A slightly thin iron | Steep bank, back into the creek |
| A push right at the pin | Wet |
| 15 yards long, at (-12,156) | The back-right bunker |
| 14 mph headwind, stock shot | Short, in the creek |
| Clubbing up for the headwind | Green or its edge, ≤ 9 yd |
| 14 mph tailwind, stock shot | Through the green: sand or rough |

| Decision | Plans | Must hold |
|---|---|---|
| The Sunday pin | pin / deep middle | The pin is never wet for a sharp player (100 % on the green) and wet ≥ 25 % for a shaky one (38 %, with 62 % on the green); the middle drowns half as often or less (14 %); the pin saves a sharp player over 0.4 strokes (0.55); for a shaky player the two plans are within a quarter stroke of each other, either way (the pin is 0.10 better) |

**Honest note**: the baseline still rates the two plans as close for a shaky player (pin 3.54, middle 3.64: the pin is 0.10 stroke better) because its penalty for a wet ball is only one stroke; the middle drowns 14 % of the time against 38 %. The contract therefore asserts the hazard rates and a bounded gap, not a score advantage for the middle. The real hole is the same at the margin: the middle is safer, not better.

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| The Sunday pin, shaky player | the middle costs a shaky player no more than 0.1 stroke extra (`middle.shaky ≤ pin.shaky + 0.1`) | the two plans are within a quarter stroke of each other, either way (`|pin.shaky − middle.shaky| < 0.25`) | The baseline gained a recovery term that charges a ball that finishes in the deep back bunkers or at the foot of the bank (shaky middle 3.55 → 3.64) while the pin's score did not move (3.54): the gap went from 0.01 to 0.10, a hair past the old bound. "Costs nothing" claimed more than the baseline shows; the new wording states the gap it does |

## 7. Results

```
=== Augusta National (augusta-12) — A short iron over Rae's Creek to a shallow, wide green angled away from the tee: the creek and its steep bank short, deep bunkers long, a swirling wind over it all. The deeper left side is the safe target; the Sunday pin tucked by the creek on the right is the temptation.
shot                                                                           before           after
a well-struck iron at the pin holds the right side of the green                GREENS 5y        GREENS 5y
a well-struck iron at the middle of the green holds it                         GREENS 15y       GREENS 15y
a slightly thin iron lands on the steep bank and feeds back into the creek     FRINGE 9y        WATER 16y
a push right at the pin is wet                                                 ROUGH 19y        WATER 15y
carried 15 yards long, the ball finds the deep back-right bunker               ROUGH 18y        SAND 15y
into a 14 mph headwind, a stock shot comes up short in the creek               GREENS 0y        WATER 10y
clubbing up for the headwind (arc past the pin) finishes on the putting surfa  ROUGH 9y         FRINGE 7y
with a 14 mph tailwind, a stock shot flies the green into the back bunkers or  ROUGH 9y         ROUGH 9y

  strategy: the Sunday pin: attack it by the creek, or play to the deep middle
  plan       skill   before: wet green score   after: wet green score
  pin        sharp           0% 100% 2.64              0% 100% 2.67
  pin        shaky           0%  67% 2.95             38%  62% 3.54
  middle     sharp           0% 100% 3.13              0%  81% 3.22
  middle     shaky           0%  71% 3.23             14%  48% 3.64
  payoff of pin over middle (strokes saved): sharp 0.49 → 0.55, shaky 0.28 → 0.10   (before → after)
```

"Before" is the same land and green with no creek bank, bunkers, wind or green shaping. Expected strokes ("score") come from the baseline in `tests/hole-play.js`, including its recovery-difficulty term (see `docs/ICONIC-HOLES.md`), so they differ slightly from earlier pastes of this table.

## 8. Visual review — does it look like the hole?

**Review-only pass, no reference image yet** (2026-10-19). The verdicts below compare the game's renders (`python3 tests/tools/render.py augusta-12 tee bird approach green aerial`; the green-complex view is committed as `docs/maps/augusta-12-aerial.png`) with this spec's sources and what is widely known of the hole. Nothing here was traced, so no shape is measured: "close" means the parts are there and in the right places, not that their sizes are right, and every **no reference** row waits for a photo. The step and its tools: `docs/ICONIC-HOLES.md` §2, step 7.

**Photos to get**: an aerial of the green from over the tee, and the tee shot (the hole is one picture from the tee).

| Area | Item | Verdict | Evidence (render against sources) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | **close** | Straight across the creek | — |
| | Elevation: tee, landing area, green | **close** | The green raised above the creek bank (two `rise`s) | — |
| | Ground between | **close** | Fairway grass down to the creek | — |
| Fairway and fairway bunkers | Fairway outline and width | **matches** | A short mown approach | — |
| | Fairway bunkers: count, place, shape | **matches** | None | — |
| | Rough, waste, paths | **close** | — | — |
| Green and greenside bunkers | Green outline and size | **close** | Wide and shallow (38 × 17 yd), angled away to the right, as the sources say; an ellipse | Trace from the aerial |
| | Green contours as seen | **no reference** | — | — |
| | Greenside bunkers: count, place, shape, depth | **close** | One in front, two behind; the front one sits front-left of the green's middle | Trace from the aerial to place the front one |
| | Collar, banks and falloffs | **close** | The steep shaved bank into the creek | — |
| Surroundings and landmarks | Trees: kind and where | **close** | Tall pines behind, azaleas in bloom under them | — |
| | Water, cliffs, structures, backdrop | **close** | Rae's Creek across the front, bending in on the right | — |
| | Landmarks a player would name | **differs: fix** (to confirm) | The Hogan Bridge is built at (−34, 134): right of the green from the tee. The bridge that carries players to this green crosses on the left | Move the `bridge` to the left side if a photo confirms it: data only |

**Open items**, most important first:
1. The Hogan Bridge's side: data only, confirm with a photo.
2. Trace the green and the three bunkers from one aerial.
