# Beaver Crossing

The first launchboard tile is a five-level, original beaver crossing game. Carbon Sort, Kiln Keeper, and Carbon Rails occupy the next three tiles; two slots remain available for future games.

## Play

- Arrow keys, controller D-pad / left-stick presses, or the on-screen arrows: hop one cell.
- Enter / Space / controller A: start, hop forward, retry, or continue.
- Escape / controller B / the Exit button: return to the launchboard.
- Reach the green row to complete a level. A collision restarts only the current level, with unlimited retries.
- The maple syrup prize opens only after level five. The form clears on success, exit, or the kiosk's existing idle reset.

## The five stages

1. Railroad yard: passing gondolas, moving tie gangs, animated tie removal and throws. Striped landing zones warn before impact.
2. Unloading yard: loaded gondolas, grapple trucks swinging tie bundles, loaders, trucks, and stockpiles.
3. Carbon production: animated shredder, chip conveyors, two rotating long kilns, loaders, workers, and timed exhaust. Pink stripes warn before heat becomes dangerous.
4. Shipping yard: bags of carbon, forklifts, trucks, trains, and workers.
5. Steel plant: carbon bags and coke feed a mixer and furnace conveyor, with carriers, workers, and exhaust to cross.

## Connect Formspree

The prize form defaults to `https://formspree.io/f/mrpzlqab` in local development and production builds. No additional environment setup is needed.

To use a different form, override the public endpoint in `launchboard/.env.local`:

```
VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/YOUR_FORM_ID
```

Use the real form ID from the Formspree dashboard and restart Vite. For a GitHub Pages override, set the repository Actions variable `VITE_FORMSPREE_ENDPOINT` and rebuild. An unset or empty variable uses the default ITD form. This endpoint is public; no API key is required or included in the client.

The form submits first and last name, company, phone, address, score, game name, levels completed, and stable claim/run identifiers using JSON over HTTPS. Only names and score data are saved to the local leaderboard; company, phone, and address are not persisted on the kiosk. It confirms prize receipt only after an accepted response. Rejected requests, offline errors, and timeouts show a clear message; they do not show a successful claim. See [LEADERBOARDS.md](LEADERBOARDS.md) for scoring and storage details.

The game is cached after the first successful online load for offline play. Prize submission requires an internet connection. If it is unavailable, the screen directs the winner to the ITD booth team.

## Verification

`npm test` includes hop/collision checks, level checkpoints, prize eligibility, a time-expanded search for a safe route through every level, and submission validation. `npm run e2e -- e2e/beaver.spec.ts` covers touch controls, retry, all five finishes, native text editing, clearing personal details, and intercepted Formspree responses. These tests do not submit real claims.

In development only, `?e2e&beaver` enables the game inspection hooks while retaining the real first tile. Normal `?e2e` retains the existing test-pattern fixture. Production builds do not expose the game level shortcuts.

Art follows `brand/index.html`: isometric geometry, matte grey equipment, orange ties, pink heat, dark carbon, self-hosted Barlow, and the shared CRT renderer. The beaver and game models use geometry rather than fetched image assets.
