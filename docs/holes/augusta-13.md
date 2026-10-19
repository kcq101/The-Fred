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

## 6. Validation

All in `tests/hole-checks.js` → `augusta-13`.

| Shot | Expected | Result |
|---|---|---|
| Pure drive left-center | rest in fairway ≤250 to pin | ✅ 242 (was 293) |
| Drawn drive | ≤235 to pin | ✅ 228 (was 311) |
| Second from the valley | HUD/stance says ball above feet | ✅ |
| Pure 3-wood straight at the pin | hooks 18+ yd off | ✅ 26 yd left (was on the green) |
| Pure 3-wood aimed right for the hook | green or fringe | ✅ fringe, 14 yd |
| Slightly thin 3-wood (0.2) | water (lands on the bank, rolls back) | ✅ (was rough) |
| Wedge from the lay-up, 0.35 miss | green | ✅ |
| Wedge landing short on the bank | water | ✅ (was fairway) |

| Decision | Must hold | Result (wet %, expected score) |
|---|---|---|
| Go (3-wood) vs lay up (iron), from the valley | creek in play when going; going is right for a sharp player, laying up for a shaky one | go: sharp 5% / 3.41, shaky 29% / 4.02 · lay up: sharp 0% / 3.67, shaky 0% / 3.76 |
