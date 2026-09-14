import { test, expect, type Page } from '@playwright/test';
import './hooks';

const state = (page: Page) => page.evaluate(() => window.__launchboard!.getState());

// This suite's headless Chromium runs WebGL through --use-angle=swiftshader (software
// rasterization; see playwright.config.ts), which under sustained load (several heavy
// tube-shader scenes mounted back to back in one worker) genuinely stalls the main thread —
// Chromium logs "GPU stall due to ReadPixels" on every page here. That stall is what pushed
// Board's inputBus subscription past its old 750ms pending-action buffer window, silently
// dropping the launch keypress (fixed in src/ui/inputBus.ts by widening PENDING_TTL_MS to
// 3000ms). These poll budgets stay generous on top of that fix to absorb the remaining,
// genuinely slow (not broken) render-thread contention — confirmed by instrumenting
// inputBus/Board/GameHost — not to paper over a race.
const GAME_ENTER_MS = 6000;

async function boardReady(page: Page, query: string) {
  await page.goto(`/?e2e${query}`);
  await page.waitForFunction(() => !!window.__launchboard);
  await expect.poll(async () => (await state(page)).screen, { timeout: 10_000 }).toBe('attract');
  // Click the letterbox corner, away from any tile, so the wake click cannot also hover a tile
  await page.mouse.click(8, 8);
  await expect.poll(async () => (await state(page)).screen).toBe('board');
}

test('attract → board → launch test pattern → exit → final tile → idle back to attract', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await boardReady(page, '&idle=4000');
  expect((await state(page)).focusIndex).toBe(0);

  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).screen, { timeout: GAME_ENTER_MS }).toBe('game');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'test-results/game-test-pattern.png' });
  await page.keyboard.press('Enter');
  expect((await state(page)).screen).toBe('game');

  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state(page)).screen).toBe('board');

  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await state(page)).focusIndex).toBe(1);
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await state(page)).focusIndex).toBe(2);
  await page.keyboard.press('ArrowDown');
  await expect.poll(async () => (await state(page)).focusIndex).toBe(5);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).screen, { timeout: GAME_ENTER_MS }).toBe('game');
  await page.getByRole('button', { name: 'Start chapter' }).waitFor();
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await state(page)).screen).toBe('board');

  await expect.poll(async () => (await state(page)).screen, { timeout: 8000 }).toBe('attract');
  expect(errors).toEqual([]);
});

test('a game that fails to load shows SIGNAL LOST and returns to the board', async ({ page }) => {
  await boardReady(page, '&brokengame');
  await page.evaluate(() => window.__launchboard!.getState().setFocus(1));
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).screen, { timeout: GAME_ENTER_MS }).toBe('game');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/signal-lost.png' });
  await expect.poll(async () => (await state(page)).screen, { timeout: 9000 }).toBe('board');
});

test('a game with no input returns to the board', async ({ page }) => {
  // A larger gameidle than the other specs use: `lastInputAt` is stamped at the original
  // keypress (before Board even subscribes), not when the game screen actually appears, so
  // under this environment's render-thread contention (see GAME_ENTER_MS above) a very short
  // idle window can already have elapsed by the time 'game' is entered, and the poll below
  // could race the almost-immediate idle-exit back to 'board' without ever observing 'game'.
  // 6s comfortably clears GAME_ENTER_MS's worst observed entry delay while still keeping the
  // idle-exit itself well inside the second poll's budget.
  await boardReady(page, '&gameidle=6000');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).screen, { timeout: GAME_ENTER_MS }).toBe('game');
  await expect.poll(async () => (await state(page)).screen, { timeout: 12000 }).toBe('board');
});

test('staff shortcut cycles into the CSS fallback and back', async ({ page }) => {
  await boardReady(page, '');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Control+Shift+Q');
  await expect(page.getByTestId('css-fallback')).toBeVisible();
  await page.screenshot({ path: 'test-results/css-fallback.png' });
  await page.keyboard.press('Control+Shift+Q');
  await expect(page.getByTestId('css-fallback')).toBeHidden({ timeout: 8000 });
  await expect(page.locator('canvas')).toBeVisible();
});
