# Local leaderboards

All four games have a **Save score / Leaderboard** button on their final result screens. Beaver Crossing also offers it after a collision, and its winning prize form saves the final score upon acceptance. **High scores** on the launchboard opens all four rankings.

Each form asks for first and last name explicitly. The leaderboard stores only those names, the game, score, result description, run ID, and date. Company, phone, and mailing address remain confined to the prize submission; they are never added to browser score storage.

| Game | Ranking value |
| --- | --- |
| Beaver Crossing | 100 per row of total progress through the five levels, minus 10 per retry, minimum zero |
| Carbon Sort | Total recycling points |
| Kiln Keeper | 100 per second within 700–850°C, plus 10,000 for finishing the batch |
| Carbon Rails | Number of biocarbon plants connected to their regional depots |

The top ten runs per game are stored in `localStorage` under `itd.leaderboard.v1`. Higher scores rank first; earlier submissions lead exact ties. Saving a run again replaces its previous entry. No sample or invented scores are shown.

## Offline and Formspree

The score form saves locally first, then sends a copy with the run ID and both name fields to the existing Formspree endpoint. Network failure does not erase the local score. The form reports that the copy was not confirmed and offers a retry; it does not claim that Formspree accepted a failed request. Tests intercept all external submissions.

Prize delivery is separate: the Beaver Crossing claim still requires Formspree acceptance before showing “Claim received.” On acceptance, its name and winning score are added locally. A local-storage failure does not change the accepted prize claim into a failed claim.

## Netlify and persistence

Local storage belongs to the browser profile and website origin. It survives refreshes and deployments at the same URL, but does not sync between devices. Different Netlify preview URLs have separate rankings. Clearing site data or using a temporary/private profile can erase scores. Use the same regular browser profile and stable production URL at the booth.

`netlify.toml` at the repository root configures the app directory, build, publish directory, root asset paths, and service-worker cache headers. No leaderboard backend or database is required. The GitHub Pages build still uses its existing subdirectory unless `VITE_BASE_PATH` is supplied.

## Checks

Unit tests cover ranking, per-game limits, repeated runs, corrupted storage, filtering private fields, and Formspree errors. Browser tests cover all four games, native name entry, saved scores surviving refresh, and local success when the copy to Formspree fails.
