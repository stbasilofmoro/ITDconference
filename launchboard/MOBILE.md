# Mobile web version

The same Netlify deployment adapts automatically on touch devices with a screen's short edge at or below 500 CSS pixels, including iPhone and Android phones. Detection uses touch capability and screen dimensions rather than an Apple-specific user agent. Tablets and desktop booth displays retain their existing layouts. No separate deployment or app installation is required.

The welcome screen and game picker scroll in portrait or landscape. Games use landscape; turning upright freezes their simulation and displays a rotate prompt. Convention Hall and Jumper clear held inputs and pause on rotation. The five-minute idle timeout closes the game and any forms, returning to Touch to Play.

## Controls

During gameplay, phones use gestures with no visible movement, jump, scan, or feed buttons. A small Menu opens the controls and exit options; games wait while this panel is open. Carbon Rails keeps its turn choices behind Routes & cards.

- **Beaver Crossing:** swipe in any direction for one hop; tap to hop forward.
- **Carbon Sort:** swipe left/right to shift, tap or swipe up to rotate, swipe down to drop. The next pair and score remain visible.
- **Kiln Keeper:** drag horizontally to set conveyor speed (left edge off, right edge full); tap to add wood. The temperature, feed percentage, and recovery countdown remain visible.
- **Carbon Rails:** drag the globe to explore. Open Routes & cards for region, railway, payment, cards, tickets, zoom, and rules. Close the panel to let the computer take its turn.
- **Convention Hall:** drag the left side to move, drag the right side to look, tap the right side to scan. Both thumbs work together. Menu pauses the game.
- **Jumper 3:** hold the outer left quarter to move left, the inner left quarter to move right. Hold the right side to jump and release for a shorter jump; swipe up on the right to fire. Movement and jumping work together; slide the movement thumb to run. Menu pauses the game.

Sound starts after interaction. Music and effects settings persist on this device. The rotate prompt, idle screen, and hidden tabs stay quiet. Native forms remain scrollable and use the existing Formspree endpoint; scores remain local to the browser.

## Rendering

Phone gameplay keeps a lightweight CRT glass overlay across the welcome screen, menus, and games: scanlines, RGB phosphor texture, edge shading, and a gentle refresh band. The overlay ignores touches and occupies no layout space. Reduced-motion settings disable the moving band. Smaller render targets and cropped game scenes preserve room for play without the large booth frame or extra GPU post-processing passes. The content camera retains its explicit crop and the same raycast mapping. The game uses the full landscape viewport with display-cutout insets; native overlays respect CSS safe-area insets. A single graphics canvas survives game changes, with rendering stopped while the picker is visible. Phones request a wake lock where supported without forcing fullscreen.

## Validation

`npx playwright test e2e/phone.spec.ts` checks the picker, scores, sound controls, idle reset, all six games' gestures and menus, successive launches without reloading, rotation holds, and simultaneous movement/aim/jump at iPhone-sized viewports, including 667 × 375. Rendering and game logic are also covered by the existing booth tests and production build.

Android phone emulation also checks the welcome screen, game picker, rotation prompt, and native gameplay controls. Emulation does not verify a physical phone's GPU, browser chrome, or gesture areas. Final hands-on checks in iOS Safari and Android Chrome remain necessary to confirm those device details.
