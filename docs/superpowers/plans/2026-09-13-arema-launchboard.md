# "Have Some Fun At AREMA" Launchboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an ITD brand identity guide and a booth-kiosk launchboard web app ("Have Some Fun At AREMA") rendered through a pro-grade CRT tube shader, with 6 "Coming soon..." game slots and a game contract for later games.

**Architecture:** Vite + React 19 + React Three Fiber. Every screen renders into an offscreen 1920×1080 content scene (via `createPortal`), which feeds a persistence pass, a bloom pass, and a final CRT shader drawn on a quad inside a 3D monitor bezel. Pointer events are mapped back through the same barrel-distortion math so touch hits land on the curved image. All logic that can be pure (geometry, timeline, focus, idle, input mapping, registry) lives in plain TS modules with Vitest tests; the rendering layer is verified by a Playwright smoke test plus a `?debug` tuning panel.

**Tech Stack:** Node 24, npm 11, Vite 8, React 19, @react-three/fiber 9, @react-three/drei 10, three 0.186, zustand 5, TypeScript 5.9, Vitest 5, Playwright 1.63. Font: Barlow (SIL OFL) TTF.

**Spec:** `docs/superpowers/specs/2026-09-13-arema-launchboard-design.md`

## Global Constraints

- Repo root: `C:\Users\Polivka Family\ITDconference` (git, branch `main`). All paths below are relative to it.
- Shell: commands are written for Git Bash. Run them from the repo root unless a step says `cd launchboard`.
- Title string exactly: `Have Some Fun At AREMA`. Headline stacks as `Have` / `Some Fun` / `At AREMA`.
- Brand colors (exact): Studio Grey `#C4C4C4`, Light Grey `#D9D9D9`, Ink `#1C1B1F`, Graphite `#333333`, Slate `#3B3942`, Muted `#787582`, Tie Orange `#ED9833`, Kiln Pink `#F861D6`, Kiln Pink Hover `#EB5FCB`, Carbon Green `#00C472`, Biochar `#2E2A36`, Machine Grey `#9A9A9A`.
- Fonts: never bundle DINPro. Ship Barlow TTF only (`Barlow-Regular.ttf`, `Barlow-Medium.ttf`, `Barlow-SemiBold.ttf`) in `launchboard/public/fonts/`.
- Content canvas is a fixed logical 1920×1080 frame; content coordinates are centered (x ∈ [-960, 960], y ∈ [-540, 540], y up).
- Placeholder tile copy exactly: `Coming soon...`
- Config defaults (spec §8): `idleToAttractMs` 60000, `gameIdleExitMs` 120000, `boothNumber` `""`, ticker lines `Hamlet, NC` · `2 million ties per year` · `Rail access: 50,000 ties per week` · `tiedisposal.com`, subcopy `Pick a game. Beat the yard.`
- Monitor bezel carries only ITD branding (no Sony/BVM marks).
- Illustrations are original low-poly recreations; do not embed the site's PNGs in the app.
- Vite `base` is `/ITDconference/` for production builds (GitHub Pages); always build asset URLs with `asset()` (Task 2).
- Commit after each task with a message ending in the trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

**Deliberate deviations from the spec (approved scope, implementation detail):**
- React 19 instead of 18 — required by @react-three/fiber 9.
- `GameDefinition.illustration` is an `IllustrationId` string mapped to a component in `illustrations/index.ts` (keeps the registry importable in node tests).
- Phosphor persistence runs in content space *before* curvature (visually identical, avoids smearing the mask).

## File Map

```
brand/
  index.html                      Brand identity guide page (Task 1)
  assets/itd-monogram.svg         Monogram, Ink
  assets/itd-monogram-white.svg   Monogram, white
  assets/itd-lockup.svg           Monogram + wordmark lockup
  assets/ref/*.jpg                Downscaled reference renders from tiedisposal.com (guide only)
  check.mjs                       Node check: required sections/colors present
launchboard/
  package.json, tsconfig.json, vite.config.ts, index.html, playwright.config.ts
  public/fonts/Barlow-*.ttf, OFL.txt
  public/sw.js                    Offline cache service worker (Task 17)
  src/
    main.tsx                      React root, SW registration
    App.tsx                       Canvas vs CSS fallback, global wiring (final in Task 15)
    asset.ts                      BASE_URL-aware asset paths
    config.ts                     Booth/ticker/idle config + URL overrides
    brand.ts                      Color + font tokens, monogram path data
    e2eHooks.ts                   window.__launchboard test hooks (?e2e only)
    state/store.ts                zustand app store
    state/idle.ts                 Pure idle-transition rule
    state/useIdle.ts              Idle timer hook
    state/quality.ts              Initial quality resolution + localStorage override
    ui/focus.ts                   Pure grid focus navigation
    ui/input.ts                   Pure key/gamepad → Action mapping
    ui/inputBus.ts                Tiny action emitter
    ui/useGlobalInput.ts          DOM keyboard/gamepad/pointer hookup + staff shortcuts
    ui/useKiosk.ts                Fullscreen, wake lock, cursor hiding
    ui/layout.ts                  Board grid positions, accent colors, easing (pure)
    ui/StackedHeadline.tsx, ui/Tile.tsx, ui/Ticker.tsx, ui/Monogram.tsx
    games/types.ts, games/registry.ts
    games/test-pattern/TestPattern.tsx   Playable stub used by e2e (?e2e only)
    tube/geometry.ts              Layout, barrel, inverse barrel, tube mask (pure)
    tube/timeline.ts              Pulse events → shader fx values (pure)
    tube/presets.ts               TubeParams presets + auto-select (pure)
    tube/tubeBus.ts               Global pulse queue + debug overrides + fps
    tube/passes.ts                FullscreenPass helper + pass materials
    tube/shaders/                 fullscreen.vert, tube.vert, persist.frag, bright.frag, blur.frag, crt.frag
    tube/TubeRenderer.tsx         Render targets, portal, frame loop
    tube/Bezel.tsx                Monitor chassis geometry
    tube/PerfAutoSelect.tsx       Frame-time based preset step-down
    tube/CssFallback.tsx          Safe preset DOM board + CSS mask
    illustrations/materials.ts, StudioRig.tsx, ShadowBlob.tsx, Iso.tsx
    illustrations/TieStack.tsx, Train.tsx, Shredder.tsx, Kiln.tsx, CrossingSignal.tsx, Globe.tsx
    illustrations/index.ts        IllustrationId → component + tile scale/lift
    screens/Boot.tsx, Attract.tsx, Board.tsx, ScreenRouter.tsx, GameHost.tsx, SignalLost.tsx
    dev/Gallery.tsx               ?gallery illustration review grid
    debug/DebugPanel.tsx
  tests/*.test.ts                 Vitest unit tests
  e2e/hooks.ts                    Shared window.__launchboard types
  e2e/gallery.spec.ts, screens.spec.ts, debug.spec.ts, smoke.spec.ts
.github/workflows/deploy.yml      Build + publish to GitHub Pages (Task 17)
```

---

## Part A — Brand Identity Guide

### Task 1: Monogram assets and brand identity guide page

**Files:**
- Create: `brand/assets/itd-monogram.svg`, `brand/assets/itd-monogram-white.svg`, `brand/assets/itd-lockup.svg`
- Create: `brand/assets/ref/` (downscaled JPGs)
- Create: `brand/index.html`
- Test: `brand/check.mjs`

**Interfaces:**
- Produces: monogram path data (copied verbatim into `launchboard/src/brand.ts` in Task 2):
  ```
  viewBox 0 0 287 246, stroke-width 10, fill none, butt caps, miter joins
  M5 78V246 M25 78V246 M45 78V246
  M0 5H225A57 57 0 0 1 282 62V184A57 57 0 0 1 225 241H164V78
  M0 25H225A38 38 0 0 1 263 63V183A38 38 0 0 1 225 221H183V78
  M0 45H84V246
  M104 25V246
  M124 246V45H225A18 18 0 0 1 243 63V183A18 18 0 0 1 225 201H203V78
  ```
  (Measured from the site's OG image: three 10-unit strokes on a 20-unit pitch; I = three short verticals, T = top bars + three stems, D = three nested rounded D's whose stems start level with the I.)

- [ ] **Step 1: Write the failing check script**

`brand/check.mjs`:
```js
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const errors = [];

const sections = ['overview', 'logo', 'color', 'typography', 'illustration', 'iconography', 'crt'];
for (const id of sections) {
  if (!html.includes(`id="${id}"`)) errors.push(`missing section #${id}`);
}
const colors = ['#C4C4C4', '#D9D9D9', '#1C1B1F', '#333333', '#3B3942', '#787582', '#ED9833', '#F861D6', '#00C472', '#2E2A36'];
for (const c of colors) {
  if (!html.toUpperCase().includes(c)) errors.push(`missing color ${c}`);
}
for (const s of ['DINPro', 'Barlow', 'Coming soon...', 'Results driven environmentalism']) {
  if (!html.includes(s)) errors.push(`missing text "${s}"`);
}
if (/<html|<head|<body|<!doctype/i.test(html)) errors.push('page must not contain html/head/body/doctype tags (Artifact wraps it)');
for (const f of ['itd-monogram.svg', 'itd-monogram-white.svg', 'itd-lockup.svg']) {
  if (!existsSync(new URL(`./assets/${f}`, import.meta.url))) errors.push(`missing asset ${f}`);
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('brand guide OK');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node brand/check.mjs`
Expected: FAIL with `ENOENT` (no `index.html` yet).

- [ ] **Step 3: Create the SVG assets**

`brand/assets/itd-monogram.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 297 256" role="img" aria-label="ITD monogram">
  <g fill="none" stroke="#1C1B1F" stroke-width="10" stroke-linecap="butt" stroke-linejoin="miter">
    <path d="M5 78V246M25 78V246M45 78V246"/>
    <path d="M0 5H225A57 57 0 0 1 282 62V184A57 57 0 0 1 225 241H164V78"/>
    <path d="M0 25H225A38 38 0 0 1 263 63V183A38 38 0 0 1 225 221H183V78"/>
    <path d="M0 45H84V246"/>
    <path d="M104 25V246"/>
    <path d="M124 246V45H225A18 18 0 0 1 243 63V183A18 18 0 0 1 225 201H203V78"/>
  </g>
</svg>
```
`brand/assets/itd-monogram-white.svg`: identical except `stroke="#FFFFFF"`.

`brand/assets/itd-lockup.svg` (monogram + two-line wordmark; text uses the font stack so it renders in DINPro where installed, Barlow otherwise):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 900 256" role="img" aria-label="International Tie Disposal">
  <g fill="none" stroke="#1C1B1F" stroke-width="10" stroke-linecap="butt" stroke-linejoin="miter">
    <path d="M5 78V246M25 78V246M45 78V246"/>
    <path d="M0 5H225A57 57 0 0 1 282 62V184A57 57 0 0 1 225 241H164V78"/>
    <path d="M0 25H225A38 38 0 0 1 263 63V183A38 38 0 0 1 225 221H183V78"/>
    <path d="M0 45H84V246"/>
    <path d="M104 25V246"/>
    <path d="M124 246V45H225A18 18 0 0 1 243 63V183A18 18 0 0 1 225 201H203V78"/>
  </g>
  <g fill="#1C1B1F" font-family="'DINPro Medium','DINPro','Barlow',sans-serif" font-weight="500" font-size="92">
    <text x="360" y="110">International</text>
    <text x="360" y="222">Tie Disposal</text>
  </g>
</svg>
```

- [ ] **Step 4: Create downscaled reference renders**

Run (PowerShell tool, not Bash) — downloads six site renders and writes 900-px-wide JPGs:
```powershell
Add-Type -AssemblyName System.Drawing
$out = "C:\Users\Polivka Family\ITDconference\brand\assets\ref"
New-Item -ItemType Directory -Force $out | Out-Null
$imgs = @{
  'track'     = 'T3BOvbzvcaGLewxIRGzBzprNbY.png'
  'train'     = 'NJrknFKsDYcNnySF9j9q6Jzxc.png'
  'grading'   = 'InOj5wHtQfEHft4MOaZAqHIc.png'
  'shredder'  = 'lO3R8YiVeGQestXZe9lyjf1I.png'
  'kiln'      = 'gq2ehYThvJZjMstt8qRKqn6axE.png'
  'biochar'   = 'OteyTphBgeLU2ckih0cSWFJOx8.png'
}
foreach ($k in $imgs.Keys) {
  $tmp = Join-Path $env:TEMP "$k.png"
  Invoke-WebRequest "https://framerusercontent.com/images/$($imgs[$k])" -OutFile $tmp -UseBasicParsing
  $src = [System.Drawing.Image]::FromFile($tmp)
  $w = 900; $h = [int]($src.Height * $w / $src.Width)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.DrawImage($src, 0, 0, $w, $h)
  $bmp.Save((Join-Path $out "$k.jpg"), [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}
Get-ChildItem $out
```
Expected: six `.jpg` files, each under 150 KB.

- [ ] **Step 5: Load design guidance, then write `brand/index.html`**

Invoke the `artifact-design` skill first (required before writing any Artifact page). Then write `brand/index.html` as page content only (no `<html>/<head>/<body>/<!doctype>`), starting with `<title>ITD Brand Identity</title>` and a `<style>` block. Requirements:

*Page styling:* grey ground `#C4C4C4` in light theme; Graphite `#333333` ground in dark theme (tokens on `:root`, overridden under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and under `:root[data-theme="dark"]`). Load Barlow 400/500/600 from `https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&display=swap`; font stack `'DINPro','Barlow',system-ui,sans-serif`. Section headings use the stacked-headline pattern (one word per line, weight 500, `line-height: .95`, `clamp(48px, 8vw, 112px)`). 16px minimum side gutter; single column under 700px; images `max-width:100%`.

*Sections (each a `<section id="...">`) with this exact content:*

1. `id="overview"` — Headline `International / Tie / Disposal`. Positioning paragraph: "International Tie Disposal transforms end-of-life railroad ties into clean biocarbon. Fifty years of railroad construction and salvage experience, one central facility in Hamlet, NC, and a process built for scale: 2 million ties per year." Voice principles (3 cards): **Industrial, not corporate** (do: "Can receive 50,000 ties per week" / don't: "Leveraging synergistic logistics solutions"); **Confident, plain-spoken** (do: "Results driven environmentalism" / don't: "We strive to maybe reduce impact"); **Understated wit** (do: "Coming soon..." / don't: "OMG you won't believe what's next!!!").
2. `id="logo"` — Show `assets/itd-monogram.svg` large; construction note "Three 10-unit strokes on a 20-unit pitch form I, T and a nested rounded D. The strokes are the rails; the gaps are the ballast."; lockups: monogram only, horizontal lockup (`assets/itd-lockup.svg`), reversed (`assets/itd-monogram-white.svg` on `#333333`). Clear space: "Keep clear space equal to 3 stroke gaps (60 units) on every side." Minimum size: "Monogram 24 px tall; lockup 120 px wide." Misuse list (6 items, each with a small crossed-out demo using CSS transforms/filters on the SVG): outline the strokes, apply gradients, rotate, stretch, recolor individual strokes, place on busy imagery.
3. `id="color"` — Swatch grid; each swatch shows name, HEX, RGB, role:
   - Studio Grey `#C4C4C4` rgb(196,196,196) — primary ground
   - Light Grey `#D9D9D9` rgb(217,217,217) — cards, raised surfaces
   - Ink `#1C1B1F` rgb(28,27,31) — headlines, logo
   - Graphite `#333333` rgb(51,51,51) — body text, dark sections
   - Slate `#3B3942` rgb(59,57,66) — secondary text on grey
   - Muted `#787582` rgb(120,117,130) — captions, disabled
   - Machine Grey `#9A9A9A` rgb(154,154,154) — illustration machinery
   - Tie Orange `#ED9833` rgb(237,152,51) — railroad ties, primary accent
   - Kiln Pink `#F861D6` rgb(248,97,214) — kiln/heat, links, rail map lines (hover `#EB5FCB`)
   - Carbon Green `#00C472` rgb(0,196,114) — earth, value, success
   - Biochar `#2E2A36` rgb(46,42,54) — carbon product
   Proportion bar: 70% greys / 20% Ink+Graphite / 10% accents. Accent rule callout: "Only the material being transformed gets color. Machines stay grey."
4. `id="typography"` — "Official typeface: DINPro (Regular, Medium). Web and kiosk substitute: Barlow (SIL Open Font License) — Barlow 400 for DINPro Regular, Barlow 500/600 for DINPro Medium." Specimens: stacked headline `Our / story`; stat style `2 million` + label `ties per year`; label style (500, 14px, letter-spacing .02em); body paragraph (400, 18px/1.5). Type scale table: Display 112/0.95/500, H2 64/1.0/500, Stat 56/1.0/600, Body 18/1.5/400, Label 14/1.2/500.
5. `id="illustration"` — Rules list: isometric three-quarter view; matte Machine Grey machinery with rounded bevels; no outlines or textures; one accent material per scene (ties orange, kiln charge pink, biochar `#2E2A36`, land green); soft upper-left key light; long, very diffuse contact shadow; seamless floor equal to the page ground; translucent vessels with a bright rim. Reference gallery using the six `assets/ref/*.jpg` with captions (Track & ties, Gondola & switcher, Tie grading, Shredder, Kiln, Biochar). "3D build kit" table: camera = orthographic, rotation X 35.26°, Y −45°; key light = directional from (−0.4, 0.8, 0.6), intensity 1.6; ambient 0.55; materials = standard, roughness 0.8, metalness 0; shadow = radial blob, 25% black, offset toward −X.
6. `id="iconography"` — "Icons are chunky extruded glyphs: 12% stroke weight, 4-unit extrusion, soft drop shadow, single accent color." Demo: CSS-built ↗ arrow in Kiln Pink and a $ coin in Carbon Green, each with `filter: drop-shadow(8px 14px 18px rgba(0,0,0,.18))`.
7. `id="crt"` — Headline `In / the / tube`. Rules: phosphor-safe accents (inside the tube use Tie Orange `#E89A45`, Kiln Pink `#EE6BD2`, Carbon Green `#18BE78` — 6–8% desaturated to limit mask bleed); minimum text under the mask 28 px body / 20 px labels at 1080p; only accents and white may bloom; never place thin (<3 px) strokes horizontally — they alias against scanlines. Preview: a 16:9 box showing the headline `Have / Some Fun / At AREMA` on Studio Grey with a CSS aperture-grille overlay (`repeating-linear-gradient(90deg, rgba(255,0,0,.18) 0 1px, rgba(0,255,0,.18) 1px 2px, rgba(0,0,255,.18) 2px 3px)`), scanlines (`repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px)`), inset vignette `box-shadow: inset 0 0 120px rgba(0,0,0,.55)`, and `border-radius: 28px / 22px`.

- [ ] **Step 6: Run the check to verify it passes**

Run: `node brand/check.mjs`
Expected: `brand guide OK`

- [ ] **Step 7: Publish the guide as a private Artifact**

Call the Artifact tool with `file_path` = `brand/index.html`, `favicon` = `🛤️`, `icon` = `guide`, `description` = `Brand identity guide for International Tie Disposal: logo, color, type, illustration and CRT rules.`, and `files` map:
```json
{
  "assets/itd-monogram.svg": "brand/assets/itd-monogram.svg",
  "assets/itd-monogram-white.svg": "brand/assets/itd-monogram-white.svg",
  "assets/itd-lockup.svg": "brand/assets/itd-lockup.svg",
  "assets/ref/track.jpg": "brand/assets/ref/track.jpg",
  "assets/ref/train.jpg": "brand/assets/ref/train.jpg",
  "assets/ref/grading.jpg": "brand/assets/ref/grading.jpg",
  "assets/ref/shredder.jpg": "brand/assets/ref/shredder.jpg",
  "assets/ref/kiln.jpg": "brand/assets/ref/kiln.jpg",
  "assets/ref/biochar.jpg": "brand/assets/ref/biochar.jpg"
}
```
Expected: a claude.ai artifact URL. Record it in the task report.

- [ ] **Step 8: Commit**

```bash
git add brand
git commit -m "Add ITD brand identity guide and monogram assets

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Part B — Launchboard App

### Task 2: Scaffold the launchboard app, config, brand tokens

**Files:**
- Create: `launchboard/package.json`, `launchboard/tsconfig.json`, `launchboard/vite.config.ts`, `launchboard/index.html`, `launchboard/.gitignore`
- Create: `launchboard/public/fonts/Barlow-Regular.ttf`, `Barlow-Medium.ttf`, `Barlow-SemiBold.ttf`, `OFL.txt`
- Create: `launchboard/src/main.tsx`, `launchboard/src/App.tsx` (temporary), `launchboard/src/asset.ts`, `launchboard/src/config.ts`, `launchboard/src/brand.ts`
- Test: `launchboard/tests/config.test.ts`

**Interfaces:**
- Produces:
  - `asset(path: string): string` — prefixes `import.meta.env.BASE_URL`.
  - `config: AppConfig`, `tickerItems(c?: AppConfig): string[]`, `readUrlOverrides(search: string): UrlOverrides`, `effectiveConfig(search: string): AppConfig`
  - `type QualitySetting = 'auto' | 'pro' | 'standard' | 'safe'`
  - `type AppConfig = { title: string; headlineLines: string[]; subcopy: string; boothNumber: string; tickerLines: string[]; idleToAttractMs: number; gameIdleExitMs: number; defaultQuality: QualitySetting }`
  - `type UrlOverrides = { e2e: boolean; debug: boolean; idleToAttractMs?: number; gameIdleExitMs?: number }`
  - `colors` (brand hex strings), `tubeColors` (phosphor-safe accents), `fonts` (`regular|medium|semibold` → asset URL), `MONOGRAM_PATHS: string[]`, `MONOGRAM_VIEWBOX = { w: 287, h: 246 }`, `MONOGRAM_STROKE = 10`

- [ ] **Step 1: Create package and tooling files**

`launchboard/package.json`:
```json
{
  "name": "arema-launchboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "test": "vitest run",
    "e2e": "playwright test"
  }
}
```

Run:
```bash
cd launchboard
npm install react@^19.3.0 react-dom@^19.3.0 three@~0.186.0 @react-three/fiber@^9.7.0 @react-three/drei@^10.7.8 zustand@^5.0.15
npm install -D vite@^8.3.0 @vitejs/plugin-react@^6.1.1 typescript@~5.9.0 @types/react@^19 @types/react-dom@^19 @types/three@~0.186.0 vitest@^5.0.0 @playwright/test@^1.63.0
```
Expected: installs without peer-dependency errors. (If npm reports an ERESOLVE peer conflict between vitest 5 and vite 8, install the vitest version whose `peerDependencies.vite` includes `^8` — check with `npm view vitest@5 peerDependencies`.)

`launchboard/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests", "e2e", "vite.config.ts", "playwright.config.ts"]
}
```

`launchboard/vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ITDconference/' : '/',
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
```

`launchboard/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Have Some Fun At AREMA</title>
    <style>
      html, body, #root { margin: 0; height: 100%; background: #0b0b0c; overflow: hidden; }
      body.cursor-hidden, body.cursor-hidden * { cursor: none !important; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`launchboard/.gitignore`:
```
node_modules
dist
test-results
playwright-report
```

- [ ] **Step 2: Download Barlow fonts**

Run:
```bash
mkdir -p launchboard/public/fonts
cd launchboard/public/fonts
for f in Regular Medium SemiBold; do curl -sSL -o Barlow-$f.ttf https://github.com/google/fonts/raw/main/ofl/barlow/Barlow-$f.ttf; done
curl -sSL -o OFL.txt https://github.com/google/fonts/raw/main/ofl/barlow/OFL.txt
ls -la
```
Expected: three `.ttf` files each > 50 KB, and `OFL.txt`.

- [ ] **Step 3: Write the failing config test**

`launchboard/tests/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { config, tickerItems, readUrlOverrides, effectiveConfig } from '../src/config';
import { asset } from '../src/asset';
import { colors, MONOGRAM_PATHS } from '../src/brand';

describe('config', () => {
  it('has the spec defaults', () => {
    expect(config.title).toBe('Have Some Fun At AREMA');
    expect(config.headlineLines).toEqual(['Have', 'Some Fun', 'At AREMA']);
    expect(config.idleToAttractMs).toBe(60000);
    expect(config.gameIdleExitMs).toBe(120000);
    expect(config.boothNumber).toBe('');
  });

  it('omits the booth segment when boothNumber is empty', () => {
    expect(tickerItems(config)).toEqual(config.tickerLines);
  });

  it('appends the booth segment when set', () => {
    expect(tickerItems({ ...config, boothNumber: '1204' }).at(-1)).toBe('Booth #1204');
  });

  it('reads URL overrides', () => {
    expect(readUrlOverrides('?e2e&debug&idle=1500&gameidle=900')).toEqual({
      e2e: true, debug: true, idleToAttractMs: 1500, gameIdleExitMs: 900,
    });
    expect(readUrlOverrides('')).toEqual({ e2e: false, debug: false });
    expect(readUrlOverrides('?idle=abc')).toEqual({ e2e: false, debug: false });
  });

  it('merges overrides into effective config', () => {
    const c = effectiveConfig('?idle=2000');
    expect(c.idleToAttractMs).toBe(2000);
    expect(c.gameIdleExitMs).toBe(120000);
  });
});

describe('asset', () => {
  it('prefixes BASE_URL and strips a leading slash', () => {
    expect(asset('/fonts/Barlow-Medium.ttf')).toBe('/fonts/Barlow-Medium.ttf');
    expect(asset('fonts/Barlow-Medium.ttf')).toBe('/fonts/Barlow-Medium.ttf');
  });
});

describe('brand', () => {
  it('exposes exact brand colors and 6 monogram paths', () => {
    expect(colors.tieOrange).toBe('#ED9833');
    expect(colors.kilnPink).toBe('#F861D6');
    expect(colors.studioGrey).toBe('#C4C4C4');
    expect(MONOGRAM_PATHS).toHaveLength(6);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd launchboard && npx vitest run tests/config.test.ts`
Expected: FAIL — cannot resolve `../src/config`.

- [ ] **Step 5: Implement `asset.ts`, `config.ts`, `brand.ts`**

`launchboard/src/asset.ts`:
```ts
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
```

`launchboard/src/config.ts`:
```ts
export type QualitySetting = 'auto' | 'pro' | 'standard' | 'safe';

export type AppConfig = {
  title: string;
  headlineLines: string[];
  subcopy: string;
  boothNumber: string;
  tickerLines: string[];
  idleToAttractMs: number;
  gameIdleExitMs: number;
  defaultQuality: QualitySetting;
};

export const config: AppConfig = {
  title: 'Have Some Fun At AREMA',
  headlineLines: ['Have', 'Some Fun', 'At AREMA'],
  subcopy: 'Pick a game. Beat the yard.',
  boothNumber: '',
  tickerLines: ['Hamlet, NC', '2 million ties per year', 'Rail access: 50,000 ties per week', 'tiedisposal.com'],
  idleToAttractMs: 60000,
  gameIdleExitMs: 120000,
  defaultQuality: 'auto',
};

export function tickerItems(c: AppConfig = config): string[] {
  return c.boothNumber ? [...c.tickerLines, `Booth #${c.boothNumber}`] : [...c.tickerLines];
}

export type UrlOverrides = { e2e: boolean; debug: boolean; idleToAttractMs?: number; gameIdleExitMs?: number };

function positiveInt(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export function readUrlOverrides(search: string): UrlOverrides {
  const p = new URLSearchParams(search);
  const out: UrlOverrides = { e2e: p.has('e2e'), debug: p.has('debug') };
  const idle = positiveInt(p.get('idle'));
  const gameIdle = positiveInt(p.get('gameidle'));
  if (idle !== undefined) out.idleToAttractMs = idle;
  if (gameIdle !== undefined) out.gameIdleExitMs = gameIdle;
  return out;
}

export function effectiveConfig(search: string): AppConfig {
  const o = readUrlOverrides(search);
  return {
    ...config,
    idleToAttractMs: o.idleToAttractMs ?? config.idleToAttractMs,
    gameIdleExitMs: o.gameIdleExitMs ?? config.gameIdleExitMs,
  };
}
```

`launchboard/src/brand.ts`:
```ts
import { asset } from './asset';

export const colors = {
  studioGrey: '#C4C4C4',
  lightGrey: '#D9D9D9',
  ink: '#1C1B1F',
  graphite: '#333333',
  slate: '#3B3942',
  muted: '#787582',
  machineGrey: '#9A9A9A',
  tieOrange: '#ED9833',
  kilnPink: '#F861D6',
  kilnPinkHover: '#EB5FCB',
  carbonGreen: '#00C472',
  biochar: '#2E2A36',
  white: '#FFFFFF',
} as const;

/** Phosphor-safe accents for use inside the tube (brand guide, CRT section). */
export const tubeColors = {
  tieOrange: '#E89A45',
  kilnPink: '#EE6BD2',
  carbonGreen: '#18BE78',
} as const;

export const fonts = {
  regular: asset('fonts/Barlow-Regular.ttf'),
  medium: asset('fonts/Barlow-Medium.ttf'),
  semibold: asset('fonts/Barlow-SemiBold.ttf'),
} as const;

export const MONOGRAM_VIEWBOX = { w: 287, h: 246 } as const;
export const MONOGRAM_STROKE = 10;

/** Stroke centerlines in SVG coordinates (y down). Measured from the tiedisposal.com logo. */
export const MONOGRAM_PATHS: string[] = [
  'M5 78V246M25 78V246M45 78V246',
  'M0 5H225A57 57 0 0 1 282 62V184A57 57 0 0 1 225 241H164V78',
  'M0 25H225A38 38 0 0 1 263 63V183A38 38 0 0 1 225 221H183V78',
  'M0 45H84V246',
  'M104 25V246',
  'M124 246V45H225A18 18 0 0 1 243 63V183A18 18 0 0 1 225 201H203V78',
];
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd launchboard && npx vitest run tests/config.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Add a temporary App and entry so the build runs**

`launchboard/src/App.tsx`:
```tsx
export default function App() {
  return <div style={{ color: '#C4C4C4', font: '24px sans-serif', padding: 24 }}>Launchboard scaffold</div>;
}
```

`launchboard/src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Run: `cd launchboard && npm run build`
Expected: type-check passes, build writes `dist/`.

- [ ] **Step 8: Commit**

```bash
git add launchboard
git commit -m "Scaffold launchboard app with config and brand tokens

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: App store and idle rule

**Files:**
- Create: `launchboard/src/state/idle.ts`, `launchboard/src/state/store.ts`
- Test: `launchboard/tests/idle.test.ts`, `launchboard/tests/store.test.ts`

**Interfaces:**
- Produces:
  - `type Screen = 'boot' | 'attract' | 'board' | 'game'`
  - `type QualityPreset = 'pro' | 'standard' | 'safe'`
  - `nextScreenForIdle(screen: Screen, lastInputAt: number, now: number, cfg: { idleToAttractMs: number; gameIdleExitMs: number }): Screen | null`
  - `createAppStore(initial?: Partial<AppData>): StoreApi<AppState>`; singleton `appStore`; hook `useApp<T>(selector: (s: AppState) => T): T`
  - `AppData = { screen: Screen; focusIndex: number; activeGameId: string | null; quality: QualityPreset; qualityOverride: QualityPreset | null; debug: boolean; lastInputAt: number; contextLost: boolean }`
  - `AppActions = { bootDone(): void; toAttract(): void; toBoard(): void; launch(id: string): void; exitGame(): void; setFocus(i: number): void; markInput(now: number): void; setQuality(q: QualityPreset): void; cycleQualityOverride(): void; toggleDebug(): void; setContextLost(v: boolean): void }`
  - `AppState = AppData & AppActions`
  - `QUALITY_STORAGE_KEY = 'arema.qualityOverride'`

- [ ] **Step 1: Write failing tests**

`launchboard/tests/idle.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { nextScreenForIdle } from '../src/state/idle';

const cfg = { idleToAttractMs: 60000, gameIdleExitMs: 120000 };

describe('nextScreenForIdle', () => {
  it('sends an idle board to attract', () => {
    expect(nextScreenForIdle('board', 0, 60000, cfg)).toBe('attract');
  });
  it('keeps an active board', () => {
    expect(nextScreenForIdle('board', 0, 59999, cfg)).toBeNull();
  });
  it('sends an idle game back to the board', () => {
    expect(nextScreenForIdle('game', 1000, 121000, cfg)).toBe('board');
    expect(nextScreenForIdle('game', 1000, 120999, cfg)).toBeNull();
  });
  it('never changes boot or attract', () => {
    expect(nextScreenForIdle('boot', 0, 1e9, cfg)).toBeNull();
    expect(nextScreenForIdle('attract', 0, 1e9, cfg)).toBeNull();
  });
});
```

`launchboard/tests/store.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createAppStore } from '../src/state/store';

describe('app store', () => {
  it('starts in boot on the pro preset', () => {
    const s = createAppStore();
    expect(s.getState().screen).toBe('boot');
    expect(s.getState().quality).toBe('pro');
  });

  it('walks boot → attract → board → game → board', () => {
    const s = createAppStore();
    s.getState().bootDone();
    expect(s.getState().screen).toBe('attract');
    s.getState().toBoard();
    expect(s.getState().screen).toBe('board');
    s.getState().launch('test-pattern');
    expect(s.getState()).toMatchObject({ screen: 'game', activeGameId: 'test-pattern' });
    s.getState().exitGame();
    expect(s.getState()).toMatchObject({ screen: 'board', activeGameId: null });
  });

  it('ignores launch unless on the board', () => {
    const s = createAppStore();
    s.getState().launch('x');
    expect(s.getState().screen).toBe('boot');
  });

  it('bootDone only acts during boot', () => {
    const s = createAppStore({ screen: 'board' });
    s.getState().bootDone();
    expect(s.getState().screen).toBe('board');
  });

  it('cycles quality override none → pro → standard → safe → none', () => {
    const s = createAppStore();
    s.getState().cycleQualityOverride();
    expect(s.getState()).toMatchObject({ qualityOverride: 'pro', quality: 'pro' });
    s.getState().cycleQualityOverride();
    expect(s.getState()).toMatchObject({ qualityOverride: 'standard', quality: 'standard' });
    s.getState().cycleQualityOverride();
    expect(s.getState()).toMatchObject({ qualityOverride: 'safe', quality: 'safe' });
    s.getState().cycleQualityOverride();
    // Clearing the override returns to the full tube so a staff member is never stuck in the fallback
    expect(s.getState()).toMatchObject({ qualityOverride: null, quality: 'pro' });
  });

  it('ignores setQuality while an override is set', () => {
    const s = createAppStore({ qualityOverride: 'pro', quality: 'pro' });
    s.getState().setQuality('standard');
    expect(s.getState().quality).toBe('pro');
  });

  it('records input time, focus, debug and context loss', () => {
    const s = createAppStore();
    s.getState().markInput(1234);
    s.getState().setFocus(4);
    s.getState().toggleDebug();
    s.getState().setContextLost(true);
    expect(s.getState()).toMatchObject({ lastInputAt: 1234, focusIndex: 4, debug: true, contextLost: true });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd launchboard && npx vitest run tests/idle.test.ts tests/store.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`launchboard/src/state/idle.ts`:
```ts
export type Screen = 'boot' | 'attract' | 'board' | 'game';

export function nextScreenForIdle(
  screen: Screen,
  lastInputAt: number,
  now: number,
  cfg: { idleToAttractMs: number; gameIdleExitMs: number },
): Screen | null {
  const idle = now - lastInputAt;
  if (screen === 'board' && idle >= cfg.idleToAttractMs) return 'attract';
  if (screen === 'game' && idle >= cfg.gameIdleExitMs) return 'board';
  return null;
}
```

`launchboard/src/state/store.ts`:
```ts
import { createStore, useStore, type StoreApi } from 'zustand';
import type { Screen } from './idle';

export type { Screen } from './idle';
export type QualityPreset = 'pro' | 'standard' | 'safe';
export const QUALITY_STORAGE_KEY = 'arema.qualityOverride';

export type AppData = {
  screen: Screen;
  focusIndex: number;
  activeGameId: string | null;
  quality: QualityPreset;
  qualityOverride: QualityPreset | null;
  debug: boolean;
  lastInputAt: number;
  contextLost: boolean;
};

export type AppActions = {
  bootDone(): void;
  toAttract(): void;
  toBoard(): void;
  launch(id: string): void;
  exitGame(): void;
  setFocus(i: number): void;
  markInput(now: number): void;
  setQuality(q: QualityPreset): void;
  cycleQualityOverride(): void;
  toggleDebug(): void;
  setContextLost(v: boolean): void;
};

export type AppState = AppData & AppActions;

const OVERRIDE_CYCLE: (QualityPreset | null)[] = [null, 'pro', 'standard', 'safe'];

export function createAppStore(initial: Partial<AppData> = {}): StoreApi<AppState> {
  return createStore<AppState>()((set, get) => ({
    screen: 'boot',
    focusIndex: 0,
    activeGameId: null,
    quality: 'pro',
    qualityOverride: null,
    debug: false,
    lastInputAt: 0,
    contextLost: false,
    ...initial,
    bootDone: () => { if (get().screen === 'boot') set({ screen: 'attract' }); },
    toAttract: () => set({ screen: 'attract', activeGameId: null }),
    toBoard: () => set({ screen: 'board', activeGameId: null }),
    launch: (id) => { if (get().screen === 'board') set({ screen: 'game', activeGameId: id }); },
    exitGame: () => { if (get().screen === 'game') set({ screen: 'board', activeGameId: null }); },
    setFocus: (i) => set({ focusIndex: i }),
    markInput: (now) => set({ lastInputAt: now }),
    setQuality: (q) => { if (get().qualityOverride === null) set({ quality: q }); },
    cycleQualityOverride: () => {
      const i = OVERRIDE_CYCLE.indexOf(get().qualityOverride);
      const next = OVERRIDE_CYCLE[(i + 1) % OVERRIDE_CYCLE.length];
      set(next === null ? { qualityOverride: null, quality: 'pro' } : { qualityOverride: next, quality: next });
    },
    toggleDebug: () => set({ debug: !get().debug }),
    setContextLost: (v) => set({ contextLost: v }),
  }));
}

export const appStore = createAppStore();

export function useApp<T>(selector: (s: AppState) => T): T {
  return useStore(appStore, selector);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd launchboard && npx vitest run tests/idle.test.ts tests/store.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add launchboard/src/state launchboard/tests/idle.test.ts launchboard/tests/store.test.ts
git commit -m "Add app store and idle transition rule

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Focus navigation, input mapping, input bus

**Files:**
- Create: `launchboard/src/ui/focus.ts`, `launchboard/src/ui/input.ts`, `launchboard/src/ui/inputBus.ts`
- Test: `launchboard/tests/focus.test.ts`, `launchboard/tests/input.test.ts`

**Interfaces:**
- Produces:
  - `type Direction = 'up' | 'down' | 'left' | 'right'`
  - `moveFocus(index: number, dir: Direction, cols?: number, count?: number): number` — defaults cols 3, count 6. Left/right wrap through the whole list; up/down move by `cols` and stay put if the target is out of range.
  - `type Action = Direction | 'select' | 'back'`
  - `keyToAction(key: string): Action | null`
  - `type PadSnapshot = { up: boolean; down: boolean; left: boolean; right: boolean; select: boolean; back: boolean }`, `EMPTY_PAD`
  - `readPad(pad: { buttons: ReadonlyArray<{ pressed: boolean }>; axes: ReadonlyArray<number> }): PadSnapshot`
  - `padEdges(prev: PadSnapshot, next: PadSnapshot): Action[]` — rising edges in order up, down, left, right, select, back
  - `type InputBus = { emit(a: Action): void; subscribe(fn: (a: Action) => void): () => void }`, `createInputBus(): InputBus`, singleton `inputBus`

- [ ] **Step 1: Write failing tests**

`launchboard/tests/focus.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { moveFocus } from '../src/ui/focus';

describe('moveFocus on a 3×2 grid', () => {
  it('moves right and wraps from the last tile to the first', () => {
    expect(moveFocus(0, 'right')).toBe(1);
    expect(moveFocus(2, 'right')).toBe(3);
    expect(moveFocus(5, 'right')).toBe(0);
  });
  it('moves left and wraps from the first tile to the last', () => {
    expect(moveFocus(1, 'left')).toBe(0);
    expect(moveFocus(0, 'left')).toBe(5);
  });
  it('moves down/up by a row and stays put at edges', () => {
    expect(moveFocus(1, 'down')).toBe(4);
    expect(moveFocus(4, 'down')).toBe(4);
    expect(moveFocus(4, 'up')).toBe(1);
    expect(moveFocus(1, 'up')).toBe(1);
  });
  it('supports other grid sizes', () => {
    expect(moveFocus(3, 'down', 4, 6)).toBe(3);
    expect(moveFocus(1, 'down', 4, 6)).toBe(5);
  });
});
```

`launchboard/tests/input.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { keyToAction, readPad, padEdges, EMPTY_PAD } from '../src/ui/input';
import { createInputBus } from '../src/ui/inputBus';

function pad(pressed: number[], axes: number[] = [0, 0]) {
  return { buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i) })), axes };
}

describe('keyToAction', () => {
  it('maps arrows, enter/space and escape/backspace', () => {
    expect(keyToAction('ArrowUp')).toBe('up');
    expect(keyToAction('ArrowDown')).toBe('down');
    expect(keyToAction('ArrowLeft')).toBe('left');
    expect(keyToAction('ArrowRight')).toBe('right');
    expect(keyToAction('Enter')).toBe('select');
    expect(keyToAction(' ')).toBe('select');
    expect(keyToAction('Escape')).toBe('back');
    expect(keyToAction('Backspace')).toBe('back');
    expect(keyToAction('q')).toBeNull();
  });
});

describe('gamepad', () => {
  it('reads d-pad, A/B and left stick', () => {
    expect(readPad(pad([12, 0]))).toMatchObject({ up: true, select: true, down: false });
    expect(readPad(pad([1]))).toMatchObject({ back: true });
    expect(readPad(pad([], [-0.8, 0.9]))).toMatchObject({ left: true, down: true, right: false, up: false });
    expect(readPad(pad([], [0.3, -0.3]))).toEqual(EMPTY_PAD);
  });
  it('emits only rising edges', () => {
    const a = readPad(pad([15]));
    expect(padEdges(EMPTY_PAD, a)).toEqual(['right']);
    expect(padEdges(a, a)).toEqual([]);
    expect(padEdges(a, readPad(pad([15, 0])))).toEqual(['select']);
  });
});

describe('inputBus', () => {
  it('delivers to subscribers until unsubscribed', () => {
    const bus = createInputBus();
    const fn = vi.fn();
    const off = bus.subscribe(fn);
    bus.emit('select');
    off();
    bus.emit('back');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('select');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd launchboard && npx vitest run tests/focus.test.ts tests/input.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`launchboard/src/ui/focus.ts`:
```ts
export type Direction = 'up' | 'down' | 'left' | 'right';

export function moveFocus(index: number, dir: Direction, cols = 3, count = 6): number {
  switch (dir) {
    case 'right': return (index + 1) % count;
    case 'left': return (index - 1 + count) % count;
    case 'down': return index + cols < count ? index + cols : index;
    case 'up': return index - cols >= 0 ? index - cols : index;
  }
}
```

`launchboard/src/ui/input.ts`:
```ts
import type { Direction } from './focus';

export type Action = Direction | 'select' | 'back';

const KEYS: Record<string, Action> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  Enter: 'select', ' ': 'select', Escape: 'back', Backspace: 'back',
};

export function keyToAction(key: string): Action | null {
  return KEYS[key] ?? null;
}

export type PadSnapshot = { up: boolean; down: boolean; left: boolean; right: boolean; select: boolean; back: boolean };
export const EMPTY_PAD: PadSnapshot = { up: false, down: false, left: false, right: false, select: false, back: false };

const STICK = 0.5;

export function readPad(pad: { buttons: ReadonlyArray<{ pressed: boolean }>; axes: ReadonlyArray<number> }): PadSnapshot {
  const b = (i: number) => pad.buttons[i]?.pressed ?? false;
  const x = pad.axes[0] ?? 0;
  const y = pad.axes[1] ?? 0;
  return {
    up: b(12) || y < -STICK,
    down: b(13) || y > STICK,
    left: b(14) || x < -STICK,
    right: b(15) || x > STICK,
    select: b(0),
    back: b(1),
  };
}

const ORDER: Action[] = ['up', 'down', 'left', 'right', 'select', 'back'];

export function padEdges(prev: PadSnapshot, next: PadSnapshot): Action[] {
  return ORDER.filter((a) => next[a] && !prev[a]);
}
```

`launchboard/src/ui/inputBus.ts`:
```ts
import type { Action } from './input';

export type InputBus = { emit(a: Action): void; subscribe(fn: (a: Action) => void): () => void };

export function createInputBus(): InputBus {
  const subs = new Set<(a: Action) => void>();
  return {
    emit: (a) => { for (const fn of [...subs]) fn(a); },
    subscribe: (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}

export const inputBus = createInputBus();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd launchboard && npx vitest run tests/focus.test.ts tests/input.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add launchboard/src/ui launchboard/tests/focus.test.ts launchboard/tests/input.test.ts
git commit -m "Add focus navigation, input mapping and input bus

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Game contract and registry

**Files:**
- Create: `launchboard/src/games/types.ts`, `launchboard/src/games/registry.ts`, `launchboard/src/games/test-pattern/TestPattern.tsx` (stub; filled in Task 14)
- Test: `launchboard/tests/registry.test.ts`

**Interfaces:**
- Consumes: `InputBus` (Task 4), `QualityPreset` (Task 3).
- Produces:
  - `type Accent = 'orange' | 'pink' | 'green'`
  - `type IllustrationId = 'tieStack' | 'train' | 'shredder' | 'kiln' | 'crossing' | 'globe'`
  - `type PulseKind = 'boot' | 'channel' | 'static' | 'flash' | 'roll'`
  - `type GameContext = { exit(): void; input: InputBus; tube: { pulse(kind: PulseKind): void }; quality: QualityPreset }`
  - `type GameComponent = ComponentType<{ ctx: GameContext }>`
  - `type GameDefinition = { id: string; title: string; accent: Accent; illustration: IllustrationId; status: 'playable' | 'coming-soon'; load?: () => Promise<{ default: GameComponent }> }`
  - `BASE_GAMES: GameDefinition[]`, `GRID_COUNT = 6`, `TEST_PATTERN_ID = 'test-pattern'`
  - `buildRegistry(opts: { includeTestPattern: boolean }): GameDefinition[]`
  - `validateRegistry(games: GameDefinition[]): string[]`

- [ ] **Step 1: Write the failing test**

`launchboard/tests/registry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BASE_GAMES, buildRegistry, validateRegistry, TEST_PATTERN_ID, type GameDefinition } from '../src/games/registry';

describe('registry', () => {
  it('ships six coming-soon slots with distinct illustrations', () => {
    expect(BASE_GAMES).toHaveLength(6);
    expect(BASE_GAMES.every((g) => g.status === 'coming-soon')).toBe(true);
    expect(new Set(BASE_GAMES.map((g) => g.illustration)).size).toBe(6);
    expect(BASE_GAMES.every((g) => g.title === 'Coming soon...')).toBe(true);
  });

  it('is valid with and without the test pattern', () => {
    expect(validateRegistry(buildRegistry({ includeTestPattern: false }))).toEqual([]);
    expect(validateRegistry(buildRegistry({ includeTestPattern: true }))).toEqual([]);
  });

  it('puts the test pattern in slot 0 only when requested', () => {
    expect(buildRegistry({ includeTestPattern: false })[0].id).not.toBe(TEST_PATTERN_ID);
    const withTest = buildRegistry({ includeTestPattern: true });
    expect(withTest).toHaveLength(6);
    expect(withTest[0]).toMatchObject({ id: TEST_PATTERN_ID, status: 'playable' });
    expect(typeof withTest[0].load).toBe('function');
  });

  it('reports wrong length, duplicate ids and missing loaders', () => {
    const bad: GameDefinition[] = [
      { id: 'a', title: 'A', accent: 'orange', illustration: 'tieStack', status: 'playable' },
      { id: 'a', title: 'B', accent: 'pink', illustration: 'kiln', status: 'coming-soon' },
    ];
    expect(validateRegistry(bad)).toEqual([
      'expected 6 games, got 2',
      'duplicate id "a"',
      'playable game "a" has no load()',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd launchboard && npx vitest run tests/registry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`launchboard/src/games/types.ts`:
```ts
import type { ComponentType } from 'react';
import type { InputBus } from '../ui/inputBus';
import type { QualityPreset } from '../state/store';

export type Accent = 'orange' | 'pink' | 'green';
export type IllustrationId = 'tieStack' | 'train' | 'shredder' | 'kiln' | 'crossing' | 'globe';
export type PulseKind = 'boot' | 'channel' | 'static' | 'flash' | 'roll';

export type GameContext = {
  exit(): void;
  input: InputBus;
  tube: { pulse(kind: PulseKind): void };
  quality: QualityPreset;
};

export type GameComponent = ComponentType<{ ctx: GameContext }>;

export type GameDefinition = {
  id: string;
  title: string;
  accent: Accent;
  illustration: IllustrationId;
  status: 'playable' | 'coming-soon';
  load?: () => Promise<{ default: GameComponent }>;
};
```

`launchboard/src/games/registry.ts`:
```ts
import type { GameDefinition } from './types';

export type { GameDefinition, GameContext, GameComponent, Accent, IllustrationId, PulseKind } from './types';

export const TEST_PATTERN_ID = 'test-pattern';
export const GRID_COUNT = 6;

const soon = (id: string, illustration: GameDefinition['illustration'], accent: GameDefinition['accent']): GameDefinition => ({
  id, title: 'Coming soon...', accent, illustration, status: 'coming-soon',
});

export const BASE_GAMES: GameDefinition[] = [
  soon('slot-1', 'tieStack', 'orange'),
  soon('slot-2', 'train', 'orange'),
  soon('slot-3', 'shredder', 'orange'),
  soon('slot-4', 'kiln', 'pink'),
  soon('slot-5', 'crossing', 'pink'),
  soon('slot-6', 'globe', 'green'),
];

const TEST_PATTERN: GameDefinition = {
  id: TEST_PATTERN_ID,
  title: 'Test Pattern',
  accent: 'pink',
  illustration: 'tieStack',
  status: 'playable',
  load: () => import('./test-pattern/TestPattern'),
};

export function buildRegistry(opts: { includeTestPattern: boolean }): GameDefinition[] {
  const games = [...BASE_GAMES];
  if (opts.includeTestPattern) games[0] = TEST_PATTERN;
  return games;
}

export function validateRegistry(games: GameDefinition[]): string[] {
  const errors: string[] = [];
  if (games.length !== GRID_COUNT) errors.push(`expected ${GRID_COUNT} games, got ${games.length}`);
  const seen = new Set<string>();
  for (const g of games) {
    if (seen.has(g.id)) errors.push(`duplicate id "${g.id}"`);
    seen.add(g.id);
  }
  for (const g of games) {
    if (g.status === 'playable' && !g.load) errors.push(`playable game "${g.id}" has no load()`);
  }
  return errors;
}
```

`launchboard/src/games/test-pattern/TestPattern.tsx` (stub so the dynamic import resolves):
```tsx
import type { GameContext } from '../types';

export default function TestPattern(_props: { ctx: GameContext }) {
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd launchboard && npx vitest run tests/registry.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add launchboard/src/games launchboard/tests/registry.test.ts
git commit -m "Add game contract and registry

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Tube geometry (layout, barrel mapping, tube mask)

**Files:**
- Create: `launchboard/src/tube/geometry.ts`
- Test: `launchboard/tests/geometry.test.ts`

**Interfaces:**
- Produces (all pure; the GLSL in Task 8 must mirror `barrel` and `insideTube` exactly):
  - `CONTENT_W = 1920`, `CONTENT_H = 1080`
  - `BEZEL = { side: 120, top: 110, bottom: 220 }` (design units), `MONITOR_W = 2160`, `MONITOR_H = 1410`
  - `type Layout = { scale: number; monitorX: number; monitorY: number; monitorW: number; monitorH: number; tubeX: number; tubeY: number; tubeW: number; tubeH: number }` (CSS px, origin top-left of viewport)
  - `computeLayout(viewW: number, viewH: number): Layout`
  - `type UV = { u: number; v: number }` (v = 0 at bottom)
  - `screenToTubeUv(px: number, py: number, layout: Layout): UV`
  - `barrel(uv: UV, k: number): UV` — screen-space tube UV → content UV: `p = uv*2-1; q = p * (1 + k*dot(p,p)) / (1 + 2k); return q*0.5+0.5`
  - `inverseBarrel(uv: UV, k: number): UV` — content UV → tube UV (fixed-point iteration)
  - `insideTube(uv: UV, cornerRadiusPx: number): boolean` — rounded rectangle 1920×1080 with the given corner radius
  - `contentToWorld(uv: UV): { x: number; y: number }`, `worldToContent(x: number, y: number): UV` — centered content coordinates
  - `contentToScreen(x: number, y: number, layout: Layout, k: number): { px: number; py: number }` — for e2e clicking

- [ ] **Step 1: Write the failing test**

`launchboard/tests/geometry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  computeLayout, screenToTubeUv, barrel, inverseBarrel, insideTube,
  contentToWorld, worldToContent, contentToScreen, MONITOR_W, MONITOR_H,
} from '../src/tube/geometry';

describe('computeLayout', () => {
  it('is 1:1 at the monitor design size', () => {
    const l = computeLayout(MONITOR_W, MONITOR_H);
    expect(l).toMatchObject({ scale: 1, monitorX: 0, monitorY: 0, tubeX: 120, tubeY: 110, tubeW: 1920, tubeH: 1080 });
  });
  it('letterboxes horizontally on a 1920×1080 viewport', () => {
    const l = computeLayout(1920, 1080);
    expect(l.scale).toBeCloseTo(1080 / 1410, 6);
    expect(l.monitorY).toBeCloseTo(0, 6);
    expect(l.monitorX).toBeCloseTo((1920 - 2160 * l.scale) / 2, 6);
    expect(l.tubeW / l.tubeH).toBeCloseTo(16 / 9, 6);
  });
});

describe('screenToTubeUv', () => {
  it('maps tube corners to UV corners with v up', () => {
    const l = computeLayout(MONITOR_W, MONITOR_H);
    expect(screenToTubeUv(120, 110, l)).toEqual({ u: 0, v: 1 });
    expect(screenToTubeUv(120 + 1920, 110 + 1080, l)).toEqual({ u: 1, v: 0 });
  });
});

describe('barrel', () => {
  const k = 0.1;
  it('keeps the center and the corners fixed', () => {
    expect(barrel({ u: 0.5, v: 0.5 }, k)).toEqual({ u: 0.5, v: 0.5 });
    const c = barrel({ u: 1, v: 1 }, k);
    expect(c.u).toBeCloseTo(1, 9);
    expect(c.v).toBeCloseTo(1, 9);
  });
  it('pulls edge midpoints inward (content bulges out past the edge)', () => {
    const m = barrel({ u: 1, v: 0.5 }, k);
    expect(m.u).toBeCloseTo((1.1 / 1.2 + 1) / 2, 9);
    expect(m.v).toBeCloseTo(0.5, 9);
  });
  it('is the identity when k = 0', () => {
    expect(barrel({ u: 0.2, v: 0.7 }, 0)).toEqual({ u: 0.2, v: 0.7 });
  });
  it('round-trips through inverseBarrel', () => {
    for (const uv of [{ u: 0.1, v: 0.9 }, { u: 0.73, v: 0.31 }, { u: 0.5, v: 0.02 }]) {
      const back = barrel(inverseBarrel(uv, 0.06), 0.06);
      expect(back.u).toBeCloseTo(uv.u, 6);
      expect(back.v).toBeCloseTo(uv.v, 6);
    }
  });
});

describe('insideTube', () => {
  it('rejects points outside the unit square and in rounded corners', () => {
    expect(insideTube({ u: 0.5, v: 0.5 }, 42)).toBe(true);
    expect(insideTube({ u: -0.01, v: 0.5 }, 42)).toBe(false);
    expect(insideTube({ u: 0, v: 0 }, 42)).toBe(false);
    expect(insideTube({ u: 0.5 / 1920 * 42 * 2, v: 0.5 }, 42)).toBe(true);
    expect(insideTube({ u: 0, v: 0 }, 0)).toBe(true);
  });
});

describe('content ↔ world ↔ screen', () => {
  it('converts between content UV and centered world coordinates', () => {
    expect(contentToWorld({ u: 0, v: 0 })).toEqual({ x: -960, y: -540 });
    expect(worldToContent(960, 540)).toEqual({ u: 1, v: 1 });
  });
  it('contentToScreen inverts the pointer mapping', () => {
    const l = computeLayout(1920, 1080);
    const k = 0.06;
    const { px, py } = contentToScreen(-55, 270, l, k);
    const back = contentToWorld(barrel(screenToTubeUv(px, py, l), k));
    expect(back.x).toBeCloseTo(-55, 3);
    expect(back.y).toBeCloseTo(270, 3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd launchboard && npx vitest run tests/geometry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`launchboard/src/tube/geometry.ts`:
```ts
export const CONTENT_W = 1920;
export const CONTENT_H = 1080;
export const BEZEL = { side: 120, top: 110, bottom: 220 } as const;
export const MONITOR_W = CONTENT_W + BEZEL.side * 2;
export const MONITOR_H = CONTENT_H + BEZEL.top + BEZEL.bottom;

export type Layout = {
  scale: number;
  monitorX: number; monitorY: number; monitorW: number; monitorH: number;
  tubeX: number; tubeY: number; tubeW: number; tubeH: number;
};

export type UV = { u: number; v: number };

export function computeLayout(viewW: number, viewH: number): Layout {
  const scale = Math.min(viewW / MONITOR_W, viewH / MONITOR_H);
  const monitorW = MONITOR_W * scale;
  const monitorH = MONITOR_H * scale;
  const monitorX = (viewW - monitorW) / 2;
  const monitorY = (viewH - monitorH) / 2;
  return {
    scale, monitorX, monitorY, monitorW, monitorH,
    tubeX: monitorX + BEZEL.side * scale,
    tubeY: monitorY + BEZEL.top * scale,
    tubeW: CONTENT_W * scale,
    tubeH: CONTENT_H * scale,
  };
}

export function screenToTubeUv(px: number, py: number, l: Layout): UV {
  return { u: (px - l.tubeX) / l.tubeW, v: 1 - (py - l.tubeY) / l.tubeH };
}

export function barrel(uv: UV, k: number): UV {
  if (k === 0) return { u: uv.u, v: uv.v };
  const x = uv.u * 2 - 1;
  const y = uv.v * 2 - 1;
  const s = (1 + k * (x * x + y * y)) / (1 + 2 * k);
  return { u: (x * s + 1) / 2, v: (y * s + 1) / 2 };
}

export function inverseBarrel(uv: UV, k: number): UV {
  const qx = uv.u * 2 - 1;
  const qy = uv.v * 2 - 1;
  let x = qx;
  let y = qy;
  for (let i = 0; i < 50; i++) {
    const s = (1 + k * (x * x + y * y)) / (1 + 2 * k);
    x = qx / s;
    y = qy / s;
  }
  return { u: (x + 1) / 2, v: (y + 1) / 2 };
}

export function insideTube(uv: UV, cornerRadiusPx: number): boolean {
  if (uv.u < 0 || uv.u > 1 || uv.v < 0 || uv.v > 1) return false;
  const px = Math.abs((uv.u - 0.5) * CONTENT_W);
  const py = Math.abs((uv.v - 0.5) * CONTENT_H);
  const dx = Math.max(px - (CONTENT_W / 2 - cornerRadiusPx), 0);
  const dy = Math.max(py - (CONTENT_H / 2 - cornerRadiusPx), 0);
  return dx * dx + dy * dy <= cornerRadiusPx * cornerRadiusPx;
}

export function contentToWorld(uv: UV): { x: number; y: number } {
  return { x: (uv.u - 0.5) * CONTENT_W, y: (uv.v - 0.5) * CONTENT_H };
}

export function worldToContent(x: number, y: number): UV {
  return { u: x / CONTENT_W + 0.5, v: y / CONTENT_H + 0.5 };
}

export function contentToScreen(x: number, y: number, l: Layout, k: number): { px: number; py: number } {
  const t = inverseBarrel(worldToContent(x, y), k);
  return { px: l.tubeX + t.u * l.tubeW, py: l.tubeY + (1 - t.v) * l.tubeH };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd launchboard && npx vitest run tests/geometry.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add launchboard/src/tube/geometry.ts launchboard/tests/geometry.test.ts
git commit -m "Add tube geometry: layout, barrel mapping, tube mask

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Tube timeline, presets, and tube bus

**Files:**
- Create: `launchboard/src/tube/timeline.ts`, `launchboard/src/tube/presets.ts`, `launchboard/src/tube/tubeBus.ts`
- Test: `launchboard/tests/timeline.test.ts`, `launchboard/tests/presets.test.ts`

**Interfaces:**
- Consumes: `PulseKind` (Task 5), `QualityPreset` (Task 3).
- Produces:
  - `type TubeEvent = { kind: PulseKind; start: number }` (ms, `performance.now()` clock)
  - `type TubeFx = { warmup: number; degauss: number; staticAmt: number; roll: number; flash: number }`
  - `DURATIONS: Record<PulseKind, number>` = `{ boot: 1800, channel: 700, static: 400, flash: 250, roll: 600 }`
  - `IDLE_FX: TubeFx` = `{ warmup: 1, degauss: 0, staticAmt: 0, roll: 0, flash: 0 }`
  - `evaluateFx(events: TubeEvent[], now: number): TubeFx`
  - `pruneEvents(events: TubeEvent[], now: number): TubeEvent[]`
  - `type TubeParams = { curvature: number; cornerRadius: number; chroma: number; bloom: number; bloomThreshold: number; maskStrength: number; maskType: number; maskPx: number; scanStrength: number; scanBeamMin: number; scanBeamMax: number; persistence: number; rollBand: number; flicker: number; vignette: number; glass: number; grain: number }`
  - `PRESETS: { pro: TubeParams; standard: TubeParams }`
  - `PARAM_RANGES: Record<keyof TubeParams, { min: number; max: number; step: number }>` (used by Task 16)
  - `paramsFor(q: QualityPreset, overrides?: Partial<TubeParams>): TubeParams` (`safe` uses `standard` values)
  - `median(xs: number[]): number`
  - `pickPreset(frameTimesMs: number[], current: QualityPreset): QualityPreset`
  - `scanlineCount(canvasHeightPx: number): number` = `clamp(floor(h / 2), 120, 540)`
  - `tubeBus: { events: TubeEvent[]; overrides: Partial<TubeParams>; fps: number; pulse(kind: PulseKind, now?: number): void }`

- [ ] **Step 1: Write failing tests**

`launchboard/tests/timeline.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { evaluateFx, pruneEvents, IDLE_FX } from '../src/tube/timeline';
import { tubeBus } from '../src/tube/tubeBus';

describe('evaluateFx', () => {
  it('is idle with no events', () => {
    expect(evaluateFx([], 0)).toEqual(IDLE_FX);
  });

  it('boot: dark line first, then opens, then degauss + flash', () => {
    const ev = [{ kind: 'boot' as const, start: 1000 }];
    expect(evaluateFx(ev, 1000).warmup).toBe(0);
    expect(evaluateFx(ev, 1299).warmup).toBe(0);
    expect(evaluateFx(ev, 1600).warmup).toBeCloseTo(0.875, 9);
    const t1000 = evaluateFx(ev, 2000);
    expect(t1000.warmup).toBe(1);
    expect(t1000.degauss).toBeCloseTo(0.875, 9);
    expect(t1000.flash).toBeCloseTo(0.21, 9);
    expect(evaluateFx(ev, 2800)).toEqual(IDLE_FX);
  });

  it('boot ignores time before its start', () => {
    expect(evaluateFx([{ kind: 'boot', start: 500 }], 0)).toEqual(IDLE_FX);
  });

  it('channel peaks at its midpoint', () => {
    const fx = evaluateFx([{ kind: 'channel', start: 0 }], 350);
    expect(fx.staticAmt).toBeCloseTo(1, 9);
    expect(fx.roll).toBeCloseTo(0.5, 9);
    expect(fx.flash).toBeCloseTo(0.6, 9);
  });

  it('static and flash decay linearly; roll advances', () => {
    expect(evaluateFx([{ kind: 'static', start: 0 }], 100).staticAmt).toBeCloseTo(0.75, 9);
    expect(evaluateFx([{ kind: 'flash', start: 0 }], 125).flash).toBeCloseTo(0.5, 9);
    expect(evaluateFx([{ kind: 'roll', start: 0 }], 300).roll).toBeCloseTo(0.5, 9);
  });

  it('combines: max for amounts, fractional sum for roll', () => {
    const fx = evaluateFx([
      { kind: 'roll', start: 0 },
      { kind: 'roll', start: -150 },
      { kind: 'static', start: 0 },
      { kind: 'flash', start: 0 },
    ], 300);
    // 300/600 + 450/600 = 1.25 → fractional part 0.25; flash (250 ms) has already ended
    expect(fx.roll).toBeCloseTo(0.25, 9);
    expect(fx.staticAmt).toBeCloseTo(0.25, 9);
    expect(fx.flash).toBe(0);
  });
});

describe('pruneEvents', () => {
  it('drops finished events and keeps active or future ones', () => {
    const kept = pruneEvents([
      { kind: 'flash', start: 0 },
      { kind: 'boot', start: 0 },
      { kind: 'static', start: 5000 },
    ], 1000);
    expect(kept.map((e) => e.kind)).toEqual(['boot', 'static']);
  });
});

describe('tubeBus', () => {
  it('queues pulses', () => {
    tubeBus.events.length = 0;
    tubeBus.pulse('flash', 42);
    expect(tubeBus.events).toEqual([{ kind: 'flash', start: 42 }]);
  });
});
```

`launchboard/tests/presets.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { PRESETS, PARAM_RANGES, paramsFor, median, pickPreset, scanlineCount } from '../src/tube/presets';

describe('presets', () => {
  it('standard disables bloom and persistence', () => {
    expect(PRESETS.pro.bloom).toBeGreaterThan(0);
    expect(PRESETS.pro.persistence).toBeGreaterThan(0);
    expect(PRESETS.standard.bloom).toBe(0);
    expect(PRESETS.standard.persistence).toBe(0);
  });

  it('every preset value is inside its debug range', () => {
    for (const p of [PRESETS.pro, PRESETS.standard]) {
      for (const [key, value] of Object.entries(p)) {
        const r = PARAM_RANGES[key as keyof typeof p];
        expect(value).toBeGreaterThanOrEqual(r.min);
        expect(value).toBeLessThanOrEqual(r.max);
      }
    }
  });

  it('applies overrides and maps safe to standard', () => {
    expect(paramsFor('pro', { curvature: 0.2 }).curvature).toBe(0.2);
    expect(paramsFor('safe')).toEqual(PRESETS.standard);
  });

  it('median handles odd and even lengths', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it('steps down one preset when median frame time exceeds 20 ms', () => {
    expect(pickPreset([16, 17, 15], 'pro')).toBe('pro');
    expect(pickPreset([25, 30, 22], 'pro')).toBe('standard');
    expect(pickPreset([25, 30, 22], 'standard')).toBe('safe');
    expect(pickPreset([25, 30, 22], 'safe')).toBe('safe');
  });

  it('chooses a scanline count from canvas height', () => {
    expect(scanlineCount(2160)).toBe(540);
    expect(scanlineCount(1080)).toBe(540);
    expect(scanlineCount(800)).toBe(400);
    expect(scanlineCount(100)).toBe(120);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd launchboard && npx vitest run tests/timeline.test.ts tests/presets.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`launchboard/src/tube/timeline.ts`:
```ts
import type { PulseKind } from '../games/types';

export type TubeEvent = { kind: PulseKind; start: number };
export type TubeFx = { warmup: number; degauss: number; staticAmt: number; roll: number; flash: number };

export const DURATIONS: Record<PulseKind, number> = { boot: 1800, channel: 700, static: 400, flash: 250, roll: 600 };
export const IDLE_FX: TubeFx = { warmup: 1, degauss: 0, staticAmt: 0, roll: 0, flash: 0 };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export function evaluateFx(events: TubeEvent[], now: number): TubeFx {
  const fx: TubeFx = { ...IDLE_FX };
  let roll = 0;
  for (const e of events) {
    const t = now - e.start;
    if (t < 0 || t >= DURATIONS[e.kind]) continue;
    switch (e.kind) {
      case 'boot': {
        const warm = t < 300 ? 0 : easeOutCubic(clamp01((t - 300) / 600));
        fx.warmup = Math.min(fx.warmup, warm);
        if (t >= 900 && t < 1700) fx.degauss = Math.max(fx.degauss, 1 - (t - 900) / 800);
        if (t >= 900 && t < 1150) fx.flash = Math.max(fx.flash, 0.35 * (1 - (t - 900) / 250));
        break;
      }
      case 'channel':
        fx.staticAmt = Math.max(fx.staticAmt, Math.sin((Math.PI * t) / 700));
        roll += t / 700;
        fx.flash = Math.max(fx.flash, 0.6 * Math.max(0, 1 - Math.abs(t - 350) / 120));
        break;
      case 'static':
        fx.staticAmt = Math.max(fx.staticAmt, 1 - t / 400);
        break;
      case 'flash':
        fx.flash = Math.max(fx.flash, 1 - t / 250);
        break;
      case 'roll':
        roll += t / 600;
        break;
    }
  }
  fx.roll = roll - Math.floor(roll);
  return fx;
}

export function pruneEvents(events: TubeEvent[], now: number): TubeEvent[] {
  return events.filter((e) => now - e.start < DURATIONS[e.kind]);
}
```

`launchboard/src/tube/presets.ts`:
```ts
import type { QualityPreset } from '../state/store';

export type TubeParams = {
  curvature: number;
  cornerRadius: number;
  chroma: number;
  bloom: number;
  bloomThreshold: number;
  maskStrength: number;
  maskType: number; // 0 = aperture grille, 1 = slot mask
  maskPx: number;
  scanStrength: number;
  scanBeamMin: number;
  scanBeamMax: number;
  persistence: number;
  rollBand: number;
  flicker: number;
  vignette: number;
  glass: number;
  grain: number;
};

const pro: TubeParams = {
  curvature: 0.06,
  cornerRadius: 42,
  chroma: 0.0015,
  bloom: 0.35,
  bloomThreshold: 0.6,
  maskStrength: 0.35,
  maskType: 0,
  maskPx: 3,
  scanStrength: 0.45,
  scanBeamMin: 0.35,
  scanBeamMax: 0.9,
  persistence: 0.55,
  rollBand: 0.04,
  flicker: 0.012,
  vignette: 0.35,
  glass: 0.05,
  grain: 0.025,
};

export const PRESETS: { pro: TubeParams; standard: TubeParams } = {
  pro,
  standard: { ...pro, bloom: 0, persistence: 0, chroma: 0.001 },
};

export const PARAM_RANGES: Record<keyof TubeParams, { min: number; max: number; step: number }> = {
  curvature: { min: 0, max: 0.2, step: 0.005 },
  cornerRadius: { min: 0, max: 120, step: 1 },
  chroma: { min: 0, max: 0.01, step: 0.0005 },
  bloom: { min: 0, max: 1.5, step: 0.05 },
  bloomThreshold: { min: 0, max: 1, step: 0.05 },
  maskStrength: { min: 0, max: 1, step: 0.05 },
  maskType: { min: 0, max: 1, step: 1 },
  maskPx: { min: 2, max: 6, step: 1 },
  scanStrength: { min: 0, max: 1, step: 0.05 },
  scanBeamMin: { min: 0.1, max: 1, step: 0.05 },
  scanBeamMax: { min: 0.1, max: 1.5, step: 0.05 },
  persistence: { min: 0, max: 0.95, step: 0.05 },
  rollBand: { min: 0, max: 0.2, step: 0.01 },
  flicker: { min: 0, max: 0.05, step: 0.002 },
  vignette: { min: 0, max: 1, step: 0.05 },
  glass: { min: 0, max: 0.3, step: 0.01 },
  grain: { min: 0, max: 0.1, step: 0.005 },
};

export function paramsFor(q: QualityPreset, overrides: Partial<TubeParams> = {}): TubeParams {
  const base = q === 'pro' ? PRESETS.pro : PRESETS.standard;
  return { ...base, ...overrides };
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const STEP_DOWN: Record<QualityPreset, QualityPreset> = { pro: 'standard', standard: 'safe', safe: 'safe' };

export function pickPreset(frameTimesMs: number[], current: QualityPreset): QualityPreset {
  return median(frameTimesMs) > 20 ? STEP_DOWN[current] : current;
}

export function scanlineCount(canvasHeightPx: number): number {
  return Math.min(540, Math.max(120, Math.floor(canvasHeightPx / 2)));
}
```

`launchboard/src/tube/tubeBus.ts`:
```ts
import type { PulseKind } from '../games/types';
import type { TubeEvent } from './timeline';
import type { TubeParams } from './presets';

export const tubeBus = {
  events: [] as TubeEvent[],
  overrides: {} as Partial<TubeParams>,
  fps: 0,
  pulse(kind: PulseKind, now: number = performance.now()) {
    this.events.push({ kind, start: now });
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd launchboard && npx vitest run tests/timeline.test.ts tests/presets.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add launchboard/src/tube/timeline.ts launchboard/src/tube/presets.ts launchboard/src/tube/tubeBus.ts launchboard/tests/timeline.test.ts launchboard/tests/presets.test.ts
git commit -m "Add tube transition timeline, quality presets and tube bus

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: CRT render pipeline (passes, shaders, TubeRenderer) + Playwright harness

**Files:**
- Create: `launchboard/src/tube/shaders/fullscreen.vert`, `tube.vert`, `persist.frag`, `bright.frag`, `blur.frag`, `crt.frag`
- Create: `launchboard/src/tube/passes.ts`, `launchboard/src/tube/TubeRenderer.tsx`
- Create: `launchboard/src/e2eHooks.ts`
- Create: `launchboard/playwright.config.ts`, `launchboard/e2e/tube.spec.ts`
- Modify: `launchboard/src/App.tsx` (temporary tube check scene; replaced in Task 15)

**Interfaces:**
- Consumes: `computeLayout`, `screenToTubeUv`, `barrel`, `insideTube`, `CONTENT_W`, `CONTENT_H`, `contentToScreen` (Task 6); `evaluateFx`, `pruneEvents`, `paramsFor`, `scanlineCount`, `tubeBus` (Task 7); `appStore` (Task 3); `colors` (Task 2).
- Produces:
  - `<TubeRenderer>{children}</TubeRenderer>` — must be rendered inside an **orthographic** `<Canvas flat>`; children render into the 1920×1080 content scene (centered coords, y up) with working pointer events. Optional prop `bezel?: ReactNode` rendered in the outer scene.
  - `FullscreenPass` class with `render(gl, material, target)` and `dispose()`; `makePassMaterial(fragmentShader: string, uniforms: Record<string, THREE.IUniform>): THREE.ShaderMaterial`
  - `installE2eHooks(extra?: Record<string, unknown>): void` — when `?e2e` is present, sets `window.__launchboard = { getState, contentToScreen(x, y), ...extra }`

- [ ] **Step 1: Set up Playwright and write the failing e2e test**

Run:
```bash
cd launchboard && npx playwright install chromium
```

`launchboard/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1920, height: 1080 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npx vite --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

`launchboard/e2e/tube.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __launchboard?: { contentToScreen(x: number, y: number): { px: number; py: number }; clicks?: () => number };
  }
}

test('tube renders and maps pointer hits through the curved glass', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('/?e2e');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => !!window.__launchboard);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/tube-check.png' });

  const target = await page.evaluate(() => window.__launchboard!.contentToScreen(-55, 270));
  await page.mouse.click(target.px, target.py);
  await expect.poll(() => page.evaluate(() => window.__launchboard!.clicks!())).toBe(1);

  const miss = await page.evaluate(() => window.__launchboard!.contentToScreen(600, -300));
  await page.mouse.click(miss.px, miss.py);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__launchboard!.clicks!())).toBe(1);

  expect(errors).toEqual([]);
});
```

Run: `cd launchboard && npx playwright test e2e/tube.spec.ts`
Expected: FAIL — no `canvas` (App is still the scaffold text).

- [ ] **Step 2: Write the shaders**

`launchboard/src/tube/shaders/fullscreen.vert`:
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
```

`launchboard/src/tube/shaders/tube.vert`:
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

`launchboard/src/tube/shaders/persist.frag`:
```glsl
uniform sampler2D uCurrent;
uniform sampler2D uPrev;
uniform float uDecay;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uCurrent, vUv).rgb;
  vec3 p = texture2D(uPrev, vUv).rgb * uDecay;
  gl_FragColor = vec4(max(c, p), 1.0);
}
```

`launchboard/src/tube/shaders/bright.frag`:
```glsl
uniform sampler2D uImage;
uniform float uThreshold;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uImage, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor = vec4(c * smoothstep(uThreshold, 1.0, l), 1.0);
}
```

`launchboard/src/tube/shaders/blur.frag`:
```glsl
uniform sampler2D uImage;
uniform vec2 uDirection; // one texel along the blur axis
varying vec2 vUv;
void main() {
  vec3 s = texture2D(uImage, vUv).rgb * 0.2270270270;
  s += texture2D(uImage, vUv + uDirection * 1.3846153846).rgb * 0.3162162162;
  s += texture2D(uImage, vUv - uDirection * 1.3846153846).rgb * 0.3162162162;
  s += texture2D(uImage, vUv + uDirection * 3.2307692308).rgb * 0.0702702703;
  s += texture2D(uImage, vUv - uDirection * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(s, 1.0);
}
```

`launchboard/src/tube/shaders/crt.frag` (the `barrel` and `tubeMask` functions mirror `geometry.ts`):
```glsl
uniform sampler2D uImage;
uniform sampler2D uBloom;
uniform float uTime;
uniform float uCurvature;
uniform float uCornerRadius;
uniform float uChroma;
uniform float uBloomAmt;
uniform float uMaskStrength;
uniform float uMaskType;
uniform float uMaskPx;
uniform float uScanStrength;
uniform float uScanBeamMin;
uniform float uScanBeamMax;
uniform float uScanlines;
uniform float uRollBand;
uniform float uFlicker;
uniform float uVignette;
uniform float uGlass;
uniform float uGrain;
uniform float uWarmup;
uniform float uDegauss;
uniform float uStatic;
uniform float uRoll;
uniform float uFlash;
varying vec2 vUv;

const vec2 CONTENT = vec2(1920.0, 1080.0);
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec2 barrel(vec2 uv, float k) {
  vec2 p = uv * 2.0 - 1.0;
  float s = (1.0 + k * dot(p, p)) / (1.0 + 2.0 * k);
  return p * s * 0.5 + 0.5;
}

float tubeMask(vec2 uv, float r) {
  vec2 p = abs((uv - 0.5) * CONTENT);
  vec2 d = max(p - (CONTENT * 0.5 - r), 0.0);
  float outside = max(max(abs(uv.x - 0.5) - 0.5, abs(uv.y - 0.5) - 0.5) * CONTENT.y, length(d) - r);
  return 1.0 - smoothstep(-1.5, 1.5, outside);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // Degauss wobble (boot)
  uv.x += uDegauss * 0.012 * sin(uv.y * 38.0 + uTime * 40.0);

  // Warm-up: image collapses to a horizontal line and opens vertically
  float open = max(uWarmup, 0.002);
  uv.y = (uv.y - 0.5) / open + 0.5;

  // Curvature: screen-space tube UV -> content UV
  vec2 c = barrel(uv, uCurvature);
  if (uRoll > 0.0) c.y = fract(c.y + uRoll);
  float inBounds = step(0.0, c.x) * step(c.x, 1.0) * step(0.0, c.y) * step(c.y, 1.0);

  // Convergence error: split R/B horizontally, stronger toward the edges
  vec2 cc = c - 0.5;
  vec2 off = vec2(cc.x * uChroma * 8.0 * dot(cc, cc) + uChroma * sign(cc.x), 0.0);
  vec3 col = vec3(
    texture2D(uImage, c + off).r,
    texture2D(uImage, c).g,
    texture2D(uImage, c - off).b
  );

  // Bloom
  col += texture2D(uBloom, c).rgb * uBloomAmt;

  // Scanlines: beam gets wider on bright pixels
  float lum = clamp(dot(col, LUMA), 0.0, 1.0);
  float beam = mix(uScanBeamMin, uScanBeamMax, lum);
  float d = abs(fract(c.y * uScanlines) - 0.5) * 2.0;
  float scan = exp(-2.0 * (d / beam) * (d / beam));
  col *= mix(1.0, scan, uScanStrength) * (1.0 + uScanStrength * 0.4);

  // Phosphor mask in device pixels
  vec2 fc = gl_FragCoord.xy;
  float stripe = max(uMaskPx / 3.0, 1.0);
  float idx = mod(floor(fc.x / stripe), 3.0);
  vec3 m = vec3(equal(vec3(idx), vec3(0.0, 1.0, 2.0)));
  if (uMaskType > 0.5) {
    float column = floor(fc.x / (stripe * 3.0));
    float rowPhase = mod(fc.y + mod(column, 2.0) * 2.0, 4.0);
    m *= mix(0.45, 1.0, step(1.0, rowPhase));
  }
  vec3 maskMul = mix(vec3(1.0), m + (1.0 - m) * 0.1, uMaskStrength);
  col *= maskMul * (1.0 + uMaskStrength * 0.9);

  // Refresh band and flicker
  float bandY = fract(vUv.y - uTime * 0.12);
  float band = smoothstep(0.0, 0.08, bandY) * (1.0 - smoothstep(0.08, 0.16, bandY));
  col *= 1.0 + uRollBand * band;
  col *= 1.0 - uFlicker * (0.5 + 0.5 * sin(uTime * 377.0));

  // Channel-change static
  float n = hash(floor(fc / 2.0) + floor(uTime * 60.0));
  col = mix(col, vec3(n), clamp(uStatic, 0.0, 1.0) * 0.85);

  col *= inBounds;

  // Warm-up line and flashes
  col += vec3(1.5 * (1.0 - uWarmup) * exp(-pow((vUv.y - 0.5) / 0.004, 2.0)));
  col += vec3(uFlash);

  // Vignette
  vec2 vv = vUv * (1.0 - vUv.yx);
  col *= pow(clamp(vv.x * vv.y * 16.0, 0.0, 1.0), uVignette * 0.6);

  // Glass reflection and grain
  float hl = exp(-pow(length((vUv - vec2(0.28, 0.82)) * vec2(1.0, 1.6)) / 0.35, 2.0));
  col += vec3(hl * uGlass);
  col += (hash(fc + fract(uTime)) - 0.5) * uGrain;

  // Physical tube shape; the glass outside the phosphor area is near-black
  col = mix(vec3(0.012), max(col, 0.0), tubeMask(vUv, uCornerRadius));

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
```

- [ ] **Step 3: Write `passes.ts`**

`launchboard/src/tube/passes.ts`:
```ts
import * as THREE from 'three';
import fullscreenVert from './shaders/fullscreen.vert?raw';

export class FullscreenPass {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly mesh: THREE.Mesh;

  constructor() {
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  render(gl: THREE.WebGLRenderer, material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.mesh.material = material;
    gl.setRenderTarget(target);
    gl.render(this.scene, this.camera);
  }

  dispose() {
    this.mesh.geometry.dispose();
  }
}

export function makePassMaterial(fragmentShader: string, uniforms: Record<string, THREE.IUniform>): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: fullscreenVert,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}
```

- [ ] **Step 4: Write `e2eHooks.ts`**

`launchboard/src/e2eHooks.ts`:
```ts
import { appStore } from './state/store';
import { computeLayout, contentToScreen } from './tube/geometry';
import { paramsFor } from './tube/presets';
import { tubeBus } from './tube/tubeBus';

export function installE2eHooks(extra: Record<string, unknown> = {}) {
  if (!new URLSearchParams(window.location.search).has('e2e')) return;
  (window as unknown as { __launchboard: unknown }).__launchboard = {
    getState: () => appStore.getState(),
    contentToScreen: (x: number, y: number) => {
      const layout = computeLayout(window.innerWidth, window.innerHeight);
      const k = paramsFor(appStore.getState().quality, tubeBus.overrides).curvature;
      return contentToScreen(x, y, layout, k);
    },
    ...extra,
  };
}
```

- [ ] **Step 5: Write `TubeRenderer.tsx`**

`launchboard/src/tube/TubeRenderer.tsx`:
```tsx
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { createPortal, useFrame, useThree, type RootState } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import { colors } from '../brand';
import { appStore } from '../state/store';
import { CONTENT_H, CONTENT_W, barrel, computeLayout, insideTube, screenToTubeUv } from './geometry';
import { FullscreenPass, makePassMaterial } from './passes';
import { paramsFor, scanlineCount } from './presets';
import { evaluateFx, pruneEvents } from './timeline';
import { tubeBus } from './tubeBus';
import tubeVert from './shaders/tube.vert?raw';
import crtFrag from './shaders/crt.frag?raw';
import persistFrag from './shaders/persist.frag?raw';
import brightFrag from './shaders/bright.frag?raw';
import blurFrag from './shaders/blur.frag?raw';

const BLOOM_W = 480;
const BLOOM_H = 270;

function crtUniforms(): Record<string, THREE.IUniform> {
  const names = [
    'uTime', 'uCurvature', 'uCornerRadius', 'uChroma', 'uBloomAmt', 'uMaskStrength', 'uMaskType', 'uMaskPx',
    'uScanStrength', 'uScanBeamMin', 'uScanBeamMax', 'uScanlines', 'uRollBand', 'uFlicker', 'uVignette',
    'uGlass', 'uGrain', 'uWarmup', 'uDegauss', 'uStatic', 'uRoll', 'uFlash',
  ];
  const u: Record<string, THREE.IUniform> = { uImage: { value: null }, uBloom: { value: null } };
  for (const n of names) u[n] = { value: 0 };
  return u;
}

export function TubeRenderer({ children, bezel }: { children: ReactNode; bezel?: ReactNode }) {
  const size = useThree((s) => s.size);

  const contentScene = useMemo(() => {
    const s = new THREE.Scene();
    s.background = new THREE.Color(colors.studioGrey);
    return s;
  }, []);
  const contentCamera = useMemo(() => {
    const c = new THREE.OrthographicCamera(-CONTENT_W / 2, CONTENT_W / 2, CONTENT_H / 2, -CONTENT_H / 2, 1, 6000);
    c.position.set(0, 0, 3000);
    c.lookAt(0, 0, 0);
    c.updateProjectionMatrix();
    return c;
  }, []);

  const contentRT = useFBO(CONTENT_W, CONTENT_H, { samples: 4, depthBuffer: true });
  const persistA = useFBO(CONTENT_W, CONTENT_H, { depthBuffer: false });
  const persistB = useFBO(CONTENT_W, CONTENT_H, { depthBuffer: false });
  const bloomA = useFBO(BLOOM_W, BLOOM_H, { depthBuffer: false });
  const bloomB = useFBO(BLOOM_W, BLOOM_H, { depthBuffer: false });

  const pass = useMemo(() => new FullscreenPass(), []);
  const mats = useMemo(() => ({
    persist: makePassMaterial(persistFrag, { uCurrent: { value: null }, uPrev: { value: null }, uDecay: { value: 0 } }),
    bright: makePassMaterial(brightFrag, { uImage: { value: null }, uThreshold: { value: 0.6 } }),
    blur: makePassMaterial(blurFrag, { uImage: { value: null }, uDirection: { value: new THREE.Vector2() } }),
    crt: new THREE.ShaderMaterial({ vertexShader: tubeVert, fragmentShader: crtFrag, uniforms: crtUniforms() }),
  }), []);

  useEffect(() => () => {
    pass.dispose();
    Object.values(mats).forEach((m) => m.dispose());
  }, [pass, mats]);

  const swap = useRef(false);

  useFrame((state, delta) => {
    const gl = state.gl;
    const now = performance.now();
    tubeBus.events = pruneEvents(tubeBus.events, now);
    const fx = evaluateFx(tubeBus.events, now);
    const p = paramsFor(appStore.getState().quality, tubeBus.overrides);

    gl.setRenderTarget(contentRT);
    gl.clear();
    gl.render(contentScene, contentCamera);

    let image: THREE.Texture = contentRT.texture;
    if (p.persistence > 0) {
      const read = swap.current ? persistB : persistA;
      const write = swap.current ? persistA : persistB;
      mats.persist.uniforms.uCurrent.value = contentRT.texture;
      mats.persist.uniforms.uPrev.value = read.texture;
      mats.persist.uniforms.uDecay.value = p.persistence;
      pass.render(gl, mats.persist, write);
      image = write.texture;
      swap.current = !swap.current;
    }

    if (p.bloom > 0) {
      mats.bright.uniforms.uImage.value = image;
      mats.bright.uniforms.uThreshold.value = p.bloomThreshold;
      pass.render(gl, mats.bright, bloomA);
      mats.blur.uniforms.uImage.value = bloomA.texture;
      (mats.blur.uniforms.uDirection.value as THREE.Vector2).set(1 / BLOOM_W, 0);
      pass.render(gl, mats.blur, bloomB);
      mats.blur.uniforms.uImage.value = bloomB.texture;
      (mats.blur.uniforms.uDirection.value as THREE.Vector2).set(0, 1 / BLOOM_H);
      pass.render(gl, mats.blur, bloomA);
    }

    const layout = computeLayout(state.size.width, state.size.height);
    const u = mats.crt.uniforms;
    u.uImage.value = image;
    u.uBloom.value = bloomA.texture;
    u.uTime.value = state.clock.elapsedTime;
    u.uCurvature.value = p.curvature;
    u.uCornerRadius.value = p.cornerRadius;
    u.uChroma.value = p.chroma;
    u.uBloomAmt.value = p.bloom;
    u.uMaskStrength.value = p.maskStrength;
    u.uMaskType.value = p.maskType;
    u.uMaskPx.value = p.maskPx;
    u.uScanStrength.value = p.scanStrength;
    u.uScanBeamMin.value = p.scanBeamMin;
    u.uScanBeamMax.value = p.scanBeamMax;
    u.uScanlines.value = scanlineCount(layout.tubeH * state.viewport.dpr);
    u.uRollBand.value = p.rollBand;
    u.uFlicker.value = p.flicker;
    u.uVignette.value = p.vignette;
    u.uGlass.value = p.glass;
    u.uGrain.value = p.grain;
    u.uWarmup.value = fx.warmup;
    u.uDegauss.value = fx.degauss;
    u.uStatic.value = fx.staticAmt;
    u.uRoll.value = fx.roll;
    u.uFlash.value = fx.flash;

    gl.setRenderTarget(null);
    gl.render(state.scene, state.camera);

    if (delta > 0) tubeBus.fps = tubeBus.fps * 0.9 + (1 / delta) * 0.1;
  }, 1);

  const compute = useCallback((event: { offsetX: number; offsetY: number }, state: RootState, previous?: RootState) => {
    const root = previous ?? state;
    const layout = computeLayout(root.size.width, root.size.height);
    const p = paramsFor(appStore.getState().quality, tubeBus.overrides);
    const tubeUv = screenToTubeUv(event.offsetX, event.offsetY, layout);
    if (insideTube(tubeUv, p.cornerRadius)) {
      const c = barrel(tubeUv, p.curvature);
      state.pointer.set(c.u * 2 - 1, c.v * 2 - 1);
    } else {
      state.pointer.set(99, 99);
    }
    state.raycaster.setFromCamera(state.pointer, state.camera);
  }, []);

  const layout = computeLayout(size.width, size.height);
  const cx = layout.tubeX + layout.tubeW / 2 - size.width / 2;
  const cy = size.height / 2 - (layout.tubeY + layout.tubeH / 2);

  return (
    <>
      {createPortal(children, contentScene, {
        camera: contentCamera,
        size: { width: CONTENT_W, height: CONTENT_H, top: 0, left: 0 },
        events: { compute, priority: 1 },
      })}
      <mesh position={[cx, cy, 0]} material={mats.crt}>
        <planeGeometry args={[layout.tubeW, layout.tubeH]} />
      </mesh>
      {bezel}
    </>
  );
}
```

- [ ] **Step 6: Temporary tube check scene in `App.tsx`**

`launchboard/src/App.tsx` (replaced in Task 15):
```tsx
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { TubeRenderer } from './tube/TubeRenderer';
import { installE2eHooks } from './e2eHooks';
import { colors } from './brand';

let clicks = 0;
installE2eHooks({ clicks: () => clicks });

function SpinningTie() {
  const ref = useRef<Mesh>(null!);
  const [hot, setHot] = useState(false);
  useFrame((_, dt) => { ref.current.rotation.y += dt; });
  return (
    <mesh ref={ref} position={[-55, 270, 0]} rotation={[0.6, 0, 0]}
      onClick={() => { clicks += 1; setHot((h) => !h); }}>
      <boxGeometry args={[300, 60, 80]} />
      <meshStandardMaterial color={hot ? colors.kilnPink : colors.tieOrange} roughness={0.8} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas orthographic flat dpr={[1, 2]} camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 5000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <TubeRenderer>
        <ambientLight intensity={0.6} />
        <directionalLight position={[-400, 800, 600]} intensity={1.6} />
        <SpinningTie />
      </TubeRenderer>
    </Canvas>
  );
}
```

- [ ] **Step 7: Run the e2e test to verify it passes**

Run: `cd launchboard && npx playwright test e2e/tube.spec.ts`
Expected: PASS. Open `launchboard/test-results/tube-check.png` and confirm visually: grey curved tube with rounded corners on black, orange bar near the upper middle, visible RGB mask/scanlines when zoomed, soft vignette.

If the click assertion fails, debug in this order: (1) log `event.offsetX/Y` inside `compute` to confirm it runs; (2) confirm `state.camera` is the content camera (portal `camera` injected); (3) compare `barrel` output against `worldToContent(-55, 270)`.

- [ ] **Step 8: Type-check and commit**

Run: `cd launchboard && npx tsc --noEmit && npx vitest run`
Expected: no type errors; all unit tests PASS.

```bash
git add launchboard
git commit -m "Add CRT render pipeline with curved-glass pointer mapping

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Monitor bezel and 3D monogram

**Files:**
- Create: `launchboard/src/ui/Monogram.tsx`, `launchboard/src/tube/Bezel.tsx`
- Modify: `launchboard/src/App.tsx` (pass `bezel` to the tube check scene)
- Modify: `launchboard/e2e/tube.spec.ts` (add a bezel screenshot)

**Interfaces:**
- Consumes: `MONOGRAM_PATHS`, `MONOGRAM_VIEWBOX`, `MONOGRAM_STROKE`, `colors`, `fonts` (Task 2); `Layout`, `computeLayout` (Task 6).
- Produces:
  - `<Monogram height: number; color: string; position?: [number, number, number] />` — flat stroked ITD monogram, centered on `position`, `height` in scene units.
  - `<Bezel layout: Layout; viewW: number; viewH: number />` — outer-scene chassis around the tube (renders its own lights).

- [ ] **Step 1: Write `Monogram.tsx`**

`launchboard/src/ui/Monogram.tsx`:
```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MONOGRAM_PATHS, MONOGRAM_STROKE, MONOGRAM_VIEWBOX } from '../brand';

let cached: THREE.BufferGeometry | null = null;

function monogramGeometry(): THREE.BufferGeometry {
  if (cached) return cached;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MONOGRAM_VIEWBOX.w} ${MONOGRAM_VIEWBOX.h}">${MONOGRAM_PATHS.map(
    (d) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${MONOGRAM_STROKE}"/>`,
  ).join('')}</svg>`;
  const data = new SVGLoader().parse(svg);
  const style = SVGLoader.getStrokeStyle(MONOGRAM_STROKE, '#000', 'miter', 'butt', 4);
  const parts: THREE.BufferGeometry[] = [];
  for (const path of data.paths) {
    for (const sub of path.subPaths) {
      const g = SVGLoader.pointsToStroke(sub.getPoints(24), style);
      if (g) parts.push(g);
    }
  }
  const merged = mergeGeometries(parts)!;
  // SVG is y-down: flip and center on the origin
  merged.translate(-MONOGRAM_VIEWBOX.w / 2, -MONOGRAM_VIEWBOX.h / 2, 0);
  merged.scale(1, -1, 1);
  cached = merged;
  return merged;
}

export function Monogram({ height, color, position = [0, 0, 0] }: { height: number; color: string; position?: [number, number, number] }) {
  const geometry = useMemo(monogramGeometry, []);
  const s = height / MONOGRAM_VIEWBOX.h;
  return (
    <mesh geometry={geometry} position={position} scale={[s, s, s]}>
      <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
```

- [ ] **Step 2: Write `Bezel.tsx`**

`launchboard/src/tube/Bezel.tsx`:
```tsx
import { RoundedBox, Text } from '@react-three/drei';
import { colors, fonts } from '../brand';
import { Monogram } from '../ui/Monogram';
import type { Layout } from './geometry';

const CHASSIS = '#2B2B2E';
const SURROUND = '#161618';
const KNOB = '#5A5A5E';

export function Bezel({ layout, viewW, viewH }: { layout: Layout; viewW: number; viewH: number }) {
  const s = layout.scale;
  // Convert top-left CSS px to centered outer-scene coordinates
  const X = (px: number) => px - viewW / 2;
  const Y = (py: number) => viewH / 2 - py;

  const mx = X(layout.monitorX + layout.monitorW / 2);
  const my = Y(layout.monitorY + layout.monitorH / 2);
  const tubeCx = X(layout.tubeX + layout.tubeW / 2);
  const tubeCy = Y(layout.tubeY + layout.tubeH / 2);
  const stripY = Y(layout.tubeY + layout.tubeH + 110 * s);
  const left = X(layout.tubeX);
  const right = X(layout.tubeX + layout.tubeW);

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[-600, 900, 1200]} intensity={1.2} />

      <RoundedBox args={[layout.monitorW, layout.monitorH, 60 * s]} radius={28 * s} smoothness={4} position={[mx, my, -80 * s]}>
        <meshStandardMaterial color={CHASSIS} roughness={0.55} metalness={0.1} />
      </RoundedBox>

      <RoundedBox args={[layout.tubeW + 44 * s, layout.tubeH + 44 * s, 20 * s]} radius={30 * s} smoothness={4} position={[tubeCx, tubeCy, -30 * s]}>
        <meshStandardMaterial color={SURROUND} roughness={0.35} />
      </RoundedBox>

      <Monogram height={58 * s} color={colors.lightGrey} position={[left + 40 * s, stripY, 1]} />
      <Text font={fonts.medium} fontSize={26 * s} color={colors.lightGrey} anchorX="left" anchorY="middle"
        position={[left + 90 * s, stripY, 1]} letterSpacing={0.08}>
        INTERNATIONAL TIE DISPOSAL
      </Text>

      <mesh position={[right - 470 * s, stripY, 1]}>
        <circleGeometry args={[9 * s, 24]} />
        <meshBasicMaterial color={colors.carbonGreen} toneMapped={false} />
      </mesh>
      <Text font={fonts.medium} fontSize={18 * s} color={colors.muted} anchorX="left" anchorY="middle"
        position={[right - 450 * s, stripY, 1]} letterSpacing={0.1}>
        TALLY
      </Text>

      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[right - 300 * s + i * 56 * s, stripY, 10 * s]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[18 * s, 20 * s, 20 * s, 32]} />
          <meshStandardMaterial color={KNOB} roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 3: Pass the bezel from the tube check App**

In `launchboard/src/App.tsx`, add imports and wrap the renderer so it can read the canvas size:
```tsx
import { useThree } from '@react-three/fiber';
import { Bezel } from './tube/Bezel';
import { computeLayout } from './tube/geometry';

function Monitor({ children }: { children: React.ReactNode }) {
  const size = useThree((s) => s.size);
  const layout = computeLayout(size.width, size.height);
  return <TubeRenderer bezel={<Bezel layout={layout} viewW={size.width} viewH={size.height} />}>{children}</TubeRenderer>;
}
```
Then replace `<TubeRenderer>` / `</TubeRenderer>` inside `<Canvas>` with `<Monitor>` / `</Monitor>`.

- [ ] **Step 4: Add a bezel screenshot and run e2e**

In `launchboard/e2e/tube.spec.ts`, after the existing `page.screenshot(...)` line add:
```ts
  await page.setViewportSize({ width: 1280, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tube-bezel-4x3.png' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);
```

Run: `cd launchboard && npx playwright test e2e/tube.spec.ts`
Expected: PASS. Check `test-results/tube-bezel-4x3.png`: dark rounded chassis with the tube centered, black surround, light-grey monogram + "INTERNATIONAL TIE DISPOSAL" bottom-left, green tally dot and six knobs bottom-right; no third-party logos.

- [ ] **Step 5: Commit**

```bash
git add launchboard
git commit -m "Add monitor bezel and 3D ITD monogram

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Illustration kit, tie stack, and train

**Files:**
- Create: `launchboard/src/illustrations/materials.ts`, `StudioRig.tsx`, `ShadowBlob.tsx`, `Iso.tsx`, `TieStack.tsx`, `Train.tsx`
- Create: `launchboard/src/dev/Gallery.tsx`
- Create: `launchboard/e2e/gallery.spec.ts`
- Modify: `launchboard/src/App.tsx` (render `<Gallery>` when `?gallery` is present)

**Interfaces:**
- Consumes: `colors`, `tubeColors` (Task 2); `TubeRenderer`, `Bezel`, `computeLayout` (Tasks 6, 8, 9).
- Produces:
  - `materials` object: `machine`, `machineDark`, `machineLight`, `tie`, `tieEnd`, `rail`, `glass`, `kilnCharge`, `biochar`, `land`, `ocean`, `signalLamp` (all `THREE.MeshStandardMaterial`, shared instances)
  - `<StudioRig />` — content-scene lights (brand build kit values)
  - `<ShadowBlob width: number; depth: number; offset?: [number, number]; opacity?: number />` — soft contact shadow on the ground plane (y = 0) in model units
  - `ISO_ROTATION: [number, number, number]`; `<Iso scale: number; position?: [number, number, number]; children />`
  - `type IllustrationProps = { active?: boolean }`
  - `<TieStack active? />` (~9 × 7 unit footprint), `<Gondola />`, `<Locomotive />`, `<Train active? />` (~26 units long), `<Track length: number />`
  - `<Gallery />` — dev grid showing every illustration (Task 11 adds the rest)

- [ ] **Step 1: Write `materials.ts`, `StudioRig.tsx`, `ShadowBlob.tsx`, `Iso.tsx`**

`launchboard/src/illustrations/materials.ts`:
```ts
import * as THREE from 'three';
import { colors, tubeColors } from '../brand';

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...extra });

export const materials = {
  machine: std(colors.machineGrey),
  machineDark: std('#7C7C7E'),
  machineLight: std('#B8B8B8'),
  tie: std(tubeColors.tieOrange, { roughness: 0.85 }),
  tieEnd: std('#C97A2E', { roughness: 0.9 }),
  rail: std('#8E8E90', { roughness: 0.45, metalness: 0.35 }),
  glass: std('#E6E6E6', { roughness: 0.15, transparent: true, opacity: 0.38, depthWrite: false }),
  kilnCharge: std(tubeColors.kilnPink, { emissive: new THREE.Color(tubeColors.kilnPink), emissiveIntensity: 0.6 }),
  biochar: std(colors.biochar, { roughness: 0.95 }),
  land: std(tubeColors.carbonGreen, { roughness: 0.7 }),
  ocean: std('#8A8A8C', { roughness: 0.3, transparent: true, opacity: 0.85 }),
  signalLamp: std('#3A3A3C', { emissive: new THREE.Color(tubeColors.kilnPink), emissiveIntensity: 0 }),
};
```

`launchboard/src/illustrations/StudioRig.tsx`:
```tsx
export function StudioRig() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[-400, 800, 600]} intensity={1.6} />
      <directionalLight position={[600, 200, 400]} intensity={0.35} />
    </>
  );
}
```

`launchboard/src/illustrations/ShadowBlob.tsx`:
```tsx
import { useMemo } from 'react';
import * as THREE from 'three';

let texture: THREE.CanvasTexture | null = null;

function blobTexture(): THREE.CanvasTexture {
  if (texture) return texture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,1)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.45)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  texture = new THREE.CanvasTexture(c);
  return texture;
}

export function ShadowBlob({ width, depth, offset = [-0.18, 0.08], opacity = 0.25 }: {
  width: number; depth: number; offset?: [number, number]; opacity?: number;
}) {
  const map = useMemo(blobTexture, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset[0] * width, 0.01, offset[1] * depth]} renderOrder={-1}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial map={map} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
```

`launchboard/src/illustrations/Iso.tsx`:
```tsx
import type { ReactNode } from 'react';

/** Classic isometric view: yaw −45°, then pitch 35.26° toward the camera. */
export const ISO_ROTATION: [number, number, number] = [Math.atan(1 / Math.SQRT2), -Math.PI / 4, 0];

export type IllustrationProps = { active?: boolean };

export function Iso({ scale, position = [0, 0, 0], children }: { scale: number; position?: [number, number, number]; children: ReactNode }) {
  return (
    <group position={position} rotation={ISO_ROTATION} scale={[scale, scale, scale]}>
      {children}
    </group>
  );
}
```

- [ ] **Step 2: Write `TieStack.tsx`** (grading pairs from the site: reusable, landscape, junk)

`launchboard/src/illustrations/TieStack.tsx`:
```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

const W = 0.75; // tie width
const H = 0.6;  // tie height

function Tie({ length, position, rotationY = 0 }: { length: number; position: [number, number, number]; rotationY?: number }) {
  return (
    <mesh position={[position[0], H / 2 + position[1], position[2]]} rotation={[0, rotationY, 0]} material={materials.tie}>
      <boxGeometry args={[length, H, W]} />
    </mesh>
  );
}

export function TieStack({ active = false }: IllustrationProps) {
  const junk = useRef<Group>(null!);
  useFrame(({ clock }) => {
    junk.current.position.y = active ? Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.4 : 0;
  });
  return (
    <group>
      <ShadowBlob width={12} depth={9} />
      {/* Reusable */}
      <Tie length={8.5} position={[0, 0, -3]} />
      <Tie length={8.5} position={[0, 0, -2]} />
      {/* Landscape: cut with a notch */}
      <Tie length={4.1} position={[-2.2, 0, -0.25]} />
      <Tie length={4.2} position={[2.15, 0, -0.25]} />
      <Tie length={3.0} position={[-2.75, 0, 0.75]} />
      <Tie length={5.3} position={[1.6, 0, 0.75]} />
      {/* Junk: split pieces */}
      <group ref={junk}>
        <Tie length={3.4} position={[-2.4, 0, 2.3]} rotationY={0.1} />
        <Tie length={2.6} position={[1.2, 0, 2.5]} rotationY={-0.18} />
        <Tie length={1.4} position={[3.4, 0, 3.4]} rotationY={0.5} />
      </group>
    </group>
  );
}
```

- [ ] **Step 3: Write `Train.tsx`** (gondola with ties + switcher locomotive + track)

`launchboard/src/illustrations/Train.tsx`:
```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]} material={materials.machineDark}>
      <cylinderGeometry args={[0.45, 0.45, 0.2, 20]} />
    </mesh>
  );
}

function Truck({ x, axles }: { x: number; axles: number }) {
  const spacing = 1.2;
  const start = -((axles - 1) * spacing) / 2;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.75, 0]} material={materials.machineDark}>
        <boxGeometry args={[axles * spacing + 0.4, 0.4, 2.4]} />
      </mesh>
      {Array.from({ length: axles }, (_, i) => (
        <group key={i}>
          <Wheel position={[start + i * spacing, 0.45, 1.3]} />
          <Wheel position={[start + i * spacing, 0.45, -1.3]} />
        </group>
      ))}
    </group>
  );
}

export function Gondola() {
  return (
    <group>
      <Truck x={-4.6} axles={2} />
      <Truck x={4.6} axles={2} />
      <mesh position={[0, 1.2, 0]} material={materials.machine}><boxGeometry args={[14, 0.3, 3.2]} /></mesh>
      <mesh position={[0, 2.1, 1.5]} material={materials.machine}><boxGeometry args={[14, 1.8, 0.2]} /></mesh>
      <mesh position={[0, 2.1, -1.5]} material={materials.machine}><boxGeometry args={[14, 1.8, 0.2]} /></mesh>
      <mesh position={[6.9, 2.1, 0]} material={materials.machine}><boxGeometry args={[0.2, 1.8, 3.2]} /></mesh>
      <mesh position={[-6.9, 2.1, 0]} material={materials.machine}><boxGeometry args={[0.2, 1.8, 3.2]} /></mesh>
      {[0, 1].map((layer) =>
        [-0.9, 0, 0.9].map((z) => (
          <mesh key={`${layer}-${z}`} position={[-1 + layer * 0.3, 1.55 + layer * 0.42, z]} material={materials.tie}>
            <boxGeometry args={[5.2, 0.4, 0.8]} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Locomotive() {
  return (
    <group>
      <Truck x={-3} axles={3} />
      <Truck x={3} axles={3} />
      <mesh position={[0, 1.2, 0]} material={materials.machine}><boxGeometry args={[10.5, 0.5, 3.1]} /></mesh>
      <RoundedBox args={[3, 3, 2.8]} radius={0.3} smoothness={3} position={[-3.2, 2.95, 0]} material={materials.machine} />
      <mesh position={[-3.2, 3.5, 1.41]} material={materials.machineLight}><boxGeometry args={[2.2, 0.9, 0.02]} /></mesh>
      <mesh position={[-1.69, 3.5, 0]} material={materials.machineLight}><boxGeometry args={[0.02, 0.9, 2.2]} /></mesh>
      <RoundedBox args={[6.2, 2.1, 2.2]} radius={0.45} smoothness={3} position={[1.7, 2.5, 0]} material={materials.machine} />
      <mesh position={[4.81, 2.6, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.machineLight}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 20]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[1.7, 2.1, side * 1.5]} material={materials.machineDark}>
          <boxGeometry args={[6, 0.08, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

export function Track({ length }: { length: number }) {
  const count = Math.floor(length / 1.1);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[-length / 2 + i * 1.1 + 0.55, 0.15, 0]} material={materials.tie}>
          <boxGeometry args={[0.7, 0.3, 4.4]} />
        </mesh>
      ))}
      {[-1.3, 1.3].map((z) => (
        <mesh key={z} position={[0, 0.4, z]} material={materials.rail}>
          <boxGeometry args={[length, 0.2, 0.15]} />
        </mesh>
      ))}
    </group>
  );
}

export function Train({ active = false }: IllustrationProps) {
  const ref = useRef<Group>(null!);
  useFrame(({ clock }) => {
    ref.current.position.x = active ? Math.sin(clock.elapsedTime * 1.5) * 1.2 : 0;
  });
  return (
    <group>
      <ShadowBlob width={30} depth={8} />
      <group ref={ref} position={[0, 0.2, 0]}>
        <group position={[-6, 0, 0]}><Gondola /></group>
        <group position={[7.2, 0, 0]}><Locomotive /></group>
      </group>
    </group>
  );
}
```

- [ ] **Step 4: Write the dev gallery and wire `?gallery`**

`launchboard/src/dev/Gallery.tsx` (Task 11 appends entries to `ITEMS`):
```tsx
import { useState, type ComponentType } from 'react';
import { Text } from '@react-three/drei';
import { fonts, colors } from '../brand';
import { Iso, type IllustrationProps } from '../illustrations/Iso';
import { StudioRig } from '../illustrations/StudioRig';
import { TieStack } from '../illustrations/TieStack';
import { Train } from '../illustrations/Train';

const ITEMS: { name: string; C: ComponentType<IllustrationProps>; scale: number }[] = [
  { name: 'TieStack', C: TieStack, scale: 22 },
  { name: 'Train', C: Train, scale: 9 },
];

export function Gallery() {
  const [active, setActive] = useState(-1);
  return (
    <>
      <StudioRig />
      {ITEMS.map(({ name, C, scale }, i) => {
        const x = -640 + (i % 3) * 640;
        const y = 270 - Math.floor(i / 3) * 540;
        return (
          <group key={name} position={[x, y, 0]} onPointerOver={() => setActive(i)} onPointerOut={() => setActive(-1)}>
            <mesh visible={false}><planeGeometry args={[600, 500]} /></mesh>
            <Iso scale={scale} position={[0, 0, 0]}><C active={active === i} /></Iso>
            <Text font={fonts.medium} fontSize={34} color={colors.ink} position={[0, -200, 100]}>{name}</Text>
          </group>
        );
      })}
    </>
  );
}
```

In `launchboard/src/App.tsx`, import `Gallery` and inside `<Monitor>` render
`{new URLSearchParams(location.search).has('gallery') ? <Gallery /> : (<>…existing tube-check children…</>)}`.

`launchboard/e2e/gallery.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('illustration gallery renders without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?gallery');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/gallery.png' });
  expect(errors).toEqual([]);
});
```

- [ ] **Step 5: Run e2e and review the screenshot**

Run: `cd launchboard && npx playwright test e2e/gallery.spec.ts`
Expected: PASS. In `test-results/gallery.png` compare against `brand/assets/ref/grading.jpg` and `train.jpg`: isometric view from above-left, orange ties, matte grey rolling stock, soft shadow falling left, grey studio ground. If ties look brown/dark, raise ambient intensity in `StudioRig` to 0.8 and re-check.

- [ ] **Step 6: Type-check and commit**

Run: `cd launchboard && npx tsc --noEmit`
Expected: no errors.

```bash
git add launchboard
git commit -m "Add illustration kit with tie stack and train

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Shredder, kiln, crossing signal, globe, and the illustration index

**Files:**
- Create: `launchboard/src/illustrations/Shredder.tsx`, `Kiln.tsx`, `CrossingSignal.tsx`, `Globe.tsx`, `index.ts`
- Modify: `launchboard/src/dev/Gallery.tsx` (iterate the index instead of the hard-coded list)

**Interfaces:**
- Consumes: `materials`, `ShadowBlob`, `Iso`, `IllustrationProps` (Task 10); `IllustrationId` (Task 5); `tubeColors` (Task 2).
- Produces:
  - `<Shredder active? />`, `<Kiln active? />`, `<CrossingSignal active? />`, `<Globe active? />`
  - `ILLUSTRATIONS: Record<IllustrationId, { C: ComponentType<IllustrationProps>; scale: number; lift: number }>` — `scale` is the `Iso` scale for a 350×380 tile; `lift` is the y offset (content px) that centers the drawing in the tile's art area.
  - `seeded(seed: number): () => number` — deterministic PRNG (mulberry32) for chip/charge placement

- [ ] **Step 1: Write `Shredder.tsx`** (twin-motor shredder on a table, orange chip pile, ties in the hopper)

`launchboard/src/illustrations/Shredder.tsx`:
```tsx
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHIP = 0.38;
const PILE = 70;
const FALLING = 6;

function ChipPile() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const rnd = seeded(7);
    const m = new THREE.Object3D();
    for (let i = 0; i < PILE; i++) {
      const r = Math.sqrt(rnd()) * 2.0;
      const a = rnd() * Math.PI * 2;
      m.position.set(Math.cos(a) * r, CHIP / 2 + Math.max(0, 1.1 - r * 0.55) * rnd(), Math.sin(a) * r * 0.8);
      m.rotation.set(rnd() * 0.6, rnd() * Math.PI, rnd() * 0.6);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PILE]} material={materials.tie}>
      <boxGeometry args={[CHIP, CHIP, CHIP]} />
    </instancedMesh>
  );
}

function FallingChips({ active }: { active: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const m = new THREE.Object3D();
  useFrame(({ clock }) => {
    for (let i = 0; i < FALLING; i++) {
      const t = (clock.elapsedTime * 0.9 + i / FALLING) % 1;
      m.position.set((i % 3 - 1) * 0.5, active ? 4.8 - t * 4.6 : -10, (i % 2) * 0.4 - 0.2);
      m.rotation.set(t * 6, t * 4, 0);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, FALLING]} material={materials.tie}>
      <boxGeometry args={[CHIP, CHIP, CHIP]} />
    </instancedMesh>
  );
}

export function Shredder({ active = false }: IllustrationProps) {
  const motors = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { if (active) motors.current.rotation.x += dt * 8; });
  return (
    <group>
      <ShadowBlob width={14} depth={10} offset={[-0.25, 0.1]} />
      {[[-2.9, -1.9], [2.9, -1.9], [-2.9, 1.9], [2.9, 1.9]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 2.5, z]} material={materials.machine}><boxGeometry args={[0.35, 5, 0.35]} /></mesh>
      ))}
      <mesh position={[0, 5.1, 0]} material={materials.machine}><boxGeometry args={[6.4, 0.3, 4.4]} /></mesh>
      <mesh position={[-0.8, 6.25, 0]} material={materials.machine}><boxGeometry args={[4.4, 2, 3]} /></mesh>
      <mesh position={[2.4, 6.2, 0]} material={materials.machineLight}><boxGeometry args={[2, 1.9, 3]} /></mesh>
      <group ref={motors} position={[4.3, 6.3, 0]}>
        {[-0.75, 0.75].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={materials.machineLight}>
            <cylinderGeometry args={[0.65, 0.65, 2.2, 24]} />
          </mesh>
        ))}
      </group>
      {/* Hopper: open box with a slanted throat */}
      <mesh position={[-0.8, 7.9, 0]} rotation={[0, 0, -0.35]} material={materials.machineDark}><boxGeometry args={[3, 0.2, 3]} /></mesh>
      <mesh position={[-0.8, 9.6, 1.9]} material={materials.machine}><boxGeometry args={[4.6, 3.4, 0.2]} /></mesh>
      <mesh position={[-0.8, 9.6, -1.9]} material={materials.machine}><boxGeometry args={[4.6, 3.4, 0.2]} /></mesh>
      <mesh position={[-3.0, 9.6, 0]} material={materials.machine}><boxGeometry args={[0.2, 3.4, 3.8]} /></mesh>
      <mesh position={[1.4, 9.6, 0]} material={materials.machine}><boxGeometry args={[0.2, 3.4, 3.8]} /></mesh>
      <mesh position={[-1.2, 10.2, 0.3]} rotation={[0, 0, 0.12]} material={materials.tie}><boxGeometry args={[0.6, 5, 0.7]} /></mesh>
      <mesh position={[-0.2, 9.2, -0.6]} rotation={[0.1, 0, -0.08]} material={materials.tie}><boxGeometry args={[0.6, 3.4, 0.7]} /></mesh>
      <group position={[0, 0, 0]}>
        <ChipPile />
        <FallingChips active={active} />
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Write `Kiln.tsx`** (translucent shell, pink charge, stack and cage)

`launchboard/src/illustrations/Kiln.tsx`:
```tsx
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import { seeded } from './Shredder';
import type { IllustrationProps } from './Iso';

const CHARGE = 40;

function Charge({ active }: { active: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const base = useRef<THREE.Vector3[]>([]);
  useLayoutEffect(() => {
    const rnd = seeded(11);
    base.current = Array.from({ length: CHARGE }, () => {
      const r = Math.sqrt(rnd()) * 1.6;
      const a = rnd() * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * r, 2.9 + rnd() * 0.9, Math.sin(a) * r);
    });
  }, []);
  const m = new THREE.Object3D();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    materials.kilnCharge.emissiveIntensity = active ? 1.1 + 0.4 * Math.sin(t * 9) : 0.45 + 0.2 * Math.sin(t * 2);
    base.current.forEach((p, i) => {
      const jitter = active ? Math.sin(t * 7 + i) * 0.12 : 0;
      m.position.set(p.x, p.y + jitter, p.z);
      m.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      m.updateMatrix();
      ref.current.setMatrixAt(i, m.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, CHARGE]} material={materials.kilnCharge}>
      <boxGeometry args={[0.55, 0.55, 0.55]} />
    </instancedMesh>
  );
}

function Ring({ y, radius, tube = 0.09 }: { y: number; radius: number; tube?: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.machine}>
      <torusGeometry args={[radius, tube, 12, 64]} />
    </mesh>
  );
}

export function Kiln({ active = false }: IllustrationProps) {
  return (
    <group>
      <ShadowBlob width={11} depth={11} offset={[-0.2, 0.15]} />
      <Ring y={0.2} radius={2.6} />
      <Ring y={2.2} radius={2.6} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.6, 1.2, Math.sin(a) * 2.6]} material={materials.machine}>
            <cylinderGeometry args={[0.1, 0.1, 2.4, 10]} />
          </mesh>
        );
      })}
      <Charge active={active} />
      <mesh position={[0, 4.3, 0]} material={materials.glass}><cylinderGeometry args={[2.4, 2.4, 4.2, 48, 1, true]} /></mesh>
      <mesh position={[0, 6.4, 0]} scale={[1, 0.45, 1]} material={materials.glass}>
        <sphereGeometry args={[2.4, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 7.45, 0]} material={materials.machineLight}><cylinderGeometry args={[1.4, 1.4, 0.3, 32]} /></mesh>
      <mesh position={[0, 8.1, 0]} material={materials.machine}><cylinderGeometry args={[0.65, 0.65, 1.0, 24]} /></mesh>
      <mesh position={[0, 9.2, 0]} material={materials.machine}><cylinderGeometry args={[0.3, 0.3, 1.2, 16]} /></mesh>
      <mesh position={[0, 10.9, 0]} material={materials.machine}><cylinderGeometry args={[0.75, 0.75, 2.2, 24]} /></mesh>
      <mesh position={[0, 12.8, 0]} material={materials.machine}><cylinderGeometry args={[0.6, 0.6, 1.7, 24, 1, true]} /></mesh>
      <Ring y={8.7} radius={2.7} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        const x = Math.cos(a) * 1.7;
        const z = Math.sin(a) * 1.7;
        return (
          <mesh key={i} position={[x, 10, z]} rotation={[Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55]} material={materials.machine}>
            <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}
```

- [ ] **Step 3: Write `CrossingSignal.tsx`**

`launchboard/src/illustrations/CrossingSignal.tsx`:
```tsx
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { materials } from './materials';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

export function CrossingSignal({ active = false }: IllustrationProps) {
  const lamps = useMemo(() => [materials.signalLamp.clone(), materials.signalLamp.clone()], []);
  useFrame(({ clock }) => {
    const on = Math.floor(clock.elapsedTime * 2.4) % 2;
    lamps[0].emissiveIntensity = active && on === 0 ? 1.6 : 0;
    lamps[1].emissiveIntensity = active && on === 1 ? 1.6 : 0;
  });
  return (
    <group>
      <ShadowBlob width={6} depth={14} offset={[-0.35, 0.3]} opacity={0.2} />
      <mesh position={[0, 0.7, 0]} material={materials.machineDark}><cylinderGeometry args={[0.45, 0.45, 1.4, 20]} /></mesh>
      <mesh position={[0, 6, 0]} material={materials.machine}><cylinderGeometry args={[0.15, 0.15, 11, 12]} /></mesh>
      {[1, -1].map((dir) => (
        <mesh key={dir} position={[0, 9.8, 0.2]} rotation={[0, 0, (dir * Math.PI) / 4]} material={materials.machine}>
          <boxGeometry args={[4.2, 0.7, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0, 7.2, 0.1]} material={materials.machine}><boxGeometry args={[3.2, 0.15, 0.15]} /></mesh>
      {[-1.4, 1.4].map((x, i) => (
        <group key={x} position={[x, 7.2, 0.25]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.machine}><cylinderGeometry args={[0.85, 0.85, 0.12, 28]} /></mesh>
          <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={lamps[i]}><cylinderGeometry args={[0.42, 0.42, 0.1, 24]} /></mesh>
          <mesh position={[0, 0.2, 0.4]} rotation={[Math.PI / 2, 0, 0]} material={materials.machine}>
            <cylinderGeometry args={[0.5, 0.5, 0.6, 20, 1, true, -Math.PI / 2, Math.PI]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
```

- [ ] **Step 4: Write `Globe.tsx`** (grey glass ocean, Carbon Green continents)

`launchboard/src/illustrations/Globe.tsx`:
```tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tubeColors } from '../brand';
import { ShadowBlob } from './ShadowBlob';
import type { IllustrationProps } from './Iso';

type LonLat = [number, number];

const CONTINENTS: LonLat[][] = [
  [[-165, 65], [-140, 70], [-95, 72], [-60, 60], [-55, 50], [-80, 25], [-97, 18], [-105, 22], [-125, 40], [-150, 58]],
  [[-80, 10], [-60, 8], [-35, -7], [-40, -22], [-58, -38], [-70, -55], [-75, -20], [-81, -5]],
  [[-10, 36], [-9, 44], [0, 50], [10, 58], [30, 70], [90, 76], [140, 72], [170, 66], [140, 50], [122, 30], [105, 10], [80, 8], [60, 25], [35, 30], [25, 40], [10, 38]],
  [[-17, 15], [-5, 36], [10, 37], [33, 31], [51, 12], [40, -15], [20, -35], [12, -18], [8, 4], [-8, 5]],
  [[113, -22], [130, -12], [145, -12], [153, -28], [145, -38], [116, -35]],
  [[-50, 60], [-20, 70], [-30, 83], [-60, 80]],
];

function globeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#8A8A8C';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = tubeColors.carbonGreen;
  g.lineJoin = 'round';
  g.lineWidth = 18;
  g.strokeStyle = tubeColors.carbonGreen;
  for (const poly of CONTINENTS) {
    g.beginPath();
    poly.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * c.width;
      const y = ((90 - lat) / 180) * c.height;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    });
    g.closePath();
    g.fill();
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Globe({ active = false }: IllustrationProps) {
  const map = useMemo(globeTexture, []);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => { ref.current.rotation.y += dt * (active ? 1.6 : 0.25); });
  return (
    <group>
      <ShadowBlob width={12} depth={7} offset={[-0.45, 0.2]} opacity={0.22} />
      <mesh ref={ref} position={[0, 4.2, 0]} rotation={[0.35, 0, 0.2]}>
        <sphereGeometry args={[3, 64, 32]} />
        <meshStandardMaterial map={map} roughness={0.45} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 5: Write the index and update the gallery**

`launchboard/src/illustrations/index.ts`:
```ts
import type { ComponentType } from 'react';
import type { IllustrationId } from '../games/types';
import type { IllustrationProps } from './Iso';
import { TieStack } from './TieStack';
import { Train } from './Train';
import { Shredder } from './Shredder';
import { Kiln } from './Kiln';
import { CrossingSignal } from './CrossingSignal';
import { Globe } from './Globe';

export const ILLUSTRATIONS: Record<IllustrationId, { C: ComponentType<IllustrationProps>; scale: number; lift: number }> = {
  tieStack: { C: TieStack, scale: 17, lift: -20 },
  train: { C: Train, scale: 9, lift: -20 },
  shredder: { C: Shredder, scale: 15, lift: -80 },
  kiln: { C: Kiln, scale: 13, lift: -85 },
  crossing: { C: CrossingSignal, scale: 15, lift: -80 },
  globe: { C: Globe, scale: 22, lift: -60 },
};
```

Replace the `ITEMS` constant and its now-unused `TieStack`/`Train` imports in `launchboard/src/dev/Gallery.tsx` with:
```tsx
import { ILLUSTRATIONS } from '../illustrations/index';

const ITEMS = Object.entries(ILLUSTRATIONS).map(([name, v]) => ({ name, C: v.C, scale: v.scale, lift: v.lift }));
```
and change the illustration line to `<Iso scale={scale} position={[0, lift, 0]}><C active={active === i} /></Iso>` (destructure `lift` alongside `scale`). Also change the gallery to always show everything active for review by replacing `active === i` with `active === -1 || active === i`.

- [ ] **Step 6: Run the gallery e2e and review**

Run: `cd launchboard && npx playwright test e2e/gallery.spec.ts`
Expected: PASS, no page errors. In `test-results/gallery.png` check each of the six drawings against the references in `brand/assets/ref/`:
- shredder: grey table, hopper with orange ties, orange chip pile under the table
- kiln: translucent grey shell, glowing pink cubes inside, stack on top
- crossing signal: grey pole, crossbuck, two lamps (one lit pink)
- globe: grey sphere with green land masses
- every drawing sits roughly centered in its cell; if not, adjust that entry's `lift` in `index.ts` (the same values are used on the board tiles).

- [ ] **Step 7: Type-check and commit**

Run: `cd launchboard && npx tsc --noEmit`
Expected: no errors.

```bash
git add launchboard
git commit -m "Add shredder, kiln, crossing signal and globe illustrations

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Board UI components (stacked headline, tile, ticker)

**Files:**
- Create: `launchboard/src/ui/StackedHeadline.tsx`, `launchboard/src/ui/Tile.tsx`, `launchboard/src/ui/Ticker.tsx`, `launchboard/src/ui/layout.ts`
- Test: `launchboard/tests/layout.test.ts`

**Interfaces:**
- Consumes: `GameDefinition`, `Accent` (Task 5); `ILLUSTRATIONS` (Task 11); `Iso` (Task 10); `colors`, `tubeColors`, `fonts` (Task 2).
- Produces:
  - `layout.ts`: `TILE_W = 350`, `TILE_H = 380`, `tilePosition(index: number): [number, number]` (3×2 grid, columns x = −55, 325, 705; rows y = 270, −140), `accentColor(a: Accent): string`, `easeInOut(t: number): number`, `LEFT_X = -880`, `TICKER_Y = -470`
  - `<StackedHeadline lines: string[]; position: [number, number]; fontSize: number; lineHeight: number; color?: string />` — left/top anchored
  - `<Tile game: GameDefinition; index: number; focused: boolean; launching: boolean; shakeAt: number; onHover(i: number): void; onSelect(i: number): void />`
  - `<Ticker items: string[]; y: number />`

- [ ] **Step 1: Write the failing layout test**

`launchboard/tests/layout.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { tilePosition, accentColor, easeInOut, TILE_W, TILE_H } from '../src/ui/layout';

describe('board layout', () => {
  it('places six tiles in a 3×2 grid in the right 62% of the frame', () => {
    expect([0, 1, 2, 3, 4, 5].map(tilePosition)).toEqual([
      [-55, 270], [325, 270], [705, 270],
      [-55, -140], [325, -140], [705, -140],
    ]);
  });
  it('keeps every tile inside the 80 px safe margin', () => {
    for (let i = 0; i < 6; i++) {
      const [x, y] = tilePosition(i);
      expect(x + TILE_W / 2).toBeLessThanOrEqual(960 - 80);
      expect(y + TILE_H / 2).toBeLessThanOrEqual(540 - 80);
      expect(y - TILE_H / 2).toBeGreaterThan(-470 + 40);
    }
  });
  it('maps accents to phosphor-safe colors', () => {
    expect(accentColor('orange')).toBe('#E89A45');
    expect(accentColor('pink')).toBe('#EE6BD2');
    expect(accentColor('green')).toBe('#18BE78');
  });
  it('eases from 0 to 1 symmetrically', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 9);
    expect(easeInOut(2)).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd launchboard && npx vitest run tests/layout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `layout.ts`**

`launchboard/src/ui/layout.ts`:
```ts
import { tubeColors } from '../brand';
import type { Accent } from '../games/types';

export const TILE_W = 350;
export const TILE_H = 380;
export const LEFT_X = -880;
export const TICKER_Y = -470;

const COLS = [-55, 325, 705];
const ROWS = [270, -140];

export function tilePosition(index: number): [number, number] {
  return [COLS[index % 3], ROWS[Math.floor(index / 3)]];
}

export function accentColor(a: Accent): string {
  return a === 'orange' ? tubeColors.tieOrange : a === 'pink' ? tubeColors.kilnPink : tubeColors.carbonGreen;
}

export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
```

Run: `cd launchboard && npx vitest run tests/layout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 4: Write `StackedHeadline.tsx`**

`launchboard/src/ui/StackedHeadline.tsx`:
```tsx
import { Text } from '@react-three/drei';
import { colors, fonts } from '../brand';

export function StackedHeadline({ lines, position, fontSize, lineHeight, color = colors.ink }: {
  lines: string[]; position: [number, number]; fontSize: number; lineHeight: number; color?: string;
}) {
  return (
    <group position={[position[0], position[1], 50]}>
      {lines.map((line, i) => (
        <Text key={i} font={fonts.semibold} fontSize={fontSize} color={color} anchorX="left" anchorY="top"
          position={[0, -i * lineHeight, 0]} letterSpacing={-0.01}>
          {line}
        </Text>
      ))}
    </group>
  );
}
```

- [ ] **Step 5: Write `Tile.tsx`**

`launchboard/src/ui/Tile.tsx`:
```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { colors, fonts } from '../brand';
import type { GameDefinition } from '../games/types';
import { ILLUSTRATIONS } from '../illustrations/index';
import { Iso } from '../illustrations/Iso';
import { TILE_H, TILE_W, accentColor, easeInOut, tilePosition } from './layout';

const ZOOM_MS = 350;
const ZOOM_SCALE = 5.5;

export function Tile({ game, index, focused, launching, shakeAt, onHover, onSelect }: {
  game: GameDefinition; index: number; focused: boolean; launching: boolean; shakeAt: number;
  onHover(i: number): void; onSelect(i: number): void;
}) {
  const group = useRef<Group>(null!);
  const shadow = useRef<Mesh>(null!);
  const lift = useRef(0);
  const zoom = useRef(0);
  const [px, py] = tilePosition(index);
  const art = ILLUSTRATIONS[game.illustration];
  const soon = game.status === 'coming-soon';

  useFrame((_, dt) => {
    lift.current += ((focused ? 1 : 0) - lift.current) * Math.min(1, dt * 12);
    zoom.current = launching ? Math.min(1, zoom.current + (dt * 1000) / ZOOM_MS) : 0;
    const z = easeInOut(zoom.current);
    const sinceShake = performance.now() - shakeAt;
    const shake = sinceShake < 400 ? Math.sin(sinceShake / 18) * 10 * (1 - sinceShake / 400) : 0;
    group.current.position.set(px * (1 - z) + shake, py * (1 - z) + lift.current * 12, 100 + z * 800);
    group.current.scale.setScalar(1 + (ZOOM_SCALE - 1) * z);
    shadow.current.position.set(-10 - lift.current * 10, -14 - lift.current * 14, -20);
    (shadow.current.material as { opacity: number }).opacity = 0.12 + lift.current * 0.1;
  });

  return (
    <group ref={group}
      onPointerOver={(e) => { e.stopPropagation(); onHover(index); }}
      onClick={(e) => { e.stopPropagation(); onSelect(index); }}>
      <mesh ref={shadow}>
        <planeGeometry args={[TILE_W, TILE_H]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>
      <RoundedBox args={[TILE_W, TILE_H, 6]} radius={3} smoothness={2}>
        <meshBasicMaterial color={colors.lightGrey} toneMapped={false} />
      </RoundedBox>
      <group position={[0, 40, 40]}>
        <Iso scale={art.scale} position={[0, art.lift, 0]}>
          <art.C active={focused && !soon} />
        </Iso>
      </group>
      {soon && (
        <mesh position={[0, 40, 300]}>
          <planeGeometry args={[TILE_W - 20, TILE_H - 110]} />
          <meshBasicMaterial color={colors.lightGrey} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      <Text font={fonts.medium} fontSize={34} color={soon ? colors.muted : colors.ink} anchorX="center" anchorY="middle"
        position={[0, -135, 320]}>
        {game.title}
      </Text>
      <mesh position={[0, -170, 320]} visible={focused}>
        <planeGeometry args={[90, 6]} />
        <meshBasicMaterial color={accentColor(game.accent)} toneMapped={false} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 6: Write `Ticker.tsx`**

`launchboard/src/ui/Ticker.tsx`:
```tsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { colors, fonts, tubeColors } from '../brand';

const SPEED = 90; // px per second
const SEP = '     ·     ';

export function Ticker({ items, y }: { items: string[]; y: number }) {
  const strip = useRef<Group>(null!);
  const dash = useRef<Mesh>(null!);
  const [width, setWidth] = useState(1600);
  const label = items.join(SEP) + SEP;

  useFrame((_, dt) => {
    strip.current.position.x -= SPEED * dt;
    if (strip.current.position.x < -960 - width) strip.current.position.x += width;
    dash.current.position.x = ((performance.now() / 1000) * 420) % 2200 - 1100;
  });

  // troika reports the laid-out text bounds once the glyphs are ready
  const onSync = (t: { textRenderInfo?: { blockBounds: number[] } }) => {
    const b = t.textRenderInfo?.blockBounds;
    if (b && Math.abs(b[2] - b[0] - width) > 1) setWidth(b[2] - b[0]);
  };

  return (
    <group position={[0, y, 60]}>
      <mesh position={[0, 34, 0]}>
        <planeGeometry args={[1920, 4]} />
        <meshBasicMaterial color={tubeColors.kilnPink} toneMapped={false} />
      </mesh>
      <mesh ref={dash} position={[0, 34, 1]}>
        <planeGeometry args={[140, 10]} />
        <meshBasicMaterial color={colors.white} toneMapped={false} />
      </mesh>
      <group ref={strip} position={[-880, 0, 0]}>
        {[0, 1, 2].map((copy) => (
          <Text key={copy} font={fonts.medium} fontSize={30} color={colors.slate} anchorX="left" anchorY="middle"
            position={[copy * width, 0, 0]} onSync={copy === 0 ? onSync : undefined}>
            {label}
          </Text>
        ))}
      </group>
    </group>
  );
}
```

- [ ] **Step 7: Type-check and commit**

Run: `cd launchboard && npx tsc --noEmit && npx vitest run`
Expected: no type errors; all unit tests PASS.

```bash
git add launchboard
git commit -m "Add board UI components: stacked headline, tile, ticker

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Boot, Attract, and Board screens with a screen router

**Files:**
- Create: `launchboard/src/screens/Boot.tsx`, `Attract.tsx`, `Board.tsx`, `ScreenRouter.tsx`
- Modify: `launchboard/src/App.tsx` (render `ScreenRouter`; remove the spinning-tie check)
- Delete: `launchboard/e2e/tube.spec.ts`
- Create: `launchboard/e2e/screens.spec.ts`

**Interfaces:**
- Consumes: `appStore`, `useApp` (Task 3); `moveFocus` (Task 4); `inputBus` (Task 4); `GameDefinition` (Task 5); `tubeBus`, `DURATIONS` (Task 7); illustrations (Tasks 10–11); `StackedHeadline`, `Tile`, `Ticker`, layout constants (Task 12); `Monogram` (Task 9); `config`, `tickerItems` (Task 2).
- Produces:
  - `<Boot />` — pulses `'boot'` on mount and calls `bootDone()` after `DURATIONS.boot`; draws `<Attract />` underneath
  - `<Attract />` — tie-yard scene + headline + blinking "TOUCH TO PLAY" + ITD lockup
  - `<Board games: GameDefinition[] />` — handles `up/down/left/right/select` from `inputBus` while `screen === 'board'`; hover sets focus; select on a playable tile zooms, pulses `'channel'`, then calls `launch(id)` after 350 ms; select on a placeholder shakes the tile
  - `<ScreenRouter games: GameDefinition[]; gameHost?: ReactNode />` — renders the component for the current `screen` (`gameHost` is filled in Task 14)

- [ ] **Step 1: Write `Boot.tsx` and `Attract.tsx`**

`launchboard/src/screens/Boot.tsx`:
```tsx
import { useEffect } from 'react';
import { appStore } from '../state/store';
import { DURATIONS } from '../tube/timeline';
import { tubeBus } from '../tube/tubeBus';
import { Attract } from './Attract';

export function Boot() {
  useEffect(() => {
    tubeBus.pulse('boot');
    const t = setTimeout(() => appStore.getState().bootDone(), DURATIONS.boot);
    return () => clearTimeout(t);
  }, []);
  return <Attract />;
}
```

`launchboard/src/screens/Attract.tsx`:
```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import { colors, fonts } from '../brand';
import { config } from '../config';
import { Iso } from '../illustrations/Iso';
import { CrossingSignal } from '../illustrations/CrossingSignal';
import { Kiln } from '../illustrations/Kiln';
import { Shredder } from '../illustrations/Shredder';
import { TieStack } from '../illustrations/TieStack';
import { Track, Train } from '../illustrations/Train';
import { Monogram } from '../ui/Monogram';
import { StackedHeadline } from '../ui/StackedHeadline';
import { LEFT_X } from '../ui/layout';

function Yard() {
  const drift = useRef<Group>(null!);
  const train = useRef<Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    drift.current.position.set(260 + Math.sin(t * 0.05) * 60, -40 + Math.cos(t * 0.04) * 30, 0);
    train.current.position.x = ((t * 3) % 80) - 40;
  });
  return (
    <group ref={drift}>
      <Iso scale={17}>
        <Track length={70} />
        <group ref={train} position={[0, 0.3, 0]}><Train active /></group>
        <group position={[-10, 0, -15]}><Shredder active /></group>
        <group position={[12, 0, -15]}><Kiln active /></group>
        <group position={[-3, 0, 5]}><CrossingSignal active /></group>
        <group position={[18, 0, 9]}><TieStack /></group>
      </Iso>
    </group>
  );
}

function BlinkingPrompt() {
  const ref = useRef<Group>(null!);
  useFrame(({ clock }) => { ref.current.visible = Math.floor(clock.elapsedTime * 1.2) % 2 === 0; });
  return (
    <group ref={ref}>
      <Text font={fonts.semibold} fontSize={46} color={colors.ink} anchorX="left" anchorY="middle"
        position={[LEFT_X, -250, 200]} letterSpacing={0.14}>
        TOUCH TO PLAY
      </Text>
    </group>
  );
}

export function Attract() {
  return (
    <>
      <Yard />
      <StackedHeadline lines={config.headlineLines} position={[LEFT_X, 420]} fontSize={140} lineHeight={150} />
      <BlinkingPrompt />
      <Monogram height={56} color={colors.ink} position={[LEFT_X + 33, -430, 200]} />
      <Text font={fonts.medium} fontSize={28} color={colors.slate} anchorX="left" anchorY="middle" position={[LEFT_X + 90, -430, 200]}>
        International Tie Disposal
      </Text>
    </>
  );
}
```

- [ ] **Step 2: Write `Board.tsx`**

`launchboard/src/screens/Board.tsx`:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from '@react-three/drei';
import { colors, fonts } from '../brand';
import { config, tickerItems } from '../config';
import type { GameDefinition } from '../games/types';
import { appStore, useApp } from '../state/store';
import { tubeBus } from '../tube/tubeBus';
import { moveFocus } from '../ui/focus';
import { inputBus } from '../ui/inputBus';
import { LEFT_X, TICKER_Y } from '../ui/layout';
import { Monogram } from '../ui/Monogram';
import { StackedHeadline } from '../ui/StackedHeadline';
import { Ticker } from '../ui/Ticker';
import { Tile } from '../ui/Tile';

const LAUNCH_DELAY_MS = 350;

export function Board({ games }: { games: GameDefinition[] }) {
  const focusIndex = useApp((s) => s.focusIndex);
  const [launching, setLaunching] = useState<number | null>(null);
  const [shakes, setShakes] = useState<Record<number, number>>({});
  const launchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(launchTimer.current), []);

  const select = useCallback((i: number) => {
    const game = games[i];
    appStore.getState().setFocus(i);
    if (launching !== null) return;
    if (game.status !== 'playable') {
      setShakes((s) => ({ ...s, [i]: performance.now() }));
      return;
    }
    setLaunching(i);
    tubeBus.pulse('channel');
    launchTimer.current = setTimeout(() => {
      appStore.getState().launch(game.id);
      setLaunching(null);
    }, LAUNCH_DELAY_MS);
  }, [games, launching]);

  useEffect(() => inputBus.subscribe((action) => {
    const s = appStore.getState();
    if (s.screen !== 'board') return;
    if (action === 'select') select(s.focusIndex);
    else if (action !== 'back') s.setFocus(moveFocus(s.focusIndex, action, 3, games.length));
  }), [select, games.length]);

  return (
    <>
      <StackedHeadline lines={config.headlineLines} position={[LEFT_X, 460]} fontSize={120} lineHeight={128} />
      <Monogram height={150} color={colors.ink} position={[LEFT_X + 88, -110, 50]} />
      <Text font={fonts.regular} fontSize={38} color={colors.slate} anchorX="left" anchorY="middle" position={[LEFT_X, -270, 50]}>
        {config.subcopy}
      </Text>
      {games.map((g, i) => (
        <Tile key={g.id} game={g} index={i} focused={focusIndex === i} launching={launching === i}
          shakeAt={shakes[i] ?? -Infinity}
          onHover={(n) => appStore.getState().setFocus(n)} onSelect={select} />
      ))}
      <Ticker items={tickerItems()} y={TICKER_Y} />
    </>
  );
}
```

- [ ] **Step 3: Write `ScreenRouter.tsx`**

`launchboard/src/screens/ScreenRouter.tsx`:
```tsx
import type { ReactNode } from 'react';
import type { GameDefinition } from '../games/types';
import { useApp } from '../state/store';
import { Attract } from './Attract';
import { Board } from './Board';
import { Boot } from './Boot';

export function ScreenRouter({ games, gameHost = null }: { games: GameDefinition[]; gameHost?: ReactNode }) {
  const screen = useApp((s) => s.screen);
  switch (screen) {
    case 'boot': return <Boot />;
    case 'attract': return <Attract />;
    case 'board': return <Board games={games} />;
    case 'game': return <>{gameHost}</>;
  }
}
```

- [ ] **Step 4: Point the temporary App at the router**

Replace `launchboard/src/App.tsx` with (Task 15 replaces it again with the full wiring):
```tsx
import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Gallery } from './dev/Gallery';
import { installE2eHooks } from './e2eHooks';
import { buildRegistry } from './games/registry';
import { StudioRig } from './illustrations/StudioRig';
import { ScreenRouter } from './screens/ScreenRouter';
import { Bezel } from './tube/Bezel';
import { computeLayout } from './tube/geometry';
import { TubeRenderer } from './tube/TubeRenderer';

const params = new URLSearchParams(window.location.search);
const games = buildRegistry({ includeTestPattern: params.has('e2e') });
installE2eHooks();

function Monitor({ children }: { children: ReactNode }) {
  const size = useThree((s) => s.size);
  const layout = computeLayout(size.width, size.height);
  return <TubeRenderer bezel={<Bezel layout={layout} viewW={size.width} viewH={size.height} />}>{children}</TubeRenderer>;
}

export default function App() {
  return (
    <Canvas orthographic flat dpr={[1, 2]} camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 5000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Monitor>
        <StudioRig />
        {params.has('gallery') ? <Gallery /> : <ScreenRouter games={games} />}
      </Monitor>
    </Canvas>
  );
}
```

Delete the old check: `git rm launchboard/e2e/tube.spec.ts`

- [ ] **Step 5: Write the screens e2e test**

`launchboard/e2e/screens.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

// Content-space center of tile index 4 (see src/ui/layout.ts). Hard-coded because
// Playwright cannot import modules that read import.meta.env.
const TILE_4: [number, number] = [325, -140];

type Hooks = {
  getState(): { screen: string; focusIndex: number; toBoard(): void };
  contentToScreen(x: number, y: number): { px: number; py: number };
};
declare global { interface Window { __launchboard?: Hooks } }

test('boot → attract → board, with pointer focus through the curved glass', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const state = () => page.evaluate(() => window.__launchboard!.getState());

  await page.goto('/?e2e');
  await page.waitForFunction(() => !!window.__launchboard);
  await expect.poll(async () => (await state()).screen, { timeout: 10_000 }).toBe('attract');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/attract.png' });

  await page.evaluate(() => window.__launchboard!.getState().toBoard());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/board.png' });

  const pt = await page.evaluate(([x, y]) => window.__launchboard!.contentToScreen(x, y), TILE_4);
  await page.mouse.move(pt.px, pt.py);
  await expect.poll(async () => (await state()).focusIndex).toBe(4);

  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await state()).focusIndex).toBe(3);

  expect(errors).toEqual([]);
});
```

`getState()` returns the store state object; Playwright serializes its data fields and drops the functions, which is all these assertions need.

- [ ] **Step 6: Run the e2e test and review screenshots**

Run: `cd launchboard && npx playwright test e2e/screens.spec.ts`
Expected: FAIL on the `ArrowLeft` assertion (keyboard events are not yet routed into `inputBus`; that lands in Task 15). Everything before it must pass. Temporarily comment out the two `ArrowLeft` lines, re-run, and confirm PASS. Leave them commented with `// enabled in Task 15`.

Review `test-results/attract.png`: stacked "Have / Some Fun / At AREMA" at left, blinking prompt, yard with track/train/shredder/kiln/crossing on the right, ITD lockup bottom-left, all inside the curved tube and bezel.
Review `test-results/board.png`: headline + monogram + subcopy left, six light-grey tiles (tile 1 = "Test Pattern", others "Coming soon..." with washed-out art), pink rail ticker along the bottom.

- [ ] **Step 7: Type-check and commit**

Run: `cd launchboard && npx tsc --noEmit && npx vitest run`
Expected: no errors; unit tests PASS.

```bash
git add -A launchboard
git commit -m "Add boot, attract and board screens with screen router

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Game host, SIGNAL LOST card, and the test-pattern game

**Files:**
- Create: `launchboard/src/screens/GameHost.tsx`, `launchboard/src/screens/SignalLost.tsx`
- Modify: `launchboard/src/games/test-pattern/TestPattern.tsx` (real body)
- Modify: `launchboard/src/games/registry.ts` (add `includeBrokenGame` option)
- Modify: `launchboard/tests/registry.test.ts`
- Modify: `launchboard/src/App.tsx` (pass `gameHost`)

**Interfaces:**
- Consumes: `GameDefinition`, `GameContext`, `GameComponent` (Task 5); `appStore`, `useApp` (Task 3); `inputBus` (Task 4); `tubeBus` (Task 7); `colors`, `tubeColors`, `fonts` (Task 2).
- Produces:
  - `buildRegistry(opts: { includeTestPattern: boolean; includeBrokenGame?: boolean })` — broken game (`id: 'broken-game'`, load rejects) goes in slot 1
  - `BROKEN_GAME_ID = 'broken-game'`
  - `<GameHost games: GameDefinition[] />` — loads the active game, builds its `GameContext`, catches load/render failures and shows `<SignalLost />` for 3 s before `exitGame()`
  - `SIGNAL_LOST_MS = 3000`
  - `<SignalLost />`

- [ ] **Step 1: Extend the registry test (failing)**

In `launchboard/tests/registry.test.ts`, add `BROKEN_GAME_ID` to the existing import from `'../src/games/registry'`, then append:
```ts
describe('broken game option', () => {
  it('puts a failing playable game in slot 1 only when requested', async () => {
    expect(buildRegistry({ includeTestPattern: true })[1].id).not.toBe(BROKEN_GAME_ID);
    const games = buildRegistry({ includeTestPattern: true, includeBrokenGame: true });
    expect(games[1]).toMatchObject({ id: BROKEN_GAME_ID, status: 'playable' });
    await expect(games[1].load!()).rejects.toThrow('intentional');
    expect(validateRegistry(games)).toEqual([]);
  });
});
```

Run: `cd launchboard && npx vitest run tests/registry.test.ts`
Expected: FAIL — `BROKEN_GAME_ID` is not exported.

- [ ] **Step 2: Implement the registry option**

In `launchboard/src/games/registry.ts`, add after `TEST_PATTERN`:
```ts
export const BROKEN_GAME_ID = 'broken-game';

const BROKEN_GAME: GameDefinition = {
  id: BROKEN_GAME_ID,
  title: 'Broken Game',
  accent: 'orange',
  illustration: 'train',
  status: 'playable',
  load: () => Promise.reject(new Error('intentional load failure (e2e)')),
};
```
and replace `buildRegistry` with:
```ts
export function buildRegistry(opts: { includeTestPattern: boolean; includeBrokenGame?: boolean }): GameDefinition[] {
  const games = [...BASE_GAMES];
  if (opts.includeTestPattern) games[0] = TEST_PATTERN;
  if (opts.includeBrokenGame) games[1] = BROKEN_GAME;
  return games;
}
```

Run: `cd launchboard && npx vitest run tests/registry.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 3: Write `SignalLost.tsx`**

`launchboard/src/screens/SignalLost.tsx`:
```tsx
import { Text } from '@react-three/drei';
import { colors, fonts } from '../brand';

export function SignalLost() {
  return (
    <group position={[0, 0, 800]}>
      <mesh>
        <planeGeometry args={[1920, 1080]} />
        <meshBasicMaterial color={colors.graphite} toneMapped={false} />
      </mesh>
      <Text font={fonts.semibold} fontSize={140} color={colors.lightGrey} anchorX="center" anchorY="middle" position={[0, 40, 10]} letterSpacing={0.06}>
        SIGNAL LOST
      </Text>
      <Text font={fonts.regular} fontSize={38} color={colors.muted} anchorX="center" anchorY="middle" position={[0, -80, 10]}>
        Returning to the board...
      </Text>
    </group>
  );
}
```

- [ ] **Step 4: Write `GameHost.tsx`**

`launchboard/src/screens/GameHost.tsx`:
```tsx
import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { GameComponent, GameContext, GameDefinition } from '../games/types';
import { appStore, useApp } from '../state/store';
import { tubeBus } from '../tube/tubeBus';
import { inputBus } from '../ui/inputBus';
import { SignalLost } from './SignalLost';

export const SIGNAL_LOST_MS = 3000;

class GameBoundary extends Component<{ onError(): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    console.warn('Game crashed:', error);
    this.props.onError();
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export function GameHost({ games }: { games: GameDefinition[] }) {
  const activeId = useApp((s) => s.activeGameId);
  const quality = useApp((s) => s.quality);
  const game = games.find((g) => g.id === activeId);
  const [Game, setGame] = useState<GameComponent | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setGame(null);
    setFailed(false);
    if (!game?.load) { setFailed(true); return; }
    game.load()
      .then((m) => { if (alive) setGame(() => m.default); })
      .catch((err) => { console.warn('Game failed to load:', err); if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [game]);

  useEffect(() => {
    if (!failed) return;
    tubeBus.pulse('static');
    const t = setTimeout(() => appStore.getState().exitGame(), SIGNAL_LOST_MS);
    return () => clearTimeout(t);
  }, [failed]);

  const ctx = useMemo<GameContext>(() => ({
    exit: () => { tubeBus.pulse('channel'); appStore.getState().exitGame(); },
    input: inputBus,
    tube: { pulse: (kind) => tubeBus.pulse(kind) },
    quality,
  }), [quality]);

  if (failed) return <SignalLost />;
  if (!Game) return null;
  return <GameBoundary onError={() => setFailed(true)}><Game ctx={ctx} /></GameBoundary>;
}
```

- [ ] **Step 5: Give the test-pattern game a real body**

`launchboard/src/games/test-pattern/TestPattern.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Text } from '@react-three/drei';
import { colors, fonts, tubeColors } from '../../brand';
import type { GameContext } from '../types';

const BARS = [colors.lightGrey, tubeColors.tieOrange, tubeColors.carbonGreen, tubeColors.kilnPink, colors.machineGrey, colors.slate, colors.biochar];
const BAR_W = 1920 / BARS.length;

export default function TestPattern({ ctx }: { ctx: GameContext }) {
  const [flashes, setFlashes] = useState(0);

  useEffect(() => ctx.input.subscribe((a) => {
    if (a === 'select') {
      ctx.tube.pulse('flash');
      setFlashes((n) => n + 1);
    }
  }), [ctx]);

  return (
    <group position={[0, 0, 500]}>
      {BARS.map((c, i) => (
        <mesh key={c} position={[-960 + BAR_W * (i + 0.5), 140, 0]}>
          <planeGeometry args={[BAR_W, 800]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, -400, 0]}>
        <planeGeometry args={[1920, 280]} />
        <meshBasicMaterial color={colors.graphite} toneMapped={false} />
      </mesh>
      <Text font={fonts.semibold} fontSize={72} color={colors.lightGrey} position={[0, -350, 10]} letterSpacing={0.1}>
        TEST PATTERN
      </Text>
      <Text font={fonts.medium} fontSize={34} color={colors.muted} position={[0, -440, 10]}>
        {`Enter: flash (${flashes})     ·     Esc: back to the board`}
      </Text>
    </group>
  );
}
```

- [ ] **Step 6: Wire `GameHost` into the temporary App**

In `launchboard/src/App.tsx`: import `GameHost`, change the registry line to
`const games = buildRegistry({ includeTestPattern: params.has('e2e'), includeBrokenGame: params.has('brokengame') });`
and render `<ScreenRouter games={games} gameHost={<GameHost games={games} />} />`.

- [ ] **Step 7: Verify and commit**

Run: `cd launchboard && npx tsc --noEmit && npx vitest run && npx playwright test`
Expected: no type errors; all unit tests PASS; `screens.spec.ts` and `gallery.spec.ts` PASS. (Launch/exit is covered end-to-end in Task 17 once keyboard input is wired.)

```bash
git add launchboard
git commit -m "Add game host with SIGNAL LOST fallback and test-pattern game

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: App wiring — input, idle, kiosk, quality auto-select, fallbacks

**Files:**
- Create: `launchboard/src/state/quality.ts`, `launchboard/src/state/useIdle.ts`
- Create: `launchboard/src/ui/useGlobalInput.ts`, `launchboard/src/ui/useKiosk.ts`
- Create: `launchboard/src/tube/PerfAutoSelect.tsx`, `launchboard/src/tube/CssFallback.tsx`
- Modify: `launchboard/src/App.tsx` (final version)
- Modify: `launchboard/e2e/screens.spec.ts` (re-enable the `ArrowLeft` lines)
- Test: `launchboard/tests/quality.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–14.
- Produces:
  - `resolveInitialQuality(defaultQuality: QualitySetting, stored: QualityPreset | null, hasWebGL2: boolean): { quality: QualityPreset; qualityOverride: QualityPreset | null; autoSelect: boolean }`
  - `parseStoredOverride(value: string | null): QualityPreset | null`
  - `loadStoredOverride(): QualityPreset | null`, `saveStoredOverride(q: QualityPreset | null): void` (localStorage, wrapped in try/catch)
  - `useIdle(cfg: { idleToAttractMs: number; gameIdleExitMs: number }): void`
  - `useGlobalInput(): void` — keyboard + gamepad + pointer → `markInput`, attract wake, game back, staff shortcuts, then `inputBus.emit`
  - `useKiosk(enabled: boolean): void` — fullscreen + wake lock on first interaction; hides cursor after 3 s without mouse movement
  - `<PerfAutoSelect />` — inside Canvas; after 3 s of non-boot frames calls `setQuality(pickPreset(...))` once
  - `<CssFallback games: GameDefinition[] />` — DOM board with CSS tube mask

- [ ] **Step 1: Write the failing quality test**

`launchboard/tests/quality.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resolveInitialQuality, parseStoredOverride } from '../src/state/quality';

describe('resolveInitialQuality', () => {
  it('auto-selects from pro when nothing is forced', () => {
    expect(resolveInitialQuality('auto', null, true)).toEqual({ quality: 'pro', qualityOverride: null, autoSelect: true });
  });
  it('honors a stored staff override', () => {
    expect(resolveInitialQuality('auto', 'standard', true)).toEqual({ quality: 'standard', qualityOverride: 'standard', autoSelect: false });
  });
  it('honors a fixed config default', () => {
    expect(resolveInitialQuality('standard', null, true)).toEqual({ quality: 'standard', qualityOverride: null, autoSelect: false });
  });
  it('forces safe without WebGL2', () => {
    expect(resolveInitialQuality('pro', 'pro', false)).toEqual({ quality: 'safe', qualityOverride: 'pro', autoSelect: false });
  });
});

describe('parseStoredOverride', () => {
  it('accepts only known presets', () => {
    expect(parseStoredOverride('pro')).toBe('pro');
    expect(parseStoredOverride('safe')).toBe('safe');
    expect(parseStoredOverride('ultra')).toBeNull();
    expect(parseStoredOverride(null)).toBeNull();
  });
});
```

Run: `cd launchboard && npx vitest run tests/quality.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 2: Implement `quality.ts`**

`launchboard/src/state/quality.ts`:
```ts
import type { QualitySetting } from '../config';
import { QUALITY_STORAGE_KEY, type QualityPreset } from './store';

const PRESETS: QualityPreset[] = ['pro', 'standard', 'safe'];

export function parseStoredOverride(value: string | null): QualityPreset | null {
  return PRESETS.includes(value as QualityPreset) ? (value as QualityPreset) : null;
}

export function resolveInitialQuality(defaultQuality: QualitySetting, stored: QualityPreset | null, hasWebGL2: boolean) {
  if (!hasWebGL2) return { quality: 'safe' as const, qualityOverride: stored, autoSelect: false };
  if (stored) return { quality: stored, qualityOverride: stored, autoSelect: false };
  if (defaultQuality !== 'auto') return { quality: defaultQuality, qualityOverride: null, autoSelect: false };
  return { quality: 'pro' as const, qualityOverride: null, autoSelect: true };
}

export function loadStoredOverride(): QualityPreset | null {
  try { return parseStoredOverride(localStorage.getItem(QUALITY_STORAGE_KEY)); } catch { return null; }
}

export function saveStoredOverride(q: QualityPreset | null): void {
  try {
    if (q) localStorage.setItem(QUALITY_STORAGE_KEY, q);
    else localStorage.removeItem(QUALITY_STORAGE_KEY);
  } catch { /* storage unavailable: override lasts for this session only */ }
}
```

Run: `cd launchboard && npx vitest run tests/quality.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 3: Write `useIdle.ts`**

`launchboard/src/state/useIdle.ts`:
```ts
import { useEffect } from 'react';
import { tubeBus } from '../tube/tubeBus';
import { nextScreenForIdle } from './idle';
import { appStore } from './store';

export function useIdle(cfg: { idleToAttractMs: number; gameIdleExitMs: number }) {
  useEffect(() => {
    const id = setInterval(() => {
      const s = appStore.getState();
      const next = nextScreenForIdle(s.screen, s.lastInputAt, performance.now(), cfg);
      if (next === 'attract') { tubeBus.pulse('channel'); s.toAttract(); }
      if (next === 'board') { tubeBus.pulse('channel'); s.exitGame(); }
    }, 250);
    return () => clearInterval(id);
  }, [cfg]);
}
```

- [ ] **Step 4: Write `useGlobalInput.ts`**

`launchboard/src/ui/useGlobalInput.ts`:
```ts
import { useEffect } from 'react';
import { saveStoredOverride } from '../state/quality';
import { appStore } from '../state/store';
import { tubeBus } from '../tube/tubeBus';
import { EMPTY_PAD, keyToAction, padEdges, readPad, type Action } from './input';
import { inputBus } from './inputBus';

/** Returns true when the input was consumed by a screen transition. */
function wakeOrRoute(action: Action | null): boolean {
  const s = appStore.getState();
  s.markInput(performance.now());
  if (s.screen === 'boot') return true;
  if (s.screen === 'attract') { tubeBus.pulse('channel'); s.toBoard(); return true; }
  if (s.screen === 'game' && action === 'back') { tubeBus.pulse('channel'); s.exitGame(); return true; }
  return false;
}

function dispatch(action: Action) {
  if (!wakeOrRoute(action)) inputBus.emit(action);
}

export function useGlobalInput() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyQ') {
        e.preventDefault();
        appStore.getState().cycleQualityOverride();
        saveStoredOverride(appStore.getState().qualityOverride);
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        appStore.getState().toggleDebug();
        return;
      }
      const action = keyToAction(e.key);
      if (action) { e.preventDefault(); dispatch(action); }
      else wakeOrRoute(null);
    };
    const onPointer = () => { wakeOrRoute(null); };

    let prev = EMPTY_PAD;
    let raf = 0;
    const pollPads = () => {
      const pad = navigator.getGamepads?.().find((p) => p) ?? null;
      if (pad) {
        const next = readPad(pad);
        for (const a of padEdges(prev, next)) dispatch(a);
        prev = next;
      }
      raf = requestAnimationFrame(pollPads);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    raf = requestAnimationFrame(pollPads);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
      cancelAnimationFrame(raf);
    };
  }, []);
}
```

- [ ] **Step 5: Write `useKiosk.ts`**

`launchboard/src/ui/useKiosk.ts`:
```ts
import { useEffect } from 'react';

const CURSOR_HIDE_MS = 3000;

export function useKiosk(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let wakeLock: { release(): Promise<void> } | null = null;
    let cursorTimer: ReturnType<typeof setTimeout> | undefined;

    const requestWakeLock = async () => {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } };
        wakeLock = (await nav.wakeLock?.request('screen')) ?? null;
      } catch { /* not supported or denied */ }
    };
    const onFirstInteraction = () => {
      document.documentElement.requestFullscreen?.().catch(() => {});
      void requestWakeLock();
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') void requestWakeLock(); };
    const onMouseMove = () => {
      document.body.classList.remove('cursor-hidden');
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(() => document.body.classList.add('cursor-hidden'), CURSOR_HIDE_MS);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('mousemove', onMouseMove);
    onMouseMove();
    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(cursorTimer);
      void wakeLock?.release().catch(() => {});
    };
  }, [enabled]);
}
```

- [ ] **Step 6: Write `PerfAutoSelect.tsx`**

`launchboard/src/tube/PerfAutoSelect.tsx`:
```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { appStore } from '../state/store';
import { pickPreset } from './presets';

const SAMPLE_SECONDS = 3;

export function PerfAutoSelect() {
  const samples = useRef<number[]>([]);
  const elapsed = useRef(0);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current) return;
    const s = appStore.getState();
    if (s.qualityOverride !== null || s.screen === 'boot') return;
    samples.current.push(dt * 1000);
    elapsed.current += dt;
    if (elapsed.current >= SAMPLE_SECONDS) {
      done.current = true;
      s.setQuality(pickPreset(samples.current, s.quality));
    }
  });
  return null;
}
```

- [ ] **Step 7: Write `CssFallback.tsx`**

`launchboard/src/tube/CssFallback.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { asset } from '../asset';
import { colors } from '../brand';
import { config, tickerItems } from '../config';
import type { GameDefinition } from '../games/types';
import { appStore, useApp } from '../state/store';
import { moveFocus } from '../ui/focus';
import { inputBus } from '../ui/inputBus';
import { accentColor } from '../ui/layout';

const css = `
@font-face { font-family: 'Barlow'; font-weight: 400; src: url('${asset('fonts/Barlow-Regular.ttf')}'); }
@font-face { font-family: 'Barlow'; font-weight: 500; src: url('${asset('fonts/Barlow-Medium.ttf')}'); }
@font-face { font-family: 'Barlow'; font-weight: 600; src: url('${asset('fonts/Barlow-SemiBold.ttf')}'); }
.fb { position: fixed; inset: 0; display: grid; place-items: center; background: #0b0b0c; z-index: 10; }
.fb-tube { position: relative; width: min(94vw, calc(94vh * 16 / 9)); aspect-ratio: 16 / 9; overflow: hidden;
  background: ${colors.studioGrey}; color: ${colors.ink}; font-family: 'Barlow', sans-serif;
  border-radius: 3.2% / 5.6%; box-shadow: 0 0 0 1.4vw #161618, 0 0 0 3vw #2b2b2e; }
.fb-inner { position: absolute; inset: 0; display: grid; grid-template-columns: 38% 62%; padding: 4.2% 4.2% 9%; box-sizing: border-box; }
.fb-h { font-weight: 600; font-size: 6.2vmin; line-height: 1.05; margin: 0; }
.fb-sub { color: ${colors.slate}; font-size: 2vmin; margin-top: 3vmin; }
.fb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6vmin; }
.fb-tile { background: ${colors.lightGrey}; border: 0; font: 500 1.8vmin 'Barlow', sans-serif; color: ${colors.ink};
  display: grid; align-content: end; justify-items: center; padding-bottom: 2vmin; gap: 1vmin; cursor: pointer;
  box-shadow: -0.5vmin 0.7vmin 0 rgba(0,0,0,.12); transition: transform .15s, box-shadow .15s; }
.fb-tile[data-soon="true"] { color: ${colors.muted}; }
.fb-tile[data-focus="true"] { transform: translateY(-0.6vmin); box-shadow: -1vmin 1.4vmin 0 rgba(0,0,0,.2); }
.fb-bar { width: 4.5vmin; height: 0.35vmin; }
.fb-ticker { position: absolute; left: 0; right: 0; bottom: 2.5%; border-top: 0.25vmin solid #EE6BD2; white-space: nowrap;
  overflow: hidden; color: ${colors.slate}; font: 500 1.6vmin 'Barlow', sans-serif; padding-top: 1vmin; }
.fb-ticker span { display: inline-block; padding-left: 100%; animation: fb-scroll 40s linear infinite; }
@keyframes fb-scroll { to { transform: translateX(-100%); } }
.fb-note { position: absolute; inset: 0; display: grid; place-items: center; background: ${colors.graphite}; color: ${colors.lightGrey};
  font: 600 5vmin 'Barlow', sans-serif; }
.fb-mask { position: absolute; inset: 0; pointer-events: none;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, rgba(255,0,0,.06) 0 1px, rgba(0,255,0,.06) 1px 2px, rgba(0,0,255,.06) 2px 3px);
  box-shadow: inset 0 0 12vmin rgba(0,0,0,.5); }
`;

export function CssFallback({ games }: { games: GameDefinition[] }) {
  const focusIndex = useApp((s) => s.focusIndex);
  const [note, setNote] = useState(false);

  const select = (i: number) => {
    appStore.getState().setFocus(i);
    if (games[i].status !== 'playable') return;
    setNote(true);
    setTimeout(() => setNote(false), 3000);
  };

  useEffect(() => inputBus.subscribe((a) => {
    const s = appStore.getState();
    if (a === 'select') select(s.focusIndex);
    else if (a !== 'back') s.setFocus(moveFocus(s.focusIndex, a, 3, games.length));
  }));

  return (
    <div className="fb" data-testid="css-fallback">
      <style>{css}</style>
      <div className="fb-tube">
        <div className="fb-inner">
          <div>
            <h1 className="fb-h">{config.headlineLines.map((l) => <div key={l}>{l}</div>)}</h1>
            <p className="fb-sub">{config.subcopy}</p>
          </div>
          <div className="fb-grid">
            {games.map((g, i) => (
              <button key={g.id} className="fb-tile" data-focus={focusIndex === i} data-soon={g.status === 'coming-soon'}
                onPointerEnter={() => appStore.getState().setFocus(i)} onClick={() => select(i)}>
                {g.title}
                <span className="fb-bar" style={{ background: focusIndex === i ? accentColor(g.accent) : 'transparent' }} />
              </button>
            ))}
          </div>
        </div>
        <div className="fb-ticker"><span>{tickerItems().join('     ·     ')}</span></div>
        {note && <div className="fb-note">This game needs the full tube</div>}
        <div className="fb-mask" />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Write the final `App.tsx`**

`launchboard/src/App.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { effectiveConfig, config } from './config';
import { Gallery } from './dev/Gallery';
import { installE2eHooks } from './e2eHooks';
import { buildRegistry } from './games/registry';
import { StudioRig } from './illustrations/StudioRig';
import { GameHost } from './screens/GameHost';
import { ScreenRouter } from './screens/ScreenRouter';
import { loadStoredOverride, resolveInitialQuality } from './state/quality';
import { appStore, useApp } from './state/store';
import { useIdle } from './state/useIdle';
import { Bezel } from './tube/Bezel';
import { CssFallback } from './tube/CssFallback';
import { computeLayout } from './tube/geometry';
import { PerfAutoSelect } from './tube/PerfAutoSelect';
import { TubeRenderer } from './tube/TubeRenderer';
import { useGlobalInput } from './ui/useGlobalInput';
import { useKiosk } from './ui/useKiosk';

const params = new URLSearchParams(window.location.search);
const cfg = effectiveConfig(window.location.search);
const isE2e = params.has('e2e');
const games = buildRegistry({ includeTestPattern: isE2e, includeBrokenGame: params.has('brokengame') });

const hasWebGL2 = (() => {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
})();
const initial = resolveInitialQuality(config.defaultQuality, loadStoredOverride(), hasWebGL2);
appStore.setState({ quality: initial.quality, qualityOverride: initial.qualityOverride, debug: params.has('debug') });
installE2eHooks();

function Monitor({ children }: { children: ReactNode }) {
  const size = useThree((s) => s.size);
  const layout = computeLayout(size.width, size.height);
  return <TubeRenderer bezel={<Bezel layout={layout} viewW={size.width} viewH={size.height} />}>{children}</TubeRenderer>;
}

export default function App() {
  useGlobalInput();
  useIdle(cfg);
  useKiosk(!isE2e);
  const quality = useApp((s) => s.quality);
  const contextLost = useApp((s) => s.contextLost);
  const fallback = !hasWebGL2 || quality === 'safe';

  return (
    <>
      {!fallback && (
        <Canvas orthographic flat dpr={[1, 2]} camera={{ position: [0, 0, 1000], zoom: 1, near: 0.1, far: 5000 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); appStore.getState().setContextLost(true); });
            canvas.addEventListener('webglcontextrestored', () => appStore.getState().setContextLost(false));
          }}>
          <Monitor>
            <StudioRig />
            {/* Unmount screens while the context is lost so only the CSS fallback handles input */}
            {!contextLost && (params.has('gallery') ? <Gallery /> : <ScreenRouter games={games} gameHost={<GameHost games={games} />} />)}
          </Monitor>
          {initial.autoSelect && <PerfAutoSelect />}
        </Canvas>
      )}
      {(fallback || contextLost) && <CssFallback games={games} />}
    </>
  );
}
```

- [ ] **Step 9: Re-enable keyboard assertions and run everything**

In `launchboard/e2e/screens.spec.ts`, uncomment the two `ArrowLeft` lines (remove the `// enabled in Task 15` marker).

Run: `cd launchboard && npx tsc --noEmit && npx vitest run && npx playwright test`
Expected: no type errors; all unit tests PASS; all e2e specs PASS.

Manual check (1 minute): `cd launchboard && npm run dev`, open `http://localhost:5173/?idle=5000`:
- boot warm-up line opens into attract; click → channel change → board
- arrows move the focus underline; Enter on a placeholder shakes it
- wait 5 s → back to attract
- Ctrl+Shift+Q three times → CSS fallback board appears; once more → full tube returns

- [ ] **Step 10: Commit**

```bash
git add launchboard
git commit -m "Wire global input, idle, kiosk mode, quality auto-select and CSS fallback

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Debug panel (`?debug` / Ctrl+Shift+D)

**Files:**
- Create: `launchboard/src/debug/DebugPanel.tsx`
- Modify: `launchboard/src/e2eHooks.ts` (expose `tubeOverrides`)
- Modify: `launchboard/src/App.tsx` (render the panel)
- Create: `launchboard/e2e/hooks.ts`; Modify: `launchboard/e2e/screens.spec.ts` (use shared hook types)
- Create: `launchboard/e2e/debug.spec.ts`

**Interfaces:**
- Consumes: `PARAM_RANGES`, `paramsFor`, `TubeParams` (Task 7); `tubeBus` (Task 7); `useApp`, `appStore` (Task 3); `saveStoredOverride` (Task 15).
- Produces:
  - `<DebugPanel />` — DOM overlay (`data-testid="debug-panel"`) with one `input[type=range]` per `TubeParams` key (`data-param="<key>"`), a live FPS/preset readout, pulse buttons, preset cycle and reset
  - `window.__launchboard.tubeOverrides(): Partial<TubeParams>` (e2e only)
  - `e2e/hooks.ts`: `type Hooks` and the global `Window.__launchboard` declaration shared by all specs

- [ ] **Step 1: Share e2e hook types**

`launchboard/e2e/hooks.ts`:
```ts
export type Hooks = {
  getState(): { screen: string; focusIndex: number; activeGameId: string | null; quality: string; toBoard(): void; setFocus(i: number): void };
  contentToScreen(x: number, y: number): { px: number; py: number };
  tubeOverrides(): Record<string, number>;
};

declare global {
  interface Window { __launchboard?: Hooks }
}
```
In `launchboard/e2e/screens.spec.ts`, delete the local `type Hooks = …` and `declare global …` lines and add `import './hooks';` below the Playwright import.

- [ ] **Step 2: Write the failing e2e test**

`launchboard/e2e/debug.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import './hooks';

test('debug panel exposes every tube parameter and writes overrides', async ({ page }) => {
  await page.goto('/?e2e&debug');
  const panel = page.getByTestId('debug-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('input[type=range]')).toHaveCount(17);

  await panel.locator('input[data-param="curvature"]').fill('0.1');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.tubeOverrides().curvature)).toBe(0.1);

  await panel.getByRole('button', { name: 'Reset' }).click();
  await expect.poll(() => page.evaluate(() => Object.keys(window.__launchboard!.tubeOverrides()).length)).toBe(0);

  await page.keyboard.press('Control+Shift+D');
  await expect(panel).toBeHidden();
});
```

Run: `cd launchboard && npx playwright test e2e/debug.spec.ts`
Expected: FAIL — `debug-panel` not found.

- [ ] **Step 3: Expose overrides in e2e hooks**

In `launchboard/src/e2eHooks.ts`, add inside the `__launchboard` object (before `...extra`):
```ts
    tubeOverrides: () => ({ ...tubeBus.overrides }),
```

- [ ] **Step 4: Write `DebugPanel.tsx`**

`launchboard/src/debug/DebugPanel.tsx`:
```tsx
import { useEffect, useState, type CSSProperties } from 'react';
import type { PulseKind } from '../games/types';
import { saveStoredOverride } from '../state/quality';
import { appStore, useApp } from '../state/store';
import { PARAM_RANGES, paramsFor, type TubeParams } from '../tube/presets';
import { tubeBus } from '../tube/tubeBus';

const PULSES: PulseKind[] = ['boot', 'channel', 'static', 'flash', 'roll'];
const KEYS = Object.keys(PARAM_RANGES) as (keyof TubeParams)[];

const panel: CSSProperties = {
  position: 'fixed', top: 12, right: 12, width: 300, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto',
  background: 'rgba(20,20,22,.92)', color: '#D9D9D9', font: '12px/1.4 Barlow, system-ui, sans-serif',
  padding: 12, borderRadius: 8, zIndex: 20,
};

export function DebugPanel() {
  const quality = useApp((s) => s.quality);
  const override = useApp((s) => s.qualityOverride);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const values = paramsFor(quality, tubeBus.overrides);

  return (
    <div style={panel} data-testid="debug-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Tube</strong>
        <span>{tubeBus.fps.toFixed(0)} fps · {quality}{override ? ' (forced)' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {PULSES.map((p) => <button key={p} onClick={() => tubeBus.pulse(p)}>{p}</button>)}
        <button onClick={() => { appStore.getState().cycleQualityOverride(); saveStoredOverride(appStore.getState().qualityOverride); }}>Preset</button>
        <button onClick={() => { tubeBus.overrides = {}; tick((n) => n + 1); }}>Reset</button>
      </div>
      {KEYS.map((key) => {
        const r = PARAM_RANGES[key];
        return (
          <label key={key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 44px', alignItems: 'center', gap: 6 }}>
            <span>{key}</span>
            <input type="range" data-param={key} min={r.min} max={r.max} step={r.step} value={values[key]}
              onChange={(e) => { tubeBus.overrides = { ...tubeBus.overrides, [key]: Number(e.target.value) }; tick((n) => n + 1); }} />
            <span style={{ textAlign: 'right' }}>{values[key]}</span>
          </label>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Render it from `App.tsx`**

In `launchboard/src/App.tsx`: `import { DebugPanel } from './debug/DebugPanel';`, add `const debug = useApp((s) => s.debug);` in `App`, and render `{debug && <DebugPanel />}` after the fallback line.

- [ ] **Step 6: Run the tests**

Run: `cd launchboard && npx tsc --noEmit && npx playwright test`
Expected: all e2e specs PASS (including `debug.spec.ts`).

- [ ] **Step 7: Commit**

```bash
git add launchboard
git commit -m "Add tube debug panel with live parameter sliders

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: End-to-end smoke test, offline cache, GitHub Pages deploy, README

**Files:**
- Create: `launchboard/e2e/smoke.spec.ts`
- Create: `launchboard/public/sw.js`
- Modify: `launchboard/src/main.tsx` (register the service worker in production)
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Modify: `docs/superpowers/specs/2026-09-13-arema-launchboard-design.md` (record the approved deviations)

**Interfaces:**
- Consumes: the whole app.
- Produces: a green `npx playwright test` covering every spec §7 flow; a production build deployable to `https://stbasilofmoro.github.io/ITDconference/` with the brand guide at `/ITDconference/brand/`.

- [ ] **Step 1: Write the smoke test**

`launchboard/e2e/smoke.spec.ts`:
```ts
import { test, expect, type Page } from '@playwright/test';
import './hooks';

const state = (page: Page) => page.evaluate(() => window.__launchboard!.getState());

async function boardReady(page: Page, query: string) {
  await page.goto(`/?e2e${query}`);
  await page.waitForFunction(() => !!window.__launchboard);
  await expect.poll(async () => (await state(page)).screen, { timeout: 10_000 }).toBe('attract');
  // Click the letterbox corner, away from any tile, so the wake click cannot also hover a tile
  await page.mouse.click(8, 8);
  await expect.poll(async () => (await state(page)).screen).toBe('board');
}

test('attract → board → launch test pattern → exit → placeholder → idle back to attract', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await boardReady(page, '&idle=4000');
  expect((await state(page)).focusIndex).toBe(0);

  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).screen, { timeout: 3000 }).toBe('game');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'test-results/game-test-pattern.png' });
  await page.keyboard.press('Enter');
  expect((await state(page)).screen).toBe('game');

  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state(page)).screen).toBe('board');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  expect((await state(page))).toMatchObject({ screen: 'board', focusIndex: 1 });

  await expect.poll(async () => (await state(page)).screen, { timeout: 8000 }).toBe('attract');
  expect(errors).toEqual([]);
});

test('a game that fails to load shows SIGNAL LOST and returns to the board', async ({ page }) => {
  await boardReady(page, '&brokengame');
  await page.evaluate(() => window.__launchboard!.getState().setFocus(1));
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).screen, { timeout: 3000 }).toBe('game');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/signal-lost.png' });
  await expect.poll(async () => (await state(page)).screen, { timeout: 6000 }).toBe('board');
});

test('a game with no input returns to the board', async ({ page }) => {
  await boardReady(page, '&gameidle=2000');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).screen, { timeout: 3000 }).toBe('game');
  await expect.poll(async () => (await state(page)).screen, { timeout: 6000 }).toBe('board');
});

test('staff shortcut cycles into the CSS fallback and back', async ({ page }) => {
  await boardReady(page, '');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Control+Shift+Q');
  await expect(page.getByTestId('css-fallback')).toBeVisible();
  await page.screenshot({ path: 'test-results/css-fallback.png' });
  await page.keyboard.press('Control+Shift+Q');
  await expect(page.getByTestId('css-fallback')).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible();
});
```

- [ ] **Step 2: Run the smoke test**

Run: `cd launchboard && npx playwright test e2e/smoke.spec.ts`
Expected: PASS (4 tests). Review `game-test-pattern.png`, `signal-lost.png`, `css-fallback.png`.

If the first test's final idle assertion fails because `Enter` on the placeholder counts as input, that is expected behaviour — the 8 s timeout already covers the 4 s idle window measured from that key press; only widen the timeout, do not change idle logic.

- [ ] **Step 3: Add the service worker**

`launchboard/public/sw.js`:
```js
const CACHE = 'arema-launchboard-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Network first so a redeploy is picked up; fall back to the cached shell offline
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Hashed build assets and fonts: cache first
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
```

In `launchboard/src/main.tsx`, append:
```tsx
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
```

Run: `cd launchboard && npm run build && npx vite preview --base /ITDconference/ --port 4173`
Open `http://localhost:4173/ITDconference/`, confirm the app boots, then in DevTools → Application → Service Workers confirm `sw.js` is activated; tick "Offline", reload, confirm the app still loads. Stop the preview server.

- [ ] **Step 4: Add the deploy workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy launchboard

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: launchboard
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: launchboard/package-lock.json
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Add brand guide
        run: |
          mkdir -p dist/brand
          cp -r ../brand/assets dist/brand/
          { echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'; cat ../brand/index.html; echo '</body></html>'; } > dist/brand/index.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: launchboard/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Write the README**

`README.md`:
````markdown
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
````

- [ ] **Step 6: Record the deviations in the spec**

In `docs/superpowers/specs/2026-09-13-arema-launchboard-design.md`:
- §5.1: change `React 18` to `React 19 (required by @react-three/fiber 9)`.
- §5.4: change `Illustration: React.ComponentType;` to `illustration: IllustrationId; // mapped to a component in illustrations/index.ts`.
- §5.2 step 2: move "Phosphor persistence" to run before curvature, with the note "(runs in content space so the mask is not smeared)".

- [ ] **Step 7: Full verification**

Run:
```bash
cd launchboard && npx tsc --noEmit && npx vitest run && npx playwright test && npm run build && node ../brand/check.mjs
```
Expected: no type errors; all unit tests PASS; all e2e specs PASS; build succeeds; `brand guide OK`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add smoke tests, offline cache, Pages deploy workflow and README

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9: Ask before publishing**

Do not push. Tell the user the work is committed locally and ask whether to push `main` to `github.com/stbasilofmoro/ITDconference`. If they say yes: `git push -u origin main`, then tell them to enable Pages under **Settings → Pages → Source: GitHub Actions** and share the Actions run URL.

