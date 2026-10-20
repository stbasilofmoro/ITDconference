# Tie Grader

The fourth launchboard tile puts you in the paws of a hardhat-wearing beaver at a busy biocarbon plant. Carry railroad ties through a complete sorting and dispatch workflow, with rotary kilns, conveyors, trucks, and a shredder around the yard. The kilns use the same drum, roller, feed, and exhaust details as the existing plant illustrations.

## Your shift

Handle 12 ties before the three-minute shift ends. Three ties are ready initially; the remaining ties arrive at eight-second intervals. Every shift includes four ties of each condition. Pick up one incoming tie, inspect it, and carry it to the right pile:

| Pile | What to look for | Final destination |
| --- | --- | --- |
| Grade 1 | Straight, solid timber with clean edges and no decay or splits | Grade 1 truck |
| Grade 2 | Weathered but firm timber with shallow cracks or worn edges | Grade 2 truck |
| Junk | Rot, deep splits, broken ends, or missing chunks | Shredder |

These are simplified game categories. A condition description appears while carrying a tie, and the timber's appearance also shows wear or damage. Place the tie into its pile first, then pick it up from that pile and carry it to the matching truck or shredder. One beaver carries one tie at a time. Incorrect grading or delivery keeps the tie in your paws and explains where it belongs.

Correctly grading a new tie earns 25 points; delivering it earns another 75. Grading or delivery errors cost 10 points, with a minimum score of zero. Returning an already graded tie to its pile does not award more points. Handling all 12 ties completes the shift; running out of time ends it with the points earned so far. The result screen offers a new shift, the launchboard, and the shared named score form.

## Controls

Click or tap a station button to walk there and pick up or place a tie automatically. The same controls are available on desktop, tablet, and phones in portrait or landscape. The seven stations are Incoming ties, Grade 1 pile, Grade 2 pile, Junk pile, Grade 1 truck, Grade 2 truck, and Shredder. Pause shift (Menu on phones) stops the clock; Resume shift continues.

Use WASD or the arrow keys to walk; E, Space, or Enter picks up or places a tie at the nearest station. I walks to incoming ties, 1/2/3 to the grading piles, and 4/5/6 to the trucks and shredder. P pauses the shift and Escape returns to the launchboard. A controller's left stick or directional pad moves the beaver, and its main action button interacts. Menus and score entry use native HTML controls.

## Verification

`tests/tie-grader.test.ts` covers tie grading, carrying, piles, truck and shredder delivery, scoring, arrivals, pause, and shift completion. The audio and registry tests cover the replacement tile and its effects. `e2e/tie-grader.spec.ts`, the phone suite, and the leaderboard suite exercise gameplay controls, pause and replay, mobile layouts, and named score submission. External score submissions are intercepted during browser tests.
