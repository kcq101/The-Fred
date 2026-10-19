// Each hole's intended challenge, written as shots a player could hit. holes.test.js runs every one through the game's real
// terrain, swing, stance and ball physics; hole-report.js runs the same shots on an older version to show what changed.
//
// shots:      one swing each, with the outcome the design calls for.  expect: { end: 'water'|'rest'|..., surf: [...], maxToPin, minToPin }
// strategies: two or more ways to play the same moment. Each plan is played by two skill levels:
//               sharp = needles evenly over ±0.2 of center,  shaky = over ±0.55
//             r[plan][skill] = { hazard: share in water/OB, toPin: mean yards left (dry balls), score: expected strokes for the hole, surfs }
//             `expect` lists [description, test] pairs; each must hold.
// Shot fields are documented in hole-play.js. Coordinates are yards: tee at the origin, the hole plays toward +z, screen-left is +x.
module.exports = {
  'pebble-8': {
    challenge: 'Distance control off the tee (the plateau ends at a cliff), then a forced carry over an ocean chasm to a small, back-to-front green.',
    shots: [
      { name: 'a pure driver runs off the end of the plateau into the chasm', shot: { club: 'Hammer', at: [-5, 250], power: 1 }, expect: { end: 'water' } },
      { name: 'even a 90% driver still finds the chasm', shot: { club: 'Hammer', at: [-5, 250], power: 0.9 }, expect: { end: 'water' } },
      { name: 'a pure 3-wood stops on the plateau, short of the cliff', shot: { club: '3-Wood', at: [-5, 250], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'] } },
      { name: 'from there a well-struck iron carries the chasm and holds the green', shot: { from: [-5, 247], club: 'Iron', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 8 } },
      { name: 'a chunked approach comes up short in the chasm', shot: { from: [-5, 247], club: 'Iron', offset: 0.7 }, expect: { end: 'water' } },
      { name: 'a ball short-right on the shaved bank feeds back down to the sea', shot: { from: [-5, 247], club: 'Iron', offset: 0.55 }, expect: { end: 'water' } },
      { name: 'the bail-out left, around the head of the cove, stays dry', shot: { from: [-5, 247], club: 'Iron', at: [10, 356], offset: 0.5 }, expect: { end: 'rest' } },
    ],
    strategies: [
      { name: 'tee club', plans: [
          { name: 'driver', shot: { club: 'Hammer', at: [-5, 250], power: 1 } },
          { name: '3-wood', shot: { club: '3-Wood', at: [-5, 250], power: 1 } },
          { name: 'iron', shot: { club: 'Iron', at: [-5, 250], power: 1 } } ],
        expect: [
          ['driver is wet more often than not, for any player', r => r.driver.sharp.hazard > 0.5 && r.driver.shaky.hazard > 0.3],
          ['the 3-wood is the play: dry and the best score for both players', r => r['3-wood'].sharp.hazard === 0 && r['3-wood'].sharp.score < r.driver.sharp.score && r['3-wood'].sharp.score < r.iron.sharp.score && r['3-wood'].shaky.score < r.driver.shaky.score],
          ['laying back with an iron is safe but leaves a long approach', r => r.iron.sharp.toPin > r['3-wood'].sharp.toPin + 60] ] },
      { name: 'approach line', plans: [
          { name: 'pin', shot: { from: [-5, 247], club: 'Iron' } },
          { name: 'bail', shot: { from: [-5, 247], club: 'Iron', at: [10, 356] } } ],
        expect: [
          ['going at the pin risks the chasm for a shaky player', r => r.pin.shaky.hazard > 0.05 && r.bail.shaky.hazard === 0],
          ['a sharp player hits the green every time', r => r.pin.sharp.hazard === 0 && r.pin.sharp.surfs.GREENS === r.pin.sharp.n],
          ['the bail-out is dry but costs strokes', r => r.bail.sharp.score > r.pin.sharp.score + 0.5] ] },
    ],
  },

  'augusta-13': {
    challenge: 'Dogleg left: a drive that finds the valley leaves a reachable second, but from a ball-above-the-feet lie that hooks toward the creek in front of a green perched on a shaved bank. Go for it, or lay up.',
    shots: [
      { name: 'a pure drive tumbles down the valley and runs out past 320', shot: { club: 'Hammer', at: [12, 260], power: 1 }, expect: { end: 'rest', surf: ['FAIRWAY'], maxToPin: 250 } },
      { name: 'a drawn drive catches the slope and runs even further', shot: { club: 'Hammer', at: [3, 260], power: 1, offset: -0.3 }, expect: { end: 'rest', maxToPin: 235 } },
      { name: 'the second shot is played with the ball above the feet', shot: { from: [22, 334], club: '3-Wood', at: [62, 575] }, expect: { stance: 'BALL ABOVE FEET · HOOKS' } },
      { name: 'aimed straight at the pin, the hanging lie hooks a pure 3-wood left of the green', shot: { from: [22, 334], club: '3-Wood' }, expect: { minToPin: 18 } },
      { name: 'aimed right to allow for the hook, a pure 3-wood reaches the putting surface', shot: { from: [22, 334], club: '3-Wood', at: [62, 575] }, expect: { end: 'rest', surf: ['GREENS', 'FRINGE'] } },
      { name: 'a slightly thin 3-wood lands on the shaved bank and rolls back into the creek', shot: { from: [22, 334], club: '3-Wood', at: [62, 575], offset: 0.2 }, expect: { end: 'water' } },
      { name: 'the lay-up leaves a flat wedge that a decent swing puts on the green', shot: { from: [50, 500], club: 'Wedge', offset: 0.35 }, expect: { surf: ['GREENS'] } },
      { name: 'a ball that runs off the front of the green feeds into the creek', shot: { from: [50, 500], club: 'Wedge', at: [64, 552] }, expect: { end: 'water' } },
    ],
    strategies: [
      { name: 'the momentous decision (second shot from the valley)', plans: [
          { name: 'go', shot: { from: [22, 334], club: '3-Wood', at: [62, 575] } },
          { name: 'layup', shot: { from: [22, 334], club: 'Iron', at: [40, 500] } } ],
        expect: [
          ['going for it brings the creek into play', r => r.go.shaky.hazard > 0.15 && r.layup.shaky.hazard === 0],
          ['for a sharp player, going for it is worth it', r => r.go.sharp.score < r.layup.sharp.score],
          ['for a shaky player, laying up is the better play', r => r.layup.shaky.score < r.go.shaky.score] ] },
    ],
  },

  'sawgrass-17': {
    challenge: 'Pure distance and direction control to an island green, with the wind as the hidden variable.',
    shots: [
      { name: 'a well-struck iron holds the green', shot: { club: 'Iron', offset: 0.1 }, expect: { surf: ['GREENS'], maxToPin: 8 } },
      { name: 'a shot carried 12 yards long runs off the back of the island into the water', shot: { club: 'Iron', at: [-4, 149] }, expect: { end: 'water' } },
      { name: 'a bad miss right is wet', shot: { club: 'Iron', offset: 0.6 }, expect: { end: 'water' } },
      { name: 'ignore a 17 mph tailwind and the ball flies the green into the water', shot: { club: 'Iron', wind: { mph: 17, dir: 'tail' } }, expect: { end: 'water' } },
      { name: 'play the tailwind (land it short) and it finishes on the green', shot: { club: 'Iron', at: [-4, 123], wind: { mph: 17, dir: 'tail' } }, expect: { surf: ['GREENS'] } },
      { name: 'into a 17 mph headwind, a stock shot to a front pin comes up short and wet', shot: { club: 'Iron', at: [-4, 129], wind: { mph: 17, dir: 'head' } }, expect: { end: 'water' } },
      { name: 'into the same headwind, aiming the arc 11 yards past the pin finds the green', shot: { club: 'Iron', at: [-4, 148], wind: { mph: 17, dir: 'head' } }, expect: { surf: ['GREENS'], maxToPin: 6 } },
    ],
    strategies: [
      { name: 'reading a following wind', plans: [
          { name: 'stock', shot: { club: 'Iron', wind: { mph: 17, dir: 'tail' } } },
          { name: 'read', shot: { club: 'Iron', at: [-4, 123], wind: { mph: 17, dir: 'tail' } } } ],
        expect: [
          ['ignoring the wind is a disaster even for a sharp player', r => r.stock.sharp.hazard > 0.5],
          ['reading the wind keeps a sharp player dry', r => r.read.sharp.hazard === 0],
          ['and saves strokes for everyone', r => r.read.sharp.score < r.stock.sharp.score - 1 && r.read.shaky.score < r.stock.shaky.score] ] },
      { name: 'skill matters', plans: [ { name: 'pin', shot: { club: 'Iron' } } ],
        expect: [
          ['a sharp player always finds the island in still air', r => r.pin.sharp.hazard === 0],
          ['a shaky player gets wet at least one time in seven', r => r.pin.shaky.hazard > 1 / 7] ] },
    ],
  },
};
