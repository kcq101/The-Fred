# Iconic hole spec: <Course> No. <n>

Copy this file to `docs/holes/<id>.md` (id = `course-number`, e.g. `oldcourse-17`) and fill it in before touching code.
Sections 1–3 are research and analysis; 4–5 are the design; 6 is the contract the hole must pass. See `docs/ICONIC-HOLES.md` for the workflow and the feature catalogue.

## 1. Inspiration

| | |
|---|---|
| Real hole | Course, hole number, nickname |
| Par / yardage (real) | |
| Par / yardage (game) | Game yardage is the straight line tee → pin. Our clubs carry 245 / 215 / 155 / 90 and a pure driver totals ~286 on flat fairway, so real yardages usually need scaling. |
| Sources | Links you actually read |

## 2. What makes it iconic

- **Signature features** (what people picture): …
- **The strategic problem in one sentence** (what people *talk about*): …
- **Where scores are made and lost**: which shot, which miss.

## 3. Analysis — the challenge archetypes

Tick every one that applies and say which shot it affects. The primary one is what the hole is "about"; protect it above everything else.

| Archetype | Applies? | Which shot | Notes |
|---|---|---|---|
| Distance control / run-out (ground ends, hazard through the fairway) | | | |
| Forced carry (water, chasm, ravine) | | | |
| Dogleg / corner to cut | | | |
| Elevation change (uphill/downhill shot) | | | |
| Sloping lies (ball above/below feet, up/downhill) | | | |
| Narrow landing zone | | | |
| Deep or pot bunkers | | | |
| Green contours (tiers, false front, tilt) | | | |
| Penal surrounds (water/bank feeding hazards, island) | | | |
| Wind exposure | | | |
| Risk/reward split (aggressive vs safe line) | | | |
| Firm/fast turf (links) or fast greens | | | |

## 4. Translation — real feature → game mechanic

One row per signature feature. Use only catalogue primitives and shared systems (ICONIC-HOLES.md §2). If something cannot be expressed, write it under **Capability gaps** instead of hacking it in.

| Real feature | Game expression | Parameters | What it does to play |
|---|---|---|---|
| | `ramp` / `rise` / `tilt` / `step` / `hollow` / `cover` / water body / bunker / play profile / stance | | |

**Capability gaps** (features we cannot express yet, and the primitive that would cover them):

## 5. Exaggeration

What is amplified for arcade play, by how much, and why the hole is still recognizably itself. Also list what is simplified or left out.

| Characteristic | Real | Game | Why this amount |
|---|---|---|---|

## 6. Validation — the contract

Written into `tests/hole-checks.js` under the hole's id; `node --test tests/holes.test.js` must pass.

**Shots** (single swings with a required outcome):

| Shot | Expected |
|---|---|

**Strategies** (two or more ways to play one moment, each played by a *sharp* player — needle within ±0.2 — and a *shaky* one — within ±0.55):

| Decision | Plans | Must hold |
|---|---|---|

**Visual checks**: `node tests/hole-map.js <id>` (top-down map with the check shots traced) and the in-game tee, bird's-eye and key-shot views.

## 7. Results

Paste the hole's section of `node tests/hole-report.js` (before → after), plus anything learned while tuning.
