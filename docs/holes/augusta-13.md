# Iconic hole spec: Augusta National No. 13 (Azalea)

![map](../maps/augusta-13.png)

## 1. Inspiration

| | |
|---|---|
| Real hole | Augusta National Golf Club, No. 13 "Azalea" |
| Par / yardage (real) | Par 5, 545 yards (lengthened in 2023) |
| Par / yardage (game) | Par 5, 575 yards (card unchanged) |
| Sources | [Golf Digest on the 2023 lengthening and strategy](https://www.golfdigest.com/story/masters2023-13th-hole-augusta-national-lengthened-how-does-it-compare-strategy) |

## 2. What makes it iconic

- **Signature features**: a sharp dogleg left wrapped by a tributary of Rae's Creek, which then crosses in front of the green; azaleas; pines on the left of the corner.
- **The strategic problem**: Bobby Jones called the second shot a "momentous decision" — go for the green with a long club over the creek, or lay up. The second is typically played from a sidehill lie. Off the tee, players hug the left: a drive out to the right leaves a long second.
- **Where scores are made and lost**: eagles for those who get home, doubles for those who find the creek.

## 3. Analysis

| Archetype | Applies? | Shot | Notes |
|---|---|---|---|
| Risk/reward split | **primary** | second | go vs. lay up |
| Sloping lies | **primary** | second | ball above the feet, hooking toward the creek |
| Dogleg / corner | yes | tee | left is shorter, closer to trouble |
| Elevation change | yes | tee | the drive runs down into a valley |
| Penal surrounds | yes | second, third | creek in front, bank feeding it |
| Fast greens | yes | putt | |

## 4. Translation

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| Drive kicks down into the corner | `ramp` (speed slot) | z 190→330, −11 yd | a pure driver runs out past 320; a drawn one past 330 |
| Land keeps falling to the creek | `ramp` | z 380→545, −6 yd | the second plays a little downhill |
| Sidehill second shot | `tilt` + **StanceModel** | band along the fairway z 280–455, grade −0.11 (falls left) | ball above the feet: the arc and the shot hook left, toward the creek; the needle swings faster |
| Pine straw left of the corner | `cover` → PINE (new surface) | band left of the fairway | lie costs 20% distance |
| Creek in front of the green | water body (`creek`, `shore`) | moved 4 yd closer to the green | |
| Far bank stands up | `rise` | +4 yd | keeps the creek a creek, not a ravine (its level follows its lowest bank) |
| Green above a shaved bank | `rise` + `cover` → FAIRWAY | green knoll +3.2 yd, edge 18; mown bank between creek and green | anything short rolls back into the water |
| Fast green toward the creek | `greens.speed` 1.25, `tilt.z` −0.028 | | |

**Capability gaps**: the real green's swales (could use `hollow`); tree collision is in the game but not in the Node tests.

## 5. Exaggeration

| Characteristic | Real | Game | Why |
|---|---|---|---|
| Speed slot | a drawn drive gets extra run | an 11-yd valley; drive totals ~330 (vs ~286 on flat) | our clubs are short: without it the hole is never reachable in two and the decision disappears |
| Sidehill lie | noticeable | grade ~0.1 → a pure 3-wood aimed at the pin hooks ~26 yd left | the lie must change the aim, visibly, in the arc |
| Creek + shaved bank | creek fronts green | balls landing on the front bank roll in | going for it must carry the whole way |

**Realism bounds** (`node tests/tools/slope.js augusta-13`, `docs/maps/augusta-13-slope.png`): like Pebble Beach No. 8, one tilted plane (3.2 %, all of the surface in the 2.5–4 % band, tilt coherence 1.00): no steep ring and not a dome, but "gentle top" and "flat pockets" read WARN. Deliberate: the fast green sloping toward the creek is the point of §4's last row. Written before the bounds existed; recorded here, not reshaped.

## 6. Validation

All in `tests/hole-checks.js` → `augusta-13`.

| Shot | Expected | Result |
|---|---|---|
| Pure drive left-center | rest in fairway ≤250 to pin | ✅ 242 (was 293) |
| Drawn drive | ≤235 to pin | ✅ 228 (was 311) |
| Second from the valley | the stance model reads ball above the feet | ✅ |
| Pure 3-wood straight at the pin | hooks 18+ yd off | ✅ 26 yd left (was on the green) |
| Pure 3-wood aimed right for the hook | green or fringe | ✅ fringe, 14 yd |
| Slightly thin 3-wood (0.2) | water (lands on the bank, rolls back) | ✅ (was rough) |
| Wedge from the lay-up, 0.35 miss | green | ✅ |
| Wedge landing short on the bank | water | ✅ (was fairway) |

| Decision | Must hold | Result (wet %, expected score) |
|---|---|---|
| Go (3-wood) vs lay up (iron), from the valley | creek in play when going; going is right for a sharp player, laying up for a shaky one | go: sharp 5% / 3.41, shaky 29% / 4.02 · lay up: sharp 0% / 3.67, shaky 0% / 3.76 |

## 7. Results

```
=== Augusta National (augusta-13) — Dogleg left: a drive that finds the valley leaves a reachable second, but from a ball-above-the-feet lie that hooks toward the creek in front of a green perched on a shaved bank. Go for it, or lay up.
shot                                                                           before           after
a pure drive tumbles down the valley and runs out past 320                     FAIRWAY 293y     FAIRWAY 242y
a drawn drive catches the slope and runs even further                          FAIRWAY 311y     FAIRWAY 228y
the second shot is played with the ball above the feet                         ROUGH 18y        FRINGE 14y
aimed straight at the pin, the hanging lie hooks a pure 3-wood left of the gr  GREENS 4y        FAIRWAY 26y
aimed right to allow for the hook, a pure 3-wood reaches the putting surface   ROUGH 18y        FRINGE 14y
a slightly thin 3-wood lands on the shaved bank and rolls back into the creek  ROUGH 27y        WATER 29y
the lay-up leaves a flat wedge that a decent swing puts on the green           GREENS 4y        GREENS 4y
a ball that runs off the front of the green feeds into the creek               FAIRWAY 19y      WATER 29y

  strategy: the momentous decision (second shot from the valley)
  plan       skill   before: wet green score   after: wet green score
  go         sharp           0%  24% 3.42              5%   0% 3.41
  go         shaky          29%  10% 4.05             29%   0% 4.06
  layup      sharp           0%   0% 3.92              0%   0% 3.67
  layup      shaky           0%   0% 3.89              0%   0% 3.76
  payoff of go over layup (strokes saved): sharp 0.50 → 0.27, shaky -0.17 → -0.30   (before → after)
```

Expected strokes ("score") come from the baseline in `tests/hole-play.js`, including its recovery-difficulty term (see `docs/ICONIC-HOLES.md`). "Before" is the original hole as it stood at commit 548d49a: the same tee and pin, none of the iconic-hole features, play profile or hazards.

## 8. Visual review — does it look like the hole?

**Review-only pass, no reference image yet** (2026-10-19). The verdicts below compare the game's renders (`python3 tests/tools/render.py augusta-13 tee bird approach green aerial`; the green-complex view is committed as `docs/maps/augusta-13-aerial.png`) with this spec's sources and what is widely known of the hole. Nothing here was traced, so no shape is measured: "close" means the parts are there and in the right places, not that their sizes are right, and every **no reference** row waits for a photo. The step and its tools: `docs/ICONIC-HOLES.md` §2, step 7.

**Photos to get**: an aerial of the green complex from the fairway short of the creek (where the go-or-lay-up decision is made), and one from the tee down the corner.

| Area | Item | Verdict | Evidence (render against sources) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | **close** | A tee set back in the trees, the fairway turning left; from the game's tee the turn is out of sight beyond the landing area | — |
| | Elevation: tee, landing area, green | **close** | The drive kicks down into the corner (−11 yd) and the land keeps falling to the creek (−6 yd): the spec's design; no heights in the sources | Heights from a topographic source |
| | Ground between | **close** | A sidehill second shot (`tilt`), falling toward the creek on the left | — |
| Fairway and fairway bunkers | Fairway outline and width | **close** | Bends left round the tributary | — |
| | Fairway bunkers: count, place, shape | **no reference** | One, right of the landing area | A photo down the fairway |
| | Rough, waste, paths | **close** | Pine straw left of the corner | — |
| Green and greenside bunkers | Green outline and size | **differs: fix** | A round-ish 30 × 24 yd ellipse; the real green is wide and shallow with a swale through it | Trace from the aerial (expressible now) and a `hollow` for the swale |
| | Green contours as seen | **no reference** | One tilt toward the creek | — |
| | Greenside bunkers: count, place, shape, depth | **no reference** | Three ellipses, two behind and one front-left; the real number behind the green should be checked | Trace from the aerial |
| | Collar, banks and falloffs | **close** | The shaved bank between creek and green | — |
| Surroundings and landmarks | Trees: kind and where | **close** | Tall pines both sides, and in the corner | — |
| | Water, cliffs, structures, backdrop | **close** | The tributary along the left and the creek across the front | Trace the creek's line from the aerial |
| | Landmarks a player would name | **close** | Azaleas in bloom round the green and the corner, as the hole's name says; a stone `bridge` crosses the tributary right of the fairway short of the green | Check the bridge's place against a photo |

**Open items**, most important first:
1. Trace the green (wide and shallow, with its swale) and the bunkers behind it.
2. The creek's line in front of the green, from the same aerial: what the second shot carries.
3. Heights for the corner and the fall to the creek.
