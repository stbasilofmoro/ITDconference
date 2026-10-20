# Beaver Crossing

The first launchboard tile is a five-level, original beaver crossing game. Carbon Sort, Kiln Keeper, Tie Grader, Convention Hall, and Jumper 3 fill the remaining five tiles.

## Play

- Arrow keys, controller D-pad / left-stick presses, or the on-screen arrows: hop one cell.
- Enter / Space / controller A: start, hop forward, retry, or continue.
- Escape / controller B / the Exit button: return to the launchboard.
- Reach the green row to complete a level. A collision restarts only the current level, with unlimited retries.
- Completing level five offers score submission and **Back to games**. Enter returns to the launchboard so you can continue the other games.
- The launchboard's **You won all games? Get your free maple syrup** button opens the all-games prize form. It records the player's reported completion. The form clears on success, exit, or the kiosk's existing idle reset.

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

Use the real form ID from the Formspree dashboard and restart Vite. For a Netlify override, set the site environment variable `VITE_FORMSPREE_ENDPOINT` and rebuild. An unset or empty variable uses the default ITD form. This endpoint is public; no API key is required or included in the client.

The all-games form submits first and last name, company, phone, address, and a stable claim identifier using JSON over HTTPS. Its metadata identifies the **Beat Every Game** challenge and the player's reported completion. It sends no game score, level count, or game run identifier, and creates no local leaderboard entry. Personal details are not persisted on the kiosk. It confirms prize receipt only after an accepted response. Rejected requests, offline errors, and timeouts show a clear message; they do not show a successful claim. See [LEADERBOARDS.md](LEADERBOARDS.md) for separate score submission and storage details.

The game is cached after the first successful online load for offline play. Prize submission requires an internet connection. If it is unavailable, the screen directs the winner to the ITD booth team.

## Verification

`npm test` includes hop/collision checks, level checkpoints, a time-expanded search for a safe route through every level, and submission validation. `npm run e2e -- e2e/beaver.spec.ts e2e/syrup.spec.ts` covers touch controls, retry, all five finishes, the all-games claim button, native text editing, clearing personal details, and intercepted Formspree responses. These tests do not submit real claims.

In development only, `?e2e&beaver` enables the game inspection hooks while retaining the real first tile. Normal `?e2e` retains the existing test-pattern fixture. Production builds do not expose the game level shortcuts.

Art follows `brand/index.html`: isometric geometry, matte grey equipment, orange ties, pink heat, dark carbon, self-hosted Barlow, and the shared CRT renderer. The beaver and game models use geometry rather than fetched image assets.
