# Carbon Rails

The fourth launchboard tile is a globe railway game against a computer opponent. Connect green biocarbon plants to orange regional depots. The computer connects its cogen plants, shown with tall smokestacks and animated dark smoke. Each plant counts once when an uninterrupted railway owned by that side reaches its depot. **Most connected plants wins.**

## Rules reference and deliberate changes

Reference: [Ticket to Ride's official base-game rules](https://ncdn0.daysofwonder.com/tickettoride/en/img/tt_rules_2015_en.pdf). The implementation retains the card economy, single-action turns, destination choices, route payment, wild-card restrictions, and final-round trigger. It uses original wording, facilities, and geography. It is not an exact reproduction: the requested plant-connection objective replaces the source game's points-first victory condition, and there are no ocean routes. The map contains no parallel routes.

Route and ticket points, completed destinations, and longest railway resolve equal plant counts. Empty-board and exhausted-action endings prevent a stalled match on this custom map. The computer uses its own hand, public route ownership, and its own destinations to plan paths; it does not inspect the player's private hand or tickets.

## Globe and network

The land texture is drawn from vendored Natural Earth 1:110m land polygons, including major islands and Antarctica. Geographic longitude/latitude maps directly onto a sphere, preserving continent proportions. The same geography now supplies the launchboard globe illustration.

There are 48 stations and 72 fictional corridors across North America, South America, Europe, Asia, Africa, and Australia. All stations and 101 samples along each corridor are checked against the land polygons. These are game facilities in real inland cities, not representations of existing ITD facilities or railway services.

Use the continent buttons to bring a network forward, drag the globe to explore, and use + / - to zoom. Route colors show required cards; green and charcoal identify claimed routes. Select a line on the globe or use the route selector. Names, costs, ownership, and whether payment is possible appear beside the globe.

## Controls

| Action | Keyboard / controller | Touch |
| --- | --- | --- |
| Change continent | Left / right, D-pad | Continent buttons |
| Select route | Up / down, D-pad | Route selector or globe route |
| Start / confirm / claim | Enter, Space / A | Main action button |
| Collect market card | 1–5 | Face-up card |
| Blind draw | D | Draw from deck |
| New destinations | T | Draw tickets |
| Gray-route payment color | — | A color in your hand |
| Pause | P | Pause |
| Exit | Escape / B | Exit |

The Rules screen explains play. Destination choices and all gameplay actions have touch controls. Name entry uses native keyboard controls outside WebGL. Final results offer replay, the launchboard, and the shared score-form UI for this game's local leaderboard.

## Verification

`tests/carbon-rails.test.ts` checks setup, card conservation, wild-card restrictions, ticket selection, legal claims, plant connectivity, final turns, ranking, computer play, full-match termination, and land-only geometry. Browser tests exercise real controls, computer turns, final results, replay, and score submission.

Source: [Natural Earth land data](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson), downloaded September 14, 2026; [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/). The dataset is bundled in `src/geography/land.json`; no remote map service is needed at runtime.
