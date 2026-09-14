import { test, expect, type Page } from '@playwright/test';
import './hooks';
import type { Run } from '../src/games/carbon-sort/engine';

declare global {
  interface Window {
    __carbonSort?: { getState(): Run; action(action: string): void; setState(patch: Partial<Run>): void };
    __sortPad?: { buttons: { pressed: boolean }[]; axes: number[] };
  }
}
async function launch(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('arema.qualityOverride', 'standard');
    window.__sortPad = { buttons: Array.from({ length: 16 }, () => ({ pressed: false })), axes: [0, 0] };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__sortPad] });
  });
  await page.goto('/?e2e');
  await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().focusIndex)).toBe(1);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.__carbonSort);
}
const state = (page: Page) => page.evaluate(() => window.__carbonSort!.getState());
async function tap(page: Page, x: number, y: number) {
  const point = await page.evaluate(([px, py]) => window.__launchboard!.contentToScreen(px, py), [x, y]);
  await page.mouse.click(point.px, point.py);
}

test('second tile, touch match, gamepad rotate, keyboard move, pause and exit', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await launch(page);
  expect((await state(page)).phase).toBe('intro');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
  await tap(page, 744, -155);
  await expect.poll(async () => (await state(page)).targetsCleared).toBe(3);
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
  expect((await state(page)).score).toBe(340);
  const direction = (await state(page)).active!.direction;
  await page.evaluate(() => { window.__sortPad!.buttons[0].pressed = true; });
  await expect.poll(async () => (await state(page)).active!.direction).toBe((direction + 1) % 4);
  await page.evaluate(() => { window.__sortPad!.buttons[0].pressed = false; });
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await state(page)).active!.x).toBe(2);
  await tap(page, 797, -52);
  await expect.poll(async () => (await state(page)).active!.x).toBe(3);
  await tap(page, 517, -406);
  await expect.poll(async () => (await state(page)).paused).toBe(true);
  const paused = (await state(page)).active;
  await page.waitForTimeout(1000);
  expect((await state(page)).active).toEqual(paused);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).paused).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
  expect(errors).toEqual([]);
});

test('matching the last stock advances rounds and completing round three wins', async ({ page }) => {
  await launch(page);
  for (let round = 0; round < 3; round++) {
    await page.evaluate((r) => {
      const board = Array.from({ length: 14 }, () => Array(8).fill(null));
      for (let x = 0; x < 3; x++) board[13][x] = { id: 100 + x, material: 'ties', target: true, bond: null };
      window.__carbonSort!.setState({ round: r, board, phase: 'playing', paused: false, marked: [], timer: 0, fallTimer: 0, lockTimer: 0, active: { x: 3, y: 0, direction: 0, materials: ['ties', 'metal'] } });
    }, round);
    await page.keyboard.press('x');
    await expect.poll(async () => (await state(page)).phase).toBe(round === 2 ? 'won' : 'round-won');
    if (round < 2) {
      await page.keyboard.press('Enter');
      await expect.poll(async () => (await state(page)).phase).toBe('intro');
      expect((await state(page)).round).toBe(round + 1);
    }
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  expect((await state(page))).toMatchObject({ round: 0, score: 0, recovered: 0 });
});

test('blocked entrance ends the run and replay creates a clean board', async ({ page }) => {
  await launch(page);
  await page.evaluate(() => {
    const board = Array.from({ length: 14 }, () => Array(8).fill(null));
    board[0][3] = { id: 300, material: 'metal', target: true, bond: null };
    window.__carbonSort!.setState({ board, phase: 'playing', active: { x: 0, y: 12, direction: 0, materials: ['ties', 'carbon'] } });
  });
  await tap(page, 744, -155);
  await expect.poll(async () => (await state(page)).phase).toBe('lost');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('intro');
  expect((await state(page)).board[0].every((cell) => cell === null)).toBe(true);
});
