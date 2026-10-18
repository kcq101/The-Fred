# The Fred

Arcade golf in a comic-book style. Pull back from the ball to set power, release when the swinging needle is in the blue, and pull down-left or down-right to shape a draw or fade.

Three holes: Pebble Beach (par 4), Augusta National (par 5) and TPC Sawgrass (par 3).

## Run it

It's one HTML page with no build step. Open `index.html` through any static server (for example `python3 -m http.server`), or turn on GitHub Pages for this repo.

## Files

- `index.html` — the whole game (three.js r128 from cdnjs)
- `title/fred.jpg` — title screen art
- `cards/` — hole cards
- `music/` — soundtrack, played in a shuffled order: Midnight Heat, Neon Fairway, Heat of the City, Skyline Swing

## Controls

- **SFX** and **Music** toggles are separate (top-right in game, and on the title menu). The music setting is remembered.
- Drag the yellow ring to aim, pinch or scroll to zoom, number keys 1–5 pick clubs, Esc closes the menu.
