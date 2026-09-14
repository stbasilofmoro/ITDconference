import { test, expect, type Page } from '@playwright/test';
import './hooks';
import { SAFE_MIN, SAFE_MAX, RUN_SECONDS, type Run } from '../src/games/kiln-keeper/engine';

declare global {
  interface Window {
    __kilnKeeper?: { getState(): Run; setState(patch: Partial<Run>): void };
  }
}
async function launch(page: Page) {
  await page.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await page.goto('/?e2e');
  await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
  for (const index of [1, 2]) {
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().focusIndex)).toBe(index);
  }
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.__kilnKeeper);
}
const state = (page: Page) => page.evaluate(() => window.__kilnKeeper!.getState());
const point = (page: Page, x: number, y: number) => page.evaluate(([px, py]) => window.__launchboard!.contentToScreen(px, py), [x, y]);
async function tap(page: Page, x: number, y: number) {
  const p = await point(page, x, y); await page.mouse.click(p.px, p.py);
}

test('third tile supports dragging, wood drops, keyboard, pause and exit', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await launch(page);
  expect((await state(page)).phase).toBe('intro');
  await tap(page, -150, -259);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  const from = await point(page, -40, -464), to = await point(page, 560, -464);
  await page.mouse.move(from.px, from.py); await page.mouse.down();
  await page.mouse.move(to.px, to.py, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => Math.round((await state(page)).feed * 100)).toBe(80);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => Math.round((await state(page)).feed * 100)).toBe(75);
  const before = (await state(page)).nextId;
  await tap(page, -695, -231);
  await expect.poll(async () => (await state(page)).nextId).toBeGreaterThan(before);
  await page.keyboard.press('x');
  expect((await state(page)).feed).toBe(0);
  expect((await state(page)).motor).toBeGreaterThan(0);
  await page.keyboard.press('p');
  await expect.poll(async () => (await state(page)).paused).toBe(true);
  const paused = await state(page);
  await page.waitForTimeout(600);
  const still = await state(page);
  expect(still.elapsed).toBe(paused.elapsed);
  expect(still.fuel).toBe(paused.fuel);
  expect(still.pieces).toEqual(paused.pieces);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).paused).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
  expect(errors).toEqual([]);
});

test('overheat explodes, underfeeding loses the batch, and both can restart', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await launch(page);
  await page.keyboard.press('Enter');
  await page.evaluate((max) => window.__kilnKeeper!.setState({ temperature: max + 100, hotTime: 4.95, fuel: 4 }), SAFE_MAX);
  await expect.poll(async () => (await state(page)).phase).toBe('exploded');
  await expect.poll(async () => (await state(page)).animationTime).toBeGreaterThan(2.2);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  expect((await state(page)).hotTime).toBe(0);
  expect((await state(page)).elapsed).toBeLessThan(2);
  await page.evaluate((min) => window.__kilnKeeper!.setState({ temperature: min - 20, coldTime: 4.95, fuel: 0, pieces: [], feed: 0, motor: 0 }), SAFE_MIN);
  await expect.poll(async () => (await state(page)).phase).toBe('cold');
  await expect.poll(async () => (await state(page)).animationTime).toBeGreaterThan(0.6);
  await tap(page, -150, -259);
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  expect(await state(page)).toMatchObject({ coldTime: 0, hotTime: 0, feed: 0.5 });
  expect(errors).toEqual([]);
});

test('surviving the shift completes the batch and replay resets progress', async ({ page }) => {
  await launch(page);
  await page.keyboard.press('Enter');
  await page.evaluate(({ duration, midpoint }) => window.__kilnKeeper!.setState({ elapsed: duration - 0.05, temperature: midpoint, fuel: 0.9, inBand: duration - 1 }), { duration: RUN_SECONDS, midpoint: (SAFE_MIN + SAFE_MAX) / 2 });
  await expect.poll(async () => (await state(page)).phase).toBe('won');
  expect((await state(page)).elapsed).toBe(RUN_SECONDS);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('running');
  const replay = await state(page);
  expect(replay.elapsed).toBeLessThan(2);
  expect(replay.inBand).toBeLessThan(2);
  expect(replay.condition).toBe(0);
});
