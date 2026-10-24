# Iconic hole spec: TPC Sawgrass No. 17

![map](../maps/sawgrass-17.png)

The second hole built trace-first (after Riviera No. 6) and the first laid out from the lidar before a photo was opened: `tests/tools/lidar.py` found the lake, the island, its walkway and every height, an aerial matched to that lidar gave the green and the pot bunker, and a tee photo checked the direction. Trace file: `docs/holes/trace/sawgrass-17.json`.

## 0. References

| Reference | Required? | Have it? | Source / note (never commit photos or lidar tiles) |
|---|---|---|---|
| Map pin on the green (lat, lon) | yes | yes | 30.1946328, −81.3908011, from the project owner (Google Maps pin: a location, not imagery) |
| Lidar tile | yes | yes | USGS 3DEP 1 m DEM, project `FL_Peninsular_FDEM_2018_D19_DRRA` (flown 2018–19, published 2023), tile `USGS_1M_17_x46y335_FL_Peninsular_FDEM_2018_D19_DRRA.tif`, public domain, 184 MB. After the 2016 changes to the collar and walkway (golf.com), so it shows today's island. `python3 tests/tools/lidar.py fetch --pin 30.1946328,-81.3908011 --download` |
| Aerial of the green complex | yes | yes | Near-vertical aerial in a tournament round, supplied by the project owner; photographer unknown |
| Photo from on or behind the tee | yes | yes | A player's tee shot from behind; a phone screenshot of an image search result, supplied by the project owner; photographer unknown |
| Backdrop photos | optional | partly | The tee photo shows the grandstands, hospitality and trees behind the island |
| Low-sun or rain photo of the green | optional | no | Would show the green's contours, and whether the tier (§4) exists |
| *Extra:* yardage-book page | — | yes | A schematic of the hole with a compass, supplied by the project owner. Not traced; used for the direction, which tee strip is which, and the bunker's side |

## 1. Inspiration

| | |
|---|---|
| Real hole | TPC Sawgrass (Stadium Course), No. 17, the island green (Pete Dye, 1980; the island was Alice Dye's idea) |
| Par / yardage (real) | Par 3. 137 yd from the professional tee (From the Drop Zone); 141 yd in 2025, "changes day to day" (Golf News Net, 2026). The yardage book has the green's front at 132 and back at 157 from its tee. |
| **Matches the request?** | Yes: the request named the hole, not a par or a length. The game keeps 137 yd. |
| Par / yardage (game) | Par 3, 137 yd tee → pin, **at true scale**: 1 game yard per real yard (1.0936 per metre). An iron (155 carry) is the club, as it was. |
| Sources | [Golf News Net — the size of the island green (2026)](https://thegolfnewsnet.com/ryan_ballengee/2026/03/14/what-is-the-size-of-the-island-green-par-3-17th-hole-at-tpc-sawgrass-and-the-players-125558/) (78 × 81 ft, 3,912 ft² of putting surface; about 18 in of rough round the edge; 141 yd in 2025; calls the bunker "front left": see below) · [golf.com — how the island green has changed](https://golf.com/travel/players-championship-changes-island-green-17th-hole/) (2007: contours softened; 2016: collar narrowed, walkway turfed and moved a little forward; one pot bunker) · [From the Drop Zone — The Island Green](https://fromthedropzone.substack.com/p/the-island-green) (137 yd; a green, one small pot bunker, a walkway) |

**The bunker's side.** Golf News Net calls it "front left". The aerial matched to the lidar, the yardage book and the tee photo (the mound right of centre, §8) all put it **front-right** from the tee. The game follows the photos.

## 2. What makes it iconic

- **Signature features**: a heart-shaped green on an island barely bigger than it, held in by a timber bulkhead; a walkway leaving its back-left; a tiny pot bunker cut into a grass mound at the front-right; grandstands and a hillside of spectators all round.
- **The strategic problem in one sentence**: there is no bail-out: short, long, left or right is wet, so the shot is pure distance and direction control, and the wind decides what "the right distance" is.
- **Where scores are made and lost**: the tee shot. Of the misses that stay dry, the pot bunker short-right is the only hazard.

## 3. Analysis

| Archetype | Applies? | Shot | Notes |
|---|---|---|---|
| Penal surrounds (island) | **primary** | tee | 1–3 yd of collar and rough between the green and the bulkhead |
| Wind exposure | **primary** | tee | the variable the player has to read |
| Deep bunker | yes | tee | the one dry miss, cut into a mound on the line to a front-right pin |
| Green contours | yes | putt | back-to-front and right-to-left tilt (lidar) |
| Forced carry, distance control, elevation, others | no | | |

## 4. Translation

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| The lake | water body (`lake`, `wall` bulkhead), its outline from the lidar | `lidar.py outlines`: the hydro-flattened water, every pond's shore, narrower than 1.5 m smoothed out; 152 × 197 yd | The water in front of the tee, the two ponds either side of the walkway, the arm behind the island, as they are |
| The island | `islands: [{type:'poly'}]` traced from the aerial, placed and sized by the lidar | 34 × 33 yd, 690 yd² with the start of the walkway (was a 38 × 31 yd ellipse, 925 yd²) | The real margin: 1–3 yd from the green to the bulkhead |
| The walkway | the same outline, out to where the lake's own shore takes over | to (22, 155) on the aerial; the lidar's land beyond | Land, back-left, as in the yardage book (was missing: §8 open item 1 of the old review) |
| The green | traced outline `green:{pts}` | 26.7 × 27.3 yd, 463 yd² (published: 26 × 27 yd, 435 yd²) | A heart, wider than deep at the back, with the notch round the bunker mound at the front-right |
| The green's tilt | `tilt` | `x` 0.0145, `z` 0.0172: the lidar's plane over the traced green, rising 1.7 % to the back and 1.5 % to the left | Back-to-front and right-to-left. The old tilt fell to the back: the wrong way |
| The pot bunker | traced bunker, **×2** | 4.2 × 4.0 yd (2.1 × 2.0 yd as traced), `depth` 0.9, `lip` 0.25; centre (−5.6, 131.1), 6 yd short of the pin and 1.6 yd right of it | On the line to the front-right pin. Was a 4.8 × 4.3 ellipse 11 yd right of where it is |
| The mound it is cut into | `hollow` with negative depth (a crown) | (−3.5, 132.5), 3.5 × 3 yd, 0.33 yd high (the lidar: 0.3 m) | A ball landing on it kicks; into the bunker if it comes down short of the pin |
| Heights | `rise` (island, tee strip), water `level` | Tee 0.67 yd above the pin, the lake 1.54 yd below it, the bulkhead 1.3 yd above the water: all the lidar's, at true scale | The tee looks slightly down at the island, over a water surface well below it |
| A tier in the green | `step` | back-left +0.45 yd | **An arcade invention, kept**: no source or photo shows one, and the 1 m lidar cannot (§5) |
| Exposed, swirling wind | `play` | wind 7–19 mph, `windPush` 3 (HUD: GUSTY) | The arc shows still air; the player must read the wind |

**Capability gaps**: the swirl itself (wind is constant during a shot); a lake with a bulkhead on some shores and a grass bank on others (one `profile` per body: the near shore in front of the tee is a bulkhead in the game, a grass bank in the tee photo); the grandstands (§8).

## 5. Exaggeration

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|
| Length, island, green | 137 yd; green 26 × 27 yd (78 × 81 ft) | 137 yd; island and green traced, green 26.7 × 27.3 yd | **Not exaggerated.** True scale: the aerial is sized by the lidar alone and the green comes out within 3 % of the published dimensions (6 % in area), without being told them |
| Pot bunker | "tiny"; 2.1 × 2.0 yd of sand on the aerial | traced ×2: 4.2 × 4.0 yd (`exaggerate` in the trace file) | **Exaggerated, the one shape drawn bigger.** At ×1 it is a 2-yd target from 137 yd: a sharp player's spread almost never finds it, so it would not be the hazard the real one is. ×2 is about the old ellipse's size (4.8 × 4.3), and still a pot beside a 27-yd green |
| The island's edge | the lidar: the edge 0.3 m below the green | a flat-topped plateau to the bulkhead | **Not exaggerated any more.** The old hole crowned a larger, ellipse island so that "just off" ran to the water. The real island is so small that "just off" is already 1–3 yd from the bulkhead: a shaky player now gets wet 38 % of the time in still air (19 % before) without a crown |
| Wind effect | strong, swirling | 3× the ball's normal wind response | With our drag model a 15 mph cross only moved a 137-yd iron about 2 yd; reading the wind has to matter |
| Green tier | none found in any source | 0.45-yd step | An arcade invention from the first build, still labelled as one. A low-sun photo would settle it |

**Realism bounds** (`node tests/tools/slope.js sawgrass-17`, `docs/maps/sawgrass-17-slope.png`): 0 / 77 / 2 / 21 % in the four bands.

| Bound | Default | This hole | Note |
|---|---|---|---|
| Falloff ring: surface steeper than 4 % | ≤ ~35 % | 21 %: ok | The ridge of the invented tier and the mound's slope into the notch |
| Top: 1–2.5 % of the non-steep surface | mostly (≥ half) | 98 %: ok | The lidar's 2.3 % plane |
| Flat pockets: surface under 1 % | 5–40 % | **0 % (WARN)** | Accepted: the lidar measures one plane of 2.3 % (1.7 % back, 1.5 % left) over the whole green; there are no flat pockets for it to find at 1 m. The old green had the same WARN on a 1.3 % plane |
| No full-green dome | not (> 60 % steeper than 2.5 % *and* slopes every which way) | 23 % steeper than 2.5 %, tilt coherence 0.98: ok | One tilted plane |

## 6. Validation

All in `tests/hole-checks.js` → `sawgrass-17`.

**Shots**:

| Shot | Expected | Result |
|---|---|---|
| Well-struck iron (0.1) | green within 8 yd | ✅ 5 yd |
| Carried 14 yd long | water | ✅ 15.4 yd (2026-10-24: 13 yd long now holds the back edge, 14.1 yd from the pin) |
| Bad miss right (0.6) | water | ✅ |
| Stock shot with a 17 mph following wind | barely further (+1.2 yd carry), 10° flatter (35° against 45°): rests on the green within 4 yd | ✅ 1.7 yd |
| Over-reading it: the arc on the island's front edge, (0, 126), same wind | rests short of the green, on the front fringe, 9+ yd | ✅ FRINGE 9.7 yd |
| The tailwind's real cost: the arc 12 yd long, same wind | water (+2.6 yd carry; in still air the same arc holds) | ✅ |
| Stock shot to a front pin into a 17 mph headwind | water | ✅ |
| Arc 12 yd past the pin, left of the pot bunker, (−2, 149), into that headwind | green within 6 yd | ✅ 4.5 yd |
| An arc three yards shorter straight over the pot bunker, aim (−5, 146) | rests in the sand | ✅ 5.2 yd |

**Strategies** (rates and gaps, as the baseline can show them):

| Decision | Plans | Must hold | Result (wet %, green %, expected score) |
|---|---|---|---|
| Reading a headwind (17 mph) | stock (arc at the pin) / read (arc 12 yd past it, at (−2, 149)) | stock wet > 50 % for a sharp player; read keeps a sharp player dry; read saves a sharp player more than a stroke and a shaky player something | stock: 100 % wet for both, 4.93 · read: sharp 0 % wet, 67 % green (29 % in the pot bunker) / 2.78, shaky 52 % wet / 3.93 · payoff of reading: sharp 2.15, shaky 1.00 |
| A following wind (17 mph): play it stock or over-read it | stock (arc at the pin) / over (arc on the island's front edge, (0, 126)) | over wet > 50 % for a sharp player; stock keeps a sharp player dry; stock saves a sharp player more than a stroke and a shaky player something | stock: sharp 0 % wet, 95 % green / 2.28, shaky 33 % / 3.37 · over: sharp 71 % wet, 0 % green / 4.44, shaky 90 % / 4.77 · payoff of playing it stock: sharp 2.16, shaky 1.40 |
| Skill in still air | at the pin | sharp never wet; shaky wet at least 1 in 7 | sharp 0 % (95 % green), shaky 38 % |

**Check-change log**

| Check | Was | Now | Why |
|---|---|---|---|
| Play the tailwind (shot and the `read` plan) | arc at (−4, 123) | arc at (0, 125), "on the island's front edge" | The tracing moved the island's front: (−4, 123) was dry on the old 38 × 31 ellipse (front at z 121.5) and is water on the real island, whose front at x −4 is the bunker mound's tip at z 127. The aim is still "land it short and let the wind carry it": the front edge of the real island. The outcome required (on the green) is unchanged |
| Arc 11 yd past the pin into the headwind (shot) | aim (−4, 148) | aim (−2, 148), "left of the pot bunker" | The tracing moved the pot bunker onto the line: it sits 6 yd short of the pin and 1.6 yd right of it, where the old one was 11 yd right. The old aim now lands on the mound and kicks into the sand (the next row). The outcome required (green within 6 yd) is unchanged |
| The same arc straight over the pot bunker (shot) | — | new: rests in the sand | What the bunker's real position does to the old line, kept as a check. It held only once the mound the lidar finds round the bunker was built: without it the ball stopped on the fringe, so the check was not tuned in, the mound was measured in |
| Carried long (shot), 2026-10-21, OpenFairway physics | 12 yd long, aim (−4, 149): water | 13 yd long, aim (−4, 150): water | An iron now lands at 47° and 26 yd/s (main: 24° and 44 yd/s, running 5 yd) and runs 2 yd after its pitch mark, not off the back: 12 yd long lands 3 yd short of the back edge on the line and stops a yard from it (GREENS, 14 yd from the pin). 13 yd long bounces over the bulkhead. **Knife edge**: the dry depth behind the pin is now 12 yd, not 11; one yard more of run would put 12 long back in the water |
| Stock shot in a 17 mph tailwind (shot), same day | flies the green into the water | barely flies further (+1.2 yd), lands flatter (35° against 45°), and still holds the green (≤ 4 yd) | Under OpenFairway's drag and lift a tailwind barely lengthens an iron (main: +9 yd, carry 146 and wet; the lift falls with airspeed; `windPush` 1 was set to match main's headwind loss, not its tailwind gain: PR #22). It also does not run further on this green: the flatter, faster landing keeps 0.5 yd of run against 2. Same pattern as St Andrews No. 17's tailwind check. 1.7 yd from the pin |
| Play the tailwind (shot), same day | arc on the island's front edge, (0, 125): finishes on the green | the same arc **over-reads** it: rests on the front fringe, 9+ yd away | With 1.2 yd of help, landing it on the front edge leaves it on the front edge (FRINGE 11.5 yd). Taking a club less downwind is now the mistake, not the read |
| The tailwind's cost at the back edge (shot), same day | — | new: the arc 12 yd long, with the tailwind, is wet | What a tailwind does now: +2.6 yd of carry at that length turns the still-air 12-long (dry, above) into water. **Knife edge**: 11 yd long with the tailwind holds (carry 150.5, stops 14 yd from the pin) |
| The same arc straight over the pot bunker (shot), same day | aim (−4, 148), "kicks into it" | aim (−5, 148), "comes down in it" | Into the headwind the ball now lands at 60°, so it does not kick: from (−4, 148) it pitched on the bunker's back lip (x −3.6, z 132.3; the sand ends at x −3.5) and stopped on the green 3.1 yd away. One yard right, straight over the bunker's middle, it lands in the sand (5.3 yd from the pin); (−5, 147) and (−4, 147) do too. The other side of the decision, (−2, 148) left of the bunker, is unchanged and passes (GREENS 2.6 yd) |
| Reading a following wind (strategy), same day | stock (ignore it) wet > 50 % sharp; read (arc on the front edge) dry and better by a stroke | **split in two.** "Reading a headwind": stock wet > 50 % sharp, read (arc 11 past, (−2, 148)) dry for a sharp player and better by more than a stroke (sharp) and something (shaky). "A following wind": the same three assertions with the plans reversed: over-reading wet > 50 %, stock dry and better | The old plans traded places: the stock shot is now dry for a sharp player (2.28) and the front-edge read is 71 % wet (4.44). The hole is still about reading the wind; under real flight the headwind is what has to be read (−18 yd: the stock shot never reaches the island), and a tailwind is what must not be over-read |
| **Carried long (shot), 2026-10-24, crater-wall bounce** | 13 yd long, aim (−4, 150): water | 14 yd long, aim (−4, 151): water | The iron lands at 47°, where the crater-wall law keeps less run than OpenFairway's did: 13 yd long now runs a yard and holds the back edge (14.1 yd from the pin). 14 yd long lands on the back of the green and runs off (15.4). Knife edge, as before, a yard further back |
| **Over-reading the tailwind (shot and the `over` plan), same day** | arc at (0, 125): front fringe, 9+ yd | arc at (0, 124.5): front fringe, 9+ yd (9.5) | Landing flatter downwind, the ball now keeps a little more run on the fringe and stopped 8.8 yd from the pin. Half a yard shorter is still the island's front edge (124 is wet). The strategy is unchanged in kind: over-reading is 76 % / 90 % wet, stock saves 2.05 / 1.36 strokes |
| **Reading a headwind (shot and the `read` plan), same day** | arc 11 yd past the pin, (−2, 148): green within 6 yd | arc 12 yd past, (−2, 149): green within 6 yd (4.5) | Into the wind the iron lands at 60° on the front fringe; on main it ran 2–3 yd up onto the green, now it checks where it lands (5.7 yd, fringe). A yard more arc lands it on the green. Strategy: read still keeps a sharp player dry (0 %, 43 % on the green, 2.91) and saves 2.02 / 0.94 strokes |
| **The pot-bunker arc (shot), same day** | "the same arc straight over the pot bunker", (−5, 148) | "an arc a yard shorter, straight over the pot bunker", (−5, 148) | The read moved to z 149, and at 149 the arc over the bunker carries it and holds the green (0.8 yd); only up to 148.5 does it come down in the sand. No one arc length now does both, so the bunker shot keeps its 11-yard arc and says so |
| **Over-reading the tailwind (shot and the `over` plan), 2026-10-24, slower spin decay** | arc at (0, 124.5): front fringe, 9+ yd | arc at (0, 126): front fringe, 9+ yd (9.7) | With spin decaying at 20 s in flight the downwind iron carries about a yard shorter at this length (123.8 against ~124.5) and the arc at 124.5 now pitches in the rough short of the fringe and runs back into the water (14.2 yd). The front edge is now the arc at 126. **Knife edge**: 125.5 is wet. The strategy still has over-reading a disaster for a sharp player |
| **The pot-bunker arc (shot), same day** | "an arc a yard shorter", (−5, 148): in the sand | "an arc three yards shorter", (−5, 146): in the sand (5.2 yd) | Into the headwind the iron now keeps its lift longer and carries ~1 yd further (133.6 at 148), over the bunker onto the fringe (2.6 yd). At (−5, 146) it pitches in the sand and stays; 146.5 lands on the lip and rolls in; 147 carries it. The read at (−2, 149) still finds the green (3.6 yd) |

**Visual checks**: `node tests/hole-map.js sawgrass-17`, `node tests/tools/slope.js sawgrass-17`, `python3 tests/tools/render.py sawgrass-17` (tee +185 px clear of the HUD, bird's-eye +29 px, approach +124 px; pin in view). The key shot by hand is not done: it needs a person with the game open.

## 7. Results

```
=== TPC Sawgrass (sawgrass-17) — Pure distance and direction control to an island green, with the wind as the hidden variable.
shot                                                                           before           after
a well-struck iron holds the green                                             GREENS 7y        GREENS 5y
a shot carried 12 yards long runs off the back of the island into the water    WATER 18y        WATER 17y
a bad miss right is wet                                                        WATER 22y        WATER 22y
ignore a 17 mph tailwind and the ball flies the green into the water           ROUGH 13y        WATER 15y
play the tailwind (arc on the island's front edge) and it finishes on the gre  GREENS 4y        GREENS 4y
into a 17 mph headwind, a stock shot to a front pin comes up short and wet     GREENS 7y        WATER 20y
into the same headwind, aiming the arc 11 yards past the pin, left of the pot  FRINGE 11y       GREENS 4y
the same arc straight over the pot bunker comes down short of the pin and kic  FRINGE 11y       SAND 5y

  strategy: reading a following wind
  plan       skill   before: wet green score   after: wet green score
  stock      sharp           0%  24% 3.19             95%   5% 4.85
  stock      shaky          10%  52% 3.30             67%  33% 4.31
  read       sharp           0%  95% 2.65              0%  86% 2.66
  read       shaky          52%  38% 3.90             48%  43% 3.80
  payoff of stock over read (strokes saved): sharp -0.54 → -2.19, shaky 0.60 → -0.51   (before → after)

  strategy: skill matters
  plan       skill   before: wet green score   after: wet green score
  pin        sharp           0% 100% 2.76              0%  95% 2.41
  pin        shaky          19%  71% 3.23             38%  57% 3.44
```

Expected strokes ("score") come from the baseline in `tests/hole-play.js`, including its recovery-difficulty term. "Before" is the hole as it stood at commit 548d49a: the same tee and pin, none of the iconic-hole features, play profile or hazards.

Against the hole before this tracing (the 38 × 31 ellipse island, `main` at `6f370c0`): reading the tailwind kept a sharp player 100 % on the green at 2.76 and now 86 % at 2.66 (the rest on the fringe or in the bunker, none wet); a shaky player's still-air wet rate doubled, 19 % → 38 %, the cost of the real island's size.

## 8. Visual review — does it look like the hole?

**Reference images** (none in the repo; the trace file records each by name, size, sha256 and source):

| View | What it shows | Source | Matched camera (`node tests/tools/trace.js sawgrass-17`) |
|---|---|---|---|
| `lidar` | Bare-earth heights every metre: the lake (hydro-flattened at −0.6 m), the island, its walkway, the tee strip, the mound round the pot bunker, the green's plane | USGS 3DEP 1 m, 2018–19, public domain; located by the project owner's pin | Georeferenced: the frame (`lidar.frame`) puts the pin at (−4, 137) and +z at 334.9° from grid north |
| `aerial` | The island from straight above, the walkway and both ponds, a grandstand | Supplied by the project owner | Straight down, placed by `lidar.py match`: the island outline fitted to the lidar's land by a similarity, IoU 0.905, 23.9 px per yd; 7 constraints, rms 0.1 px |
| `tee` | The island from behind the player | Image-search screenshot, supplied by the project owner | Held on the line 10 yd behind the tee at eye level; yaw 0.1°, 13.5° lens; 3 constraints, rms 8 px (heights of soft silhouettes); the spare one checks the direction, below |
| `yardage` | A schematic page with a compass | Supplied by the project owner | Not fitted: used for the direction (its compass puts tee → green at about 325–335°), the tee strips and the bunker's side |

How the references were used, and what each step rests on:

- **The lidar first** (`lidar.py look`, then `outlines`). The walkway runs west from the island. The tee is the east end of a long flat strip on the lake's south-south-east shore, 1.5 m up (about 2 m above the water), 104–132 m from the pin: the yardage book's strip of tees along the left shore, ending at its main tee. The other flat pads in range sit on the spectator mound at 6 m; the book's compass and the tee photo's low look over the water rule them out. Tee → pin is 125.3 m (137 yd) at 333.2°.
- **The bulkhead.** The 1 m grid smears a vertical bulkhead over a cell or two, so the island read at the water's level is too big (36.5 × 34 yd). The shoreline is taken at half the bulkhead's height (0.6 m above the water; the same at 0.8): 32.5 × 29 yd.
- **The aerial, matched to the lidar** (`lidar.py match`): the island traced off the photo (water against land), fitted to the lidar's land within 26 yd of the island by scale, rotation and shift. The best fit (IoU 0.905) puts the walkway back-left; the next (IoU 0.80, rotated 120°) puts it in front, where the lidar has water. At the smeared shoreline the photo came out 11 % too big; at half-height it gives the green 26.7 × 27.3 yd against the published 26 × 27. No flagstick, no assumed size.
- **The green and the bunker** traced on the aerial: the green by hand along the thin line inside the collar (contrast-boosted crop), the bunker by flood fill.
- **The tee photo checks the direction.** Its camera is held on the line 10 yd behind the tee at eye level (a long lens from 140 yd cannot place itself). The island's two ends fix its yaw and lens; the third point, the crest of the bunker's mound, is spare, and lands 2.5 px from where the traced, lidar-placed island puts it. Moving the camera off the line costs fit (the whole fit's rms, both photos): 4.4 px on it, 6.8 and 8.4 px at 12 yd either side (about 5° of bearing), 11.7 px at 24 yd; 3 or 25 yd further back changes nothing (4.5, 4.3). The nearest point of the bulkhead gave no left-right position (its top runs flat from u 150 to 1000), so it is not a constraint.

**Traced against the hole before this tracing** (`node tests/tools/trace.js sawgrass-17 --ref=6f370c0`):

```
outline      kind     width × depth yd   area yd²   centroid (x, z)    | game shape at 6f370c0: width × depth, area, centroid  overlap
island       island   34.0 × 33.2             690   (2.5, 139.7)    | (no such feature in the hole: a 38 × 31 yd ellipse island, 925 yd²)
green        green    26.7 × 27.3             463   (1.6, 139.7)    | 27.5 × 22.0, 484, (-4.0, 137.0)                 IoU 0.46
pot          bunker   4.2 × 4.0                13   (-5.6, 131.1)   | 4.8 × 4.3, 18, (-16.5, 129.0)                   IoU 0.00  exaggerated ×2 (as traced 2.1 × 2.0, 3 yd²)
```

The written sources had the green's size right (the old ellipse was 27.5 × 22 yd, from the 78 × 81 ft figure) but not its shape or place: the real green is a heart 5.6 yd further left, the island a quarter smaller, and the pot bunker 11 yd left of where it was, on the line to the pin.

**Renders**: `docs/maps/sawgrass-17-ref-aerial.png` and `docs/maps/sawgrass-17-ref-tee.png` (`python3 tests/tools/render.py sawgrass-17 ref --out docs/maps`), the outlines drawn on top. Side-by-sides with the photos are in `tests/tools/out/` when the photos are at hand.

**Sign-off checklist**

| Area | Item | Verdict | Evidence (render against photo) | Action / missing primitive |
|---|---|---|---|---|
| Tee placement and elevation | Tee position and line to the green | **matches** | The lidar's tee strip, the yardage book's compass, and the tee photo (rms 4.4 px on the line, worse either side) | — |
| | Elevation: tee, landing area, green | **matches** | The lidar at true scale: tee 0.67 yd above the pin, water 1.54 yd below it, bulkhead 1.3 yd | — |
| | Ground between | **matches** | Water from 13 yd off the tee to the island | — |
| Fairway and fairway bunkers | Fairway outline and width | **matches** | None | — |
| | Fairway bunkers | **matches** | None | — |
| | Rough, waste, paths | **close** | The walkway is there, back-left, to the shore; the photo's walkway is mown and turfed, the game's is rough | — |
| Green and greenside bunkers | Green outline and size | **matches** | Traced: the heart with its notch round the mound; 26.7 × 27.3 yd against the published 26 × 27 | — |
| | Green contours as seen | **close** on the plane; the tier **no reference** | The lidar's plane: 1.7 % back, 1.5 % left. The tier is an invention (§5) | A low-sun photo |
| | Greenside bunkers: count, place, shape | **matches**; size **differs on purpose** | One pot, front-right, traced; drawn ×2 (§5) | — |
| | Greenside bunkers: depth | **no reference** | 0.9 yd deep, 0.25 lip (shallower than the old 1.5 / 0.4: the value the hole was validated at, recorded here after the merge); no photo shows its depth | A photo from the green |
| | Collar, banks and falloffs | **close** | The mound round the bunker (lidar, tee photo); a collar ring and the bulkhead. The photo's collar is a narrow mown band | — |
| Surroundings and landmarks | Trees: kind and where | **differs: fix** (cosmetic) | Tall pines and live oaks behind the hospitality in the photo; the game's oaks, palms and pines in rectangles placed for the old layout | Tree `zone`s from the lidar's land; no live-oak type |
| | Water, cliffs, structures, backdrop | water **matches**; near shore **can't express yet**; grandstands **can't express yet** | The lake and both ponds from the lidar (render against aerial). The shore in front of the tee is a grass bank in the photo and a bulkhead in the game: a body has one `profile`. The grandstands, hospitality and the azalea bank behind are not there; the game's red-roofed clubhouse stands behind the island | A per-shore profile; the building prop of §3.1 row 4, as grandstands |
| | Landmarks a player would name | **matches** | The island, its bulkhead and the walkway | — |

**Signed off**: Claude (trace-first build: lidar, aerial, tee photo), 2026-10-20, branch `sawgrass-trace`. A person should look at the side-by-sides and play the tee shot before calling it done.

**Open items**, most important first:
1. The grandstands and hospitality round the hole: its look on television. Needs the building prop (§3.1 row 4).
2. A grass-bank shore in front of the tee: a lake with a bulkhead on some shores only.
3. The tier: confirm or remove it with a low-sun photo of the green.
4. Trees where the photo has them; the second pond the lidar finds behind and left (`water-2`), not built.
5. The pot bunker's real depth, and whether a ×1 bunker could matter with a ball model that holds a steep face (§3.1 row 5).
