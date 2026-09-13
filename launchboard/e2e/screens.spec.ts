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
