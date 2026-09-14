# Carbon Sort

The second launchboard tile is a falling-pair recycling puzzle. It uses original ITD-style material models: orange railroad ties, white bags of dark biocarbon with a green label, and matte grey scrap metal.

## Rules

Rotate and place linked pairs in an 8-column, 14-row recovery chamber. Match at least four of the same material horizontally or vertically. Marked stock (dark striped corners) stays fixed until recycled; other pieces fall under gravity. Intact pairs stay linked, and clearing one half releases its partner. Falling pieces can create chain reactions that multiply the score.

Clear all marked stock to finish a round. Three rounds contain 9, 12, and 18 stock items with gradually faster automatic drops. The next pair and a landing outline help players plan. A blocked entrance ends the run; replay starts a fresh game. The opening pair can be dropped immediately to demonstrate a match.

The emissions index is an illustrative game measure: the percentage of marked stock remaining in the current round. It is explicitly not measured CO2 savings. Recovering material lowers this index to zero. Score: 10 points per matched piece plus 100 per marked stock item, multiplied by the current chain number.

## Controls

- Left/right arrows or controller directions: move the pair.
- Up, Enter, Space, or controller A: rotate clockwise. On an intro/result screen, continue.
- Down: move down one row.
- X or the Drop button: land and lock immediately.
- P or Pause: pause/resume. Hiding the browser tab also pauses the game.
- Escape, controller B, or Exit: return to the launchboard.
- On-screen Move, Rotate, Lower, and Drop controls support the touch kiosk.

The game inherits the shared CRT renderer, idle exit, error recovery, and offline cache. Results offer the first-and-last-name score form and local leaderboard; see [LEADERBOARDS.md](LEADERBOARDS.md).

## Verification

`npm test -- tests/carbon-sort.test.ts` covers line detection, seeded rounds, wall/floor rotations, collisions, lock delay, linked gravity, splitting, cascades, score, pause, top out, and progression.

`npm run e2e -- e2e/carbon-sort.spec.ts` covers the second launchboard tile, an actual match via touch, simulated gamepad rotation, keyboard movement, pause, exit, round completion, top out, and replay. Development-only `?e2e` hooks provide controlled board fixtures; they are absent from production builds.
