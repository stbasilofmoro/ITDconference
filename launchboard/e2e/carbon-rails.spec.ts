import { test, expect, type Page } from '@playwright/test';
import './hooks';
import type { Run } from '../src/games/carbon-rails/engine';
declare global { interface Window { __carbonRails?: { getState(): Run; setState(patch: Partial<Run>): void; action(action: string, id?: number): void } } }
export async function launchRails(page: Page) {
  await page.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await page.goto('/?e2e'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board');
  await page.keyboard.press('ArrowDown'); await page.waitForFunction(() => window.__launchboard?.getState().focusIndex === 3);
  await page.keyboard.press('Enter'); await page.waitForFunction(() => !!window.__carbonRails);
}
async function tap(page: Page, x: number, y: number) { const p = await page.evaluate(([a, b]) => window.__launchboard!.contentToScreen(a, b), [x, y]); await page.mouse.click(p.px, p.py); }
const state = (page: Page) => page.evaluate(() => window.__carbonRails!.getState());
test('fourth tile, initial tickets, card rules, route claim, computer turn and pause', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await launchRails(page); await page.keyboard.press('Enter'); await expect.poll(async () => (await state(page)).phase).toBe('tickets');
  await tap(page, 0, 127); await tap(page, 0, 7); await tap(page, 0, -319);
  expect((await state(page)).phase).toBe('tickets');
  await tap(page, 0, 7); await page.keyboard.press('Enter'); await expect.poll(async () => (await state(page)).phase).toBe('playing');
  expect((await state(page)).players[0].tickets).toHaveLength(2);
  await page.evaluate(() => { const r = window.__carbonRails!.getState(); r.players[0].hand = ['orange', 'orange']; window.__carbonRails!.setState({ players: r.players }); });
  await page.keyboard.press('Enter'); await expect.poll(async () => (await state(page)).owners[0]).toBe(0);
  await expect.poll(async () => (await state(page)).turn).toBe(0);
  expect((await state(page)).players[0].trains).toBe(43);
  await page.evaluate(() => window.__carbonRails!.setState({ market: ['red', 'wild', 'blue', 'orange', 'green'] }));
  await page.keyboard.press('1'); await expect.poll(async () => (await state(page)).drawn).toBe(1);
  await page.keyboard.press('1'); expect((await state(page)).drawn).toBe(1);
  await page.keyboard.press('d'); await expect.poll(async () => (await state(page)).turns).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('p'); const turns = (await state(page)).turns; await page.waitForTimeout(1400); expect((await state(page)).turns).toBe(turns);
  await page.keyboard.press('Enter'); await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board'); expect(errors).toEqual([]);
});
test('globe navigation, final result and a fresh match', async ({ page }) => {
  await launchRails(page); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
  await tap(page, -225, -354); await page.keyboard.press('ArrowDown');
  const from = await page.evaluate(() => window.__launchboard!.contentToScreen(-400, 100));
  await page.mouse.move(from.px, from.py); await page.mouse.down(); await page.mouse.move(from.px + 80, from.py + 40, { steps: 6 }); await page.mouse.up();
  await page.evaluate(() => { const r = window.__carbonRails!.getState(); r.owners[0] = 0; r.owners[1] = 0; window.__carbonRails!.setState({ owners: r.owners, phase: 'won' }); });
  await page.waitForTimeout(300); await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('tickets'); expect((await state(page)).owners.every((v) => v === null)).toBe(true);
  expect((await state(page)).players[0].trains).toBe(45);
});
