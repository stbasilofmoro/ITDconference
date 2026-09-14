# iPhone web version

The same Netlify deployment adapts automatically on touch devices with a screen's short edge at or below 500 CSS pixels. iPads and desktop booth displays retain their existing layouts. No separate deployment or App Store installation is required.

The welcome screen and game picker scroll in portrait or landscape. Games use landscape; turning upright freezes their simulation and displays a rotate prompt. Convention Hall and Jumper clear held inputs and pause on rotation. The five-minute idle timeout closes the game and any forms, returning to Touch to Play.

## Controls

- **Beaver Crossing:** one tap per hop on the four direction buttons. Native start, retry, level advance, and prize buttons.
- **Carbon Sort:** Left, Right, Rotate, Lower, Drop, and Pause. The next pair, round, stock count, and score appear beside the enlarged chamber.
- **Kiln Keeper:** drag the native conveyor slider; Drop wood, Stop feed, and Pause. The temperature and warning countdown remain readable beside the graph.
- **Carbon Rails:** scroll the side panel for region, railway, payment color, cards, tickets, zoom, rules, and pause. Drag the globe to explore. Native ticket checkboxes support choosing exactly which destinations to keep.
- **Convention Hall:** left thumb moves, right thumb looks, and Scan works alongside both. Controls, clues, status, and safe-area spacing adapt to narrow landscape screens.
- **Jumper 3:** simultaneous Left/Right, Jump, and Blaster; Run toggle, Pause, and Exit. Holding Jump still controls jump height.

Sound starts after interaction. Music and effects settings persist on this device. The rotate prompt, idle screen, and hidden tabs stay quiet. Native forms remain scrollable and use the existing Formspree endpoint; scores remain local to the browser.

## Rendering

Phone gameplay removes the CRT frame and post-processing, uses smaller render targets, and crops the existing game scenes instead of shrinking kiosk sidebars. The content camera retains its explicit crop and the same raycast mapping. Landscape reserves space for the phone controls and display cutouts; native overlays also respect CSS safe-area insets. Phones request a wake lock where supported without forcing fullscreen.

## Validation

`npx playwright test e2e/phone.spec.ts` checks the picker, scores, sound controls, idle reset, all six games' native controls, rotation holds, and simultaneous movement/aim/jump at iPhone-sized viewports, including 667 × 375. Rendering and game logic are also covered by the existing booth tests and production build.

Emulation does not verify a physical iPhone's GPU, Safari chrome, or home indicator. A final hands-on Safari check remains necessary to confirm those device details.
