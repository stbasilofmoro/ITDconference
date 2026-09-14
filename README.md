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

## One-time GitHub setup

For Netlify, import this repository: the root `netlify.toml` configures `launchboard/`, `npm run build`, `dist`, and root-relative assets. Local leaderboards require no server. Keep a stable site URL and browser profile to retain booth scores.

Before the first deploy, in the repo's **Settings → Pages**, set **Source: GitHub Actions** (the `deploy.yml` workflow publishes there; it won't have anywhere to publish to until this is set once).

## Booth setup

1. Open the deployed URL once while online (the service worker caches the app and fonts).
2. Launch Chrome in kiosk mode: `chrome --kiosk --autoplay-policy=no-user-gesture-required https://stbasilofmoro.github.io/ITDconference/`
3. Touch the screen once to enter fullscreen and keep the display awake.

Staff shortcuts: **Ctrl+Shift+Q** cycles the quality preset (Pro → Standard → Safe → Auto, remembered on this machine); **Ctrl+Shift+D** toggles the debug panel.

## Configure

Edit `launchboard/src/config.ts`: `boothNumber`, `tickerLines`, `subcopy`, idle timeouts, `defaultQuality`.

## Add a game

The first tile now launches **Beaver Crossing**, a five-level journey from the railroad yard to the steel plant. Complete all five levels to open the maple syrup prize form. Controls, level details, Formspree setup, and verification are documented in [`launchboard/BEAVER-CROSSING.md`](launchboard/BEAVER-CROSSING.md).

The second tile launches **Carbon Sort**, a falling-pair recycling puzzle with railroad ties, biocarbon bags, and scrap metal. Match four to recycle material, build chains, and lower the game emissions index across three rounds. See [`launchboard/CARBON-SORT.md`](launchboard/CARBON-SORT.md) for rules and controls.

The third tile launches **Kiln Keeper**. Adjust a wood conveyor to keep a rotary kiln between 700–850°C for a 90-second shift, responding to changing loads and draft. Includes a live graph, delayed heat response, cold failures, and an animated overheat rupture. See [`launchboard/KILN-KEEPER.md`](launchboard/KILN-KEEPER.md) for rules and controls.

The fourth tile launches **Carbon Rails**, a globe railway game against a computer opponent. Connect biocarbon plants while the computer connects its smoky cogen plants. Real continent geography, land-only routes, cards, tickets, and final-round play are described in [`launchboard/CARBON-RAILS.md`](launchboard/CARBON-RAILS.md).

All four games now have local high-score leaderboards connected to first-and-last-name forms. Open **High scores** from the launchboard. Scores persist in the same browser and site origin; they do not sync across devices. See [`launchboard/LEADERBOARDS.md`](launchboard/LEADERBOARDS.md).

Prize submissions use the configured ITD Formspree form by default. To override it locally, set `VITE_FORMSPREE_ENDPOINT` in `launchboard/.env.local`; for GitHub Pages, set the repository Actions variable of the same name. The form confirms receipt only after Formspree accepts the submission.

The board's grid is fixed at 6 tiles: `BASE_GAMES` in `launchboard/src/games/registry.ts` always has exactly `GRID_COUNT` (6) entries, so adding a game means replacing one of the existing `soon(...)` "Coming soon..." slots rather than appending a 7th. Change that slot to `status: 'playable'` with a `load: () => import('./my-game/MyGame')`. The component receives `{ ctx }` (`exit()`, `input.subscribe()`, `tube.pulse()`, `quality`) and renders R3F content in the 1920×1080 centered content scene.

CI runs the test suite (`npm test`, see `.github/workflows/deploy.yml`), and `tests/registry.test.ts` asserts specifics of the current placeholder slots (illustrations, titles, count) — update that test to match whichever slot you replaced, or the build will fail.

## Fonts

DINPro is ITD's licensed typeface and is not in this repo. The app ships Barlow (SIL Open Font License, see `launchboard/public/fonts/OFL.txt`).
