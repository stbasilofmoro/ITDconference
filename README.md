# ITD at AREMA

Booth kiosk launchboard ("Have Some Fun At AREMA") and brand identity guide for International Tie Disposal.

- `launchboard/` — Vite + React Three Fiber app rendered through a broadcast-CRT tube shader
- `brand/` — brand identity guide (`brand/index.html`)
- `docs/superpowers/` — design spec and implementation plan

## Run locally

```bash
cd launchboard
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests
npx playwright install chromium && npm run e2e
```

Useful URL flags: `?debug` (tube tuning panel), `?gallery` (all illustrations), `?idle=5000` (idle timeout in ms), `?gameidle=10000`.

## Deploy on Netlify

For Netlify, import this repository: the root `netlify.toml` configures `launchboard/`, `npm run build`, `dist`, and root-relative assets. Local leaderboards require no server. Keep a stable site URL and browser profile to retain booth scores.

GitHub Actions runs unit tests and a production build. Netlify handles deployment; GitHub Pages does not need to be enabled.

## Booth setup

1. Open the deployed URL once while online (the service worker caches the app and fonts).
2. Launch Chrome in kiosk mode: `chrome --kiosk --autoplay-policy=no-user-gesture-required https://YOUR-SITE.netlify.app/`
3. Touch the screen once to enter fullscreen and keep the display awake.

After five minutes without interaction, the dashboard or any game returns directly to **Touch to play**. Each interaction restarts the timer.

Staff shortcuts: **Ctrl+Shift+Q** cycles the quality preset (Pro → Standard → Safe → Auto, remembered on this machine); **Ctrl+Shift+D** toggles the debug panel.

All six games include soft sound effects and an original lo-fi soundtrack. Audio starts after a tap or keypress. Use **Sound** at the bottom center to mute or adjust music and effects separately; settings stay on this device. The idle screen and hidden tabs stay quiet. See [`launchboard/AUDIO.md`](launchboard/AUDIO.md).

## Mobile

Open the same deployed site in your phone's browser, including Safari on iPhone or Chrome on Android. Phones automatically get a portrait-friendly welcome screen and game picker. Choose a game, then turn the phone sideways to play. Turning upright holds gameplay; Convention Hall and Jumper also offer a Resume button when you turn back.

The phone view uses gesture controls with the gameplay buttons hidden, cropped game views, and a clear display without the booth's CRT bezel or effects. A small Menu opens options; Carbon Rails keeps card and route choices behind Routes & cards. All six games, music, prize forms, local high scores, and the five-minute idle reset remain available. Scores stay in the browser on that device.

No separate app download is needed. See [`launchboard/MOBILE.md`](launchboard/MOBILE.md) for controls and validation.

## Configure

Edit `launchboard/src/config.ts`: `boothNumber`, `tickerLines`, `subcopy`, idle timeouts, `defaultQuality`.

`ATTRACT_PRIZE` in the same file controls the touch-to-play screen's top-three maple syrup promotion. The attract scene includes a rotary kiln with a rotating drum and rollers, tumbling pink charge, feed hopper, exhaust stack, and cyclone bank modeled from the supplied reference.

## Add a game

The first tile now launches **Beaver Crossing**, a five-level journey from the railroad yard to the steel plant. Complete all five levels to open the maple syrup prize form. Controls, level details, Formspree setup, and verification are documented in [`launchboard/BEAVER-CROSSING.md`](launchboard/BEAVER-CROSSING.md).

The second tile launches **Carbon Sort**, a falling-pair recycling puzzle with railroad ties, biocarbon bags, and scrap metal. Match four to recycle material, build chains, and lower the game emissions index across three rounds. See [`launchboard/CARBON-SORT.md`](launchboard/CARBON-SORT.md) for rules and controls.

The third tile launches **Kiln Keeper**. Adjust a wood conveyor to keep a rotary kiln between 700–850°C for a 90-second shift, responding to changing loads and draft. Includes a live graph, delayed heat response, cold failures, and an animated overheat rupture. See [`launchboard/KILN-KEEPER.md`](launchboard/KILN-KEEPER.md) for rules and controls.

The fourth tile launches **Carbon Rails**, a globe railway game against a computer opponent. Connect biocarbon plants while the computer connects its smoky cogen plants. Real continent geography, land-only routes, cards, tickets, and final-round play are described in [`launchboard/CARBON-RAILS.md`](launchboard/CARBON-RAILS.md).

The fifth tile launches **Convention Hall**, a first-person badge-scanning scavenger hunt through 20 fictional railroad exhibitors. Follow company clues, scan attendees green, and stop bad-breath vendors. See [`launchboard/CONVENTION-HALL.md`](launchboard/CONVENTION-HALL.md).

The sixth tile launches **Jumper 3: The Legend of Atom**, a three-chapter platformer starring Atom the beaver. Recover the stolen ignition seals from the hooded Order of the Hollow Ember using hardhat armor, bouncing sparks, and an Atom Core shield. Keyboard, controller, and simultaneous touch controls are included. See [`launchboard/JUMPER-3.md`](launchboard/JUMPER-3.md).

All six games have local high-score leaderboards connected to first-and-last-name forms. Open **High scores** from the launchboard. Scores persist in the same browser and site origin; they do not sync across devices. See [`launchboard/LEADERBOARDS.md`](launchboard/LEADERBOARDS.md).

Prize submissions use the configured ITD Formspree form by default. To override it locally, set `VITE_FORMSPREE_ENDPOINT` in `launchboard/.env.local`; for Netlify, set the site environment variable of the same name. The form confirms receipt only after Formspree accepts the submission.

The board's grid is fixed at six tiles, all now playable. To add another game, replace an existing entry in `launchboard/src/games/registry.ts` or expand the grid and its layout together. Each game uses `status: 'playable'` with a lazy `load` function. Its component receives `{ ctx }` (`exit()`, `input.subscribe()`, `tube.pulse()`, `quality`) and renders R3F content in the centered 1920 x 1080 content scene.

CI runs the test suite (`npm test`, see `.github/workflows/deploy.yml`), and `tests/registry.test.ts` asserts specifics of the six playable entries (illustrations, titles, count) — update that test to match whichever slot you replaced, or the build will fail.

## Fonts

DINPro is ITD's licensed typeface and is not in this repo. The app ships Barlow (SIL Open Font License, see `launchboard/public/fonts/OFL.txt`).
