# "Have Some Fun At AREMA" Launchboard — Design Spec

**Date:** 2026-09-13
**Owner:** Basil Polivka (International Tie Disposal)
**Status:** Approved in brainstorming; pending written-spec review

## 1. Purpose

A booth kiosk web app for International Tie Disposal (ITD) at the AREMA conference. Visitors walk up to a large landscape screen, see an animated attract loop, touch to open a launchboard titled **"Have Some Fun At AREMA"**, and pick a game. The whole experience is rendered as if on a professional broadcast-grade CRT monitor (Sony BVM-style): true tube curvature, aperture-grille phosphor mask, scanlines, bloom and phosphor persistence.

The brand must closely match tiedisposal.com, including its 3D isometric illustration style.

### Deliverables

1. `brand/` — Brand identity guide (standalone HTML page, also published as a private Artifact).
2. `launchboard/` — Vite + React + React Three Fiber kiosk app.

### Out of scope (for this spec)

- The games themselves. The launchboard ships with 6 "Coming soon..." placeholder tiles and a game contract; games are designed in later specs.
- Phone / QR play, analytics, lead capture, backend services.

## 2. Brand study (source: tiedisposal.com)

Observed from the live Framer site (HTML, CSS tokens, and all image assets):

| Aspect | Finding |
|---|---|
| Typeface | DINPro Regular (body) and DINPro Medium (headings/labels) |
| Headline style | Large, stacked, one word/phrase per line ("International / Tie / Disposal", "How / it / works", "Our / story") |
| Ground colors | Studio grey `#C4C4C4`, light grey `#D9D9D9`, white `#FFFFFF` |
| Text colors | Ink `#1C1B1F`, black `#000000`, graphite `#333333`, slate `#3B3942`, muted `#787582` |
| Accents | Tie Orange `#ED9833`, Kiln Pink `#F861D6` (hover `#EB5FCB` / `#EA5ECA`), Carbon Green `#00C472` |
| Dark section | Map on charcoal `#333333` with Kiln Pink rail lines and light-grey place labels |
| Logo | "ITD" monogram built from three parallel stroked lines forming I, T and a rounded D; wordmark "International / Tie Disposal" in DIN |
| Voice | Confident, industrial, plain-spoken, sustainability-forward ("Results driven environmentalism", "Coming soon...") |

### Illustration language

- 3D renders in isometric / three-quarter view on a seamless grey floor matching the page ground.
- Machinery and vehicles are **matte mid-grey** (`~#8A8A8A`–`#A0A0A0`) with rounded bevels; no outlines, no textures, no decals.
- **One accent material per scene**, reserved for the *material being processed*: railroad ties are Tie Orange; kiln charge glows Kiln Pink with translucent vessel; biochar is near-black with a violet cast (`#2E2A36`); globe land is Carbon Green.
- Soft key light from upper-left; long, very diffuse contact shadow falling toward lower-left/right; low contrast overall.
- Translucent "glass" materials (bin, kiln shell, globe ocean) with a bright rim.
- Icons are chunky extruded glyphs with soft drop shadow (pink ↗ arrow, green $ coin).
- Subjects seen: track with ties, loose/damaged ties (grading: reusable → landscape → junk), gondola car + switcher locomotive, twin-motor shredder with orange chip pile, pyrolysis kiln, biochar bin, railroad crossing signal, globe, extruded monogram.

## 3. Brand identity guide (`brand/`)

A single self-contained page (`brand/index.html`) with these sections:

1. **Brand overview** — who ITD is, one-paragraph positioning, voice principles with do/don't copy examples drawn from the site.
2. **Logo** — ITD monogram redrawn as clean SVG (three-stroke construction diagram), wordmark lockups (horizontal, stacked, monogram-only), clear space = one stroke-gap × 3, minimum size (24 px monogram / 120 px lockup), color versions (Ink on grey, white on graphite, one-color orange), misuse list (no outlines, no gradients, no rotation, no stretching, no recoloring strokes individually).
3. **Color** — swatches with HEX/RGB, role, and usage proportion (≈70% greys, ≈20% ink/graphite, ≈10% accents). Accent rule: only the material being transformed gets color. Contrast notes for text on each ground.
4. **Typography** — DINPro is the official face; **Barlow** (Google Fonts) is the approved free substitute for web and kiosk (Barlow 400 ≈ DINPro Regular, Barlow 500/600 ≈ DINPro Medium). Type scale with stacked-headline pattern, label style, body style, and numeric/stat style ("2 million ties per year").
5. **Illustration** — rules from §2 with annotated examples, plus a "build kit" for the low-poly 3D versions used in the launchboard (camera angle, light rig, material values).
6. **Iconography** — extruded glyph style spec.
7. **CRT extension** — how the brand lives inside a tube: phosphor-safe palette (accents slightly desaturated to avoid mask bleed), minimum text size under the mask (≥ 28 px at 1080p for body, ≥ 20 px for labels), glow rules (only accents and white may bloom), and preview swatches rendered with the mask applied.

The guide page itself follows the brand (grey ground, Barlow, stacked headlines) and supports light/dark viewer themes.

## 4. Launchboard experience (`launchboard/`)

### 4.1 Frame

- Fixed 16:9 logical canvas, authored at **1920×1080**, letterboxed to the kiosk display.
- A rendered broadcast-monitor **bezel** surrounds the tube: dark grey chassis, small ITD badge (no third-party branding), green tally lamp, a row of decorative knobs/buttons below the screen.

### 4.2 States

| State | Enter when | Behavior |
|---|---|---|
| **Boot** | App load only | ~2 s tube warm-up: black → bright horizontal line expands vertically → degauss wobble + brief color wash → Attract |
| **Attract** | After Boot; no input on Board for `config.idleToAttractMs` (default 60 000) | Slow isometric camera drift across a tie yard: gondola rolls by with orange ties, shredder emits orange cubes, kiln pulses pink. Stacked headline "Have Some Fun At AREMA". Slow-blink "TOUCH TO PLAY". Small ITD lockup in corner. Any input → Board via short channel-change transition |
| **Board** | Input during Attract; exit from a game | Layout below |
| **Game** | Tile selected | Tile zooms to fill the tube, channel-change transition (static burst, vertical-hold roll, flash). Game renders into the same tube. Exit (Escape/B, `ctx.exit()`, or no input for `config.gameIdleExitMs`) reverses back to Board |

### 4.3 Board layout

- **Left column (~38%)**: stacked headline `Have / Some Fun / At AREMA` (Barlow 600, Ink), ITD monogram, one-line subcopy (config).
- **Right area (~62%)**: 3×2 grid of **6 game tiles**. Each tile is a small isometric stage on the studio floor with its own illustration and a DIN-style title.
  - Default illustrations: `TieStack`, `Gondola`+`Locomotive`, `Shredder`, `Kiln`, `CrossingSignal`, `Globe`.
  - **Focused/hover**: tile lifts ~12 px equivalent, shadow lengthens, accent underline appears, illustration animates.
  - **Placeholder**: desaturated stage, title "Coming soon...", not launchable (subtle shake on press).
- **Bottom strip**: Kiln Pink rail line animating left→right as a ticker carrying `config.tickerLines` (e.g. "Hamlet, NC · 2 million ties per year · Booth #___").

### 4.4 Input

- Touch and mouse via R3F raycast pointer events on tiles.
- Keyboard: arrows move focus, Enter/Space launch, Escape exits game / returns to board.
- Gamepad (Gamepad API): d-pad/left stick focus, A launch, B exit.
- Any input resets the idle timer.
- Hidden staff shortcut `Ctrl+Shift+Q` cycles quality preset; `Ctrl+Shift+D` toggles the debug panel.

## 5. Architecture

### 5.1 Stack

Vite, React 19 (required by @react-three/fiber 9), TypeScript, `@react-three/fiber`, `@react-three/drei` (text via troika, helpers), `three`, `zustand` (state), Vitest, Playwright. Fonts: Barlow self-hosted woff2 in `public/fonts/` (SIL OFL). Deployed as static build (GitHub Pages via Actions), with a service worker for offline caching at the venue.

### 5.2 Render pipeline

One `<Canvas>`; two passes per frame.

1. **Content pass** — the active screen's scene renders into an offscreen `WebGLRenderTarget` at 1920×1080 (scaled by quality preset).
2. **Tube pass** — a full-screen quad with the CRT fragment shader samples the content target, applying in order:
   1. Phosphor persistence: blend with previous tube output (ping-pong target) (runs in content space so the mask is not smeared).
   2. Barrel curvature (configurable k), black outside a rounded-rect tube mask.
   3. Horizontal chromatic convergence error, scaled toward edges.
   4. Bloom: add a separable-blurred, downsampled bright-pass of the content.
   5. Aperture-grille RGB phosphor mask (vertical triad stripes); slot-mask variant selectable.
   6. Scanline gaps with brightness-dependent beam width (bright lines fatten).
   7. Rolling refresh band + low-amplitude flicker.
   8. Vignette / corner falloff.
   9. Glass layer: soft reflection highlight, faint grain.
3. **Bezel** — real geometry framing the tube quad, lit by a separate simple rig.

All transition effects (warm-up line, degauss wobble, static, vertical roll, flash) are **shader uniforms** driven by a single `tubeTimeline` so screens never implement their own post effects.

### 5.3 Module layout

```
launchboard/
  src/
    main.tsx, App.tsx
    config.ts                 # booth #, ticker lines, subcopy, idle timeouts, default quality
    state/store.ts            # screen, focusIndex, idle timer, quality, debug flag
    tube/
      TubeRenderer.tsx        # render targets, passes, ping-pong persistence
      crt.frag.glsl / crt.vert.glsl
      bloom.ts
      tubeTimeline.ts         # transition keyframes → uniforms
      presets.ts              # Pro / Standard / Safe parameter sets
      Bezel.tsx
      CssFallback.tsx         # Safe preset when WebGL2 unavailable
    screens/
      Boot.tsx, Attract.tsx, Board.tsx, GameHost.tsx
    illustrations/
      StudioRig.tsx           # shared floor, key light, contact-shadow setup, materials
      materials.ts            # brand material palette
      TieStack.tsx, Gondola.tsx, Locomotive.tsx, Shredder.tsx,
      Kiln.tsx, CrossingSignal.tsx, Globe.tsx, Monogram.tsx
    ui/
      StackedHeadline.tsx, Tile.tsx, Ticker.tsx, focus.ts, input.ts
    games/
      registry.ts
      types.ts                # GameDefinition, GameContext
      placeholder/            # "Coming soon..." stub
    debug/DebugPanel.tsx      # leva-style sliders for every tube uniform
  public/fonts/
  tests/ (vitest unit) , e2e/ (playwright)
brand/
  index.html
  assets/ (monogram SVGs)
```

### 5.4 Game contract

```ts
interface GameDefinition {
  id: string;
  title: string;
  accent: 'orange' | 'pink' | 'green';
  illustration: IllustrationId; // mapped to a component in illustrations/index.ts
  status: 'playable' | 'coming-soon';
  load?: () => Promise<{ default: React.ComponentType<{ ctx: GameContext }> }>;
}

interface GameContext {
  exit(): void;
  input: InputSnapshot;                 // unified touch/keys/gamepad
  tube: { pulse(kind: 'static' | 'flash' | 'roll'): void };
  quality: QualityPreset;
}
```

Games render R3F content into the same content pass, so they inherit the tube automatically.

## 6. Performance and failure handling

- **Presets**: *Pro* (all effects, full-res target), *Standard* (no persistence, half-res bloom), *Safe* (DOM + CSS overlay mask; used when WebGL2 is unavailable).
- **Auto-select**: measure median frame time over the first 3 s after boot; drop one preset if > 20 ms. Staff override persists in `localStorage`.
- **Kiosk**: request Fullscreen and Screen Wake Lock on first interaction; hide cursor after 3 s idle.
- **Game load failure**: GameHost catches the rejected `load()` or render error (error boundary), shows an on-tube "SIGNAL LOST" card for 3 s, returns to Board.
- **Context loss**: on `webglcontextlost`, show Safe fallback; attempt restore on `webglcontextrestored`.

## 7. Testing

- **Vitest**: registry validation (unique ids, playable entries have `load`), idle-timer transitions, focus navigation on the 3×2 grid (wrapping rules), `tubeTimeline` keyframe → uniform values at given times, preset auto-select logic.
- **Playwright** (Chromium, 1920×1080): boot → attract after shortened idle → board on click → press placeholder (stays on board) → launch a test playable stub → Escape back to board; screenshots saved per state for visual review.
- **Debug page** `?debug`: live sliders for all tube uniforms, preset switcher, FPS meter — used to tune on the actual kiosk display.

## 8. Configuration defaults

| Key | Default |
|---|---|
| `title` | "Have Some Fun At AREMA" |
| `subcopy` | "Pick a game. Beat the yard." |
| `boothNumber` | `""` (ticker omits booth segment when empty) |
| `tickerLines` | "Hamlet, NC", "2 million ties per year", "Rail access: 50,000 ties per week", "tiedisposal.com" |
| `idleToAttractMs` | 60000 |
| `gameIdleExitMs` | 120000 |
| `defaultQuality` | "auto" |

## 9. Asset & licensing notes

- DINPro is commercially licensed and is **not** bundled; Barlow (SIL OFL) is used in all shipped code.
- Illustrations are original low-poly recreations in ITD's style, not copies of the site's PNGs.
- The monitor bezel is generic and carries only ITD branding.

## 10. Implementation notes

Approved deviations discovered and ruled on during implementation:

- Pro tube curvature is `0.03` and chroma is `0.0008` (standard chroma `0.0006`), flatter than an initial draft — closer to a real pro broadcast monitor's very shallow barrel than a consumer-CRT fisheye look.
- Scanline period is band-limited to ≥3 device px, using `fwidth()` to keep the line width proportional to on-screen derivative change, to prevent moiré at typical kiosk viewing distances and DPRs.
- `StudioRig` light intensities were recalibrated for three.js r155+'s physically-based lighting defaults (its light unit/exposure handling changed from the versions earlier drafts of this spec assumed).
- `inputBus` buffers the single most recent action for a TTL when it is emitted with no active subscriber, delivering it once to the next subscriber — this is what makes "press Enter/Space immediately after a screen change" reliable, and Task 17's smoke test depends on it. The TTL was widened from an initial 750 ms to 3000 ms after Task 17's e2e runs showed the gap between a screen transition and its component's effect actually committing can exceed 750 ms under this project's headless, software-rendered (`swiftshader`) Playwright environment; a stale buffered action is harmless (only the single most recent one is ever kept), so erring high has no real downside. The buffer is also **screen-scoped**: a buffered action is only delivered if the app's `screen` is unchanged between emit and subscribe (TTL 3000 ms either way), not merely "within the TTL" — otherwise a press buffered while nobody is listening (e.g. during SIGNAL LOST, which holds `screen === 'game'` until its own timeout fires) could be replayed onto whichever different screen ends up subscribing next, e.g. relaunching a crashed game the moment the board reappears.
- Playwright runs with `workers: 1` (see `launchboard/playwright.config.ts`): this suite's WebGL rendering is CPU-bound software rasterization, which contends badly — and can stall the main thread — under parallel workers.
- `GameContext.input` (§5.4) ships as the discrete-action `InputBus` (`emit`/`subscribe` over up/down/left/right/select/back), not the unified `InputSnapshot` (continuous touch/keys/gamepad state) §5.4 describes — that abstraction is deferred to whichever spec introduces the first real game, since no game has needed held-state or pointer input yet.
- The *Standard* preset (§6) has no bloom at all (`bloom: 0`, see `PRESETS.standard` in `launchboard/src/tube/presets.ts`), not "half-res bloom" as originally drafted; the content pass itself is not resolution-scaled per preset (Pro and Standard render the content pass at the same resolution).
- Fonts ship as Barlow **TTF** in `public/fonts/`, not woff2 as §5.1 says: troika-three-text (drei's `<Text>`) parses fonts itself via `opentype.js`, which cannot read woff2's compressed table format.
- Placeholder tiles (§5.4/Tile.tsx) use a translucent light-grey wash (a semi-transparent plane over the illustration) rather than a true desaturated render of the stage — cheaper, and visually indistinguishable at kiosk viewing distance.
- The service worker precaches the app shell (`./`, `./index.html`) and the three Barlow font files on `install`, and the just-loaded JS/CSS bundle after the page's first successful online load (via a `postMessage` from `main.tsx` once the SW is ready) — not only on a second visit — and its `activate` handler prunes only cache keys prefixed `arema-launchboard-`, never other caches that may share the `<user>.github.io` origin.
