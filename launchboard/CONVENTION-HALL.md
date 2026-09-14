# Convention Hall

The fifth launchboard tile is a first-person badge-scanning scavenger hunt. Its perspective scene is rendered inside the existing CRT display, with the app's muted industrial palette, geometric equipment, and Barlow typography.

## Play

Find five company contacts within three minutes. Each clue describes a railroad specialty and an emblem. Match that emblem to a booth sign or attendee badge, aim at the lanyard, and scan. The scan reveals the attendee's name and employer and turns them green. The next outstanding clue appears automatically; finding a later contact early also counts.

Twenty fictional railroad exhibitors have original geometric logos. Their booth assignments and the five target companies shuffle on every run. Each aisle row contains a target; the first contact greets the player in the entrance aisle. Equipment includes timber ties, biocarbon bags, wheelsets, and industrial machinery. Numbered booths and equipment block movement and scanning sightlines.

Six pushy vendors approach nearby players. An open mouth and “BAD BREATH!” warning precede a visible breath cloud. Dodge the cloud or scan the vendor: scanning stops their attacks and clears their existing clouds. Each hit removes one of four fresh-air bars, with a brief recovery interval before another hit can count. Empty fresh air or an expired clock ends the run.

These are fictional attendees and simulated badges; the game does not read real badges or use a camera.

## Controls

| Input | Action |
| --- | --- |
| W / S | Walk forward / backward |
| A / D | Strafe left / right |
| Left / right arrows or Q / E | Turn |
| Up / down arrows | Walk forward / backward |
| Drag the view | Look horizontally and vertically |
| Click the view, Space, or Enter | Scan |
| Touch buttons | Hold to walk or turn; tap Scan |
| Controller left stick | Move |
| Controller right stick | Look |
| Controller A | Scan / start / resume |
| P or Pause button | Pause / resume |
| Escape, controller B, or Exit | Return to the launchboard |

Losing browser focus pauses the game. Pausing stops the clock, movement, vendors, and clouds. Replaying creates new booth assignments and a new score run.

## Scores

Each clue contact earns 500 points, each pushy vendor 100, and each other attendee 25. Repeated scans never earn additional points. Finding all five contacts adds `floor(seconds remaining × 10) + fresh-air percentage × 5`.

Win and loss screens both offer **Save score / Leaderboard**, using the existing first-and-last-name form and local top-ten rankings. The form saves locally, then sends a copy to the configured Formspree endpoint. See [LEADERBOARDS.md](LEADERBOARDS.md) for persistence and offline details.

## Implementation and checks

`src/games/convention-hall/engine.ts` contains the fixed-step simulation, collision checks, badge targeting, attacks, clues, and scoring. `companies.ts` defines the fictional roster; `logos.ts` draws a bounded cache of 60 local textures. `HallScene.tsx` renders the perspective hall into a framebuffer displayed in the shared content scene. `ConventionHall.tsx` provides controls and the HUD.

Unit tests cover target selection, unique companies, reachability, blocked scans and walking, attack warnings and damage, scan neutralization, duplicate prevention, winning, failure, and pause. Browser tests exercise the fifth tile, keyboard, view dragging, held touch buttons, controller input, scanning, vendor attacks, replay, and the complete five-contact score submission with a mocked Formspree response.

With the development-only `?e2e` flag, `window.__conventionHall` exposes state inspection and fixture setup. The game hook is stripped from production builds. Logos and equipment are generated locally; no remote image or model service is required for play.
