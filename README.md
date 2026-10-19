# The Fred

Arcade golf in a comic-book style. Pull back from the ball to set power, release when the swinging needle is as close to the middle of the rainbow as you can get it, and pull down-left or down-right to shape a draw or fade.

Three holes: Pebble Beach (par 4), Augusta National (par 5) and TPC Sawgrass (par 3).

## Run it

It's one HTML page with no build step. Open `index.html` through any static server (for example `python3 -m http.server`), or turn on GitHub Pages for this repo.

## Files

- `index.html` — the whole game (three.js r128 from cdnjs)
- `title/fred.jpg` — title screen art
- `cards/` — hole cards
- `music/` — soundtrack, played in a shuffled order: Midnight Heat, Neon Fairway, Heat of the City, Skyline Swing

## How a swing is scored

Pull back to set power; the needle then sets contact quality. The meter is a slightly see-through rainbow arc lying on the grass around the ball, with a slim translucent blue arrow swinging from the ball across it. It has no hard zones: dead center (blue) is the cleanest strike, and every bit further out costs a little more distance *and* direction. The red ends are a CHUNK (the worst contact: roughly a quarter to over a third of the carry lost, plus a big miss).
Longer clubs are less forgiving than shorter ones. The only luck is a very small constant jitter that does not grow when you mistime. The numbers live in `SwingModel` (`index.html`) and the `dev` / `curve` / `mishit` values on each club.

## Tests

`node --test` and `node tests/swing-report.js`. See `tests/README.md` for what they do and do not cover.

## Controls

- **SFX** and **Music** toggles are separate (top-right in game, and on the title menu). The music setting is remembered.
- Drag the yellow ring to aim, pinch or scroll to zoom, number keys 1–5 pick clubs, Esc closes the menu.
