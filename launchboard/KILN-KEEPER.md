# Kiln Keeper

The third launchboard tile opens a 90-second rotary-kiln control game. Keep the temperature inside **700–850°C**, the range requested for this game. These are arcade rules and the simulation is not an operating model for industrial equipment.

## How it plays

Adjust the conveyor speed or drop extra wood into the kiln. Wood takes time to travel and burn, so temperature continues responding after a speed change. Stopping the belt does not remove fuel already inside. Wetter loads, dry wood, dense wood, and changing draft alter the heat balance throughout the shift; watch the temperature and its trend rather than leaving the belt at one setting.

The graph shows the last 30 seconds, with the target band shaded. Above 850°C a warning counts toward a kiln rupture; below 700°C it counts toward a cold batch failure. Five seconds outside the range causes failure. Returning inside the band gradually clears accumulated warning time. Overheating animates the drum breaking apart before showing the result.

Survive 90 seconds to complete the batch. Results show time in range and wood fed. Every result offers a fresh run or a return to the launchboard.

## Controls

| Action | Keyboard / controller | Touch / mouse |
| --- | --- | --- |
| Adjust conveyor | Arrows / D-pad | Drag speed slider or tap Slower / Faster |
| Drop extra wood | Enter, Space / A | Drop wood |
| Stop conveyor | X | Stop feed |
| Pause | P | Pause |
| Start, resume, retry | Enter, Space / A | On-screen button |
| Exit | Escape / B | Exit or Launchboard |

Pausing freezes fuel, wood, temperature, and the timer. Hiding the browser tab automatically pauses the run.

## Implementation and verification

- `src/games/kiln-keeper/engine.ts`: fixed-step simulation, delayed fuel response, changing conditions, warning recovery, and results. `SAFE_MIN` and `SAFE_MAX` configure the target band.
- `KilnKeeper.tsx`: shared kiosk input, touch slider, HUD, graph, and result screens.
- `KilnScene.tsx` and `src/illustrations/RotaryKiln.tsx`: code-native industrial models, conveyor, falling wood, exhaust, and rupture animation in the existing ITD style.
- Unit tests cover both failures, recovery, paused state, thermal delay, fixed-step consistency, and a full successful run controlled only by temperature and trend. Fixed conveyor settings are checked to ensure they cannot complete the shift unattended.
- Browser tests cover the third tile, slider dragging, wood drops, keyboard controls, pause, exit, both failure flows, and completion/replay.

The development-only `?e2e` state hook is removed from production builds. The game uses the existing offline cache and requires no external artwork. Results offer the local leaderboard and name form; see [LEADERBOARDS.md](LEADERBOARDS.md).
