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

## Booth setup

1. Open the deployed URL once while online so the offline cache fills.
2. Launch Chrome in kiosk mode: `chrome --kiosk --autoplay-policy=no-user-gesture-required https://stbasilofmoro.github.io/ITDconference/`
3. Touch the screen once to enter fullscreen and keep the display awake.

Staff shortcuts: **Ctrl+Shift+Q** cycles the quality preset (Pro → Standard → Safe → Auto, remembered on this machine); **Ctrl+Shift+D** toggles the debug panel.

## Configure

Edit `launchboard/src/config.ts`: `boothNumber`, `tickerLines`, `subcopy`, idle timeouts, `defaultQuality`.

## Add a game

Add an entry to `BASE_GAMES` in `launchboard/src/games/registry.ts` with `status: 'playable'` and a `load: () => import('./my-game/MyGame')`. The component receives `{ ctx }` (`exit()`, `input.subscribe()`, `tube.pulse()`, `quality`) and renders R3F content in the 1920×1080 centered content scene.

## Fonts

DINPro is ITD's licensed typeface and is not in this repo. The app ships Barlow (SIL Open Font License, see `launchboard/public/fonts/OFL.txt`).
