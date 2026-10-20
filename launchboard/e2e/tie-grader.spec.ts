import { test, expect, type Page } from '@playwright/test';
import './hooks';
import type { Run, StationId } from '../src/games/tie-grader/engine';

declare global { interface Window { __tieGrader?: { getState(): Run; setState(patch: Partial<Run>): void; action(action: string, id?: StationId): void } } }
export async function launchTieGrader(page: Page) {
  await page.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await page.goto('/?e2e'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board');
  await page.keyboard.press('ArrowDown'); await page.waitForFunction(() => window.__launchboard?.getState().focusIndex === 3);
  await page.keyboard.press('Enter'); await expect(page.getByRole('button', { name: 'Start shift', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start shift', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__tieGrader?.getState().phase)).toBe('playing');
}
const state = (page: Page) => page.evaluate(() => window.__tieGrader!.getState());

test('beaver picks up, grades into piles, reloads and dispatches all three tie conditions', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await launchTieGrader(page);
  await page.evaluate(() => window.__tieGrader!.setState({ incoming: [
    { id: 101, grade: 'grade1', condition: 'Straight, solid wood. Intact ends, no rot.' },
    { id: 102, grade: 'grade2', condition: 'Weathered surface. Shallow cracks, solid core.' },
    { id: 103, grade: 'junk', condition: 'Rotten core and a broken end.' },
  ] }));
  for (const [grade, pile, dest] of [['grade1', 'Grade 1 pile', 'Grade 1 truck'], ['grade2', 'Grade 2 pile', 'Grade 2 truck'], ['junk', 'Junk pile', 'Shredder']] as const) {
    await page.getByRole('button', { name: 'Incoming ties', exact: true }).click();
    await expect.poll(async () => (await state(page)).held?.tie.grade, { timeout: 12000 }).toBe(grade);
    await expect(page.getByLabel('Tie inspection')).toContainText('IN YOUR PAWS');
    await page.getByRole('button', { name: pile, exact: true }).click();
    await expect.poll(async () => (await state(page)).piles[grade].length, { timeout: 12000 }).toBe(1);
    expect((await state(page)).held).toBeNull();
    await page.getByRole('button', { name: pile, exact: true }).click();
    await expect.poll(async () => (await state(page)).held?.graded, { timeout: 8000 }).toBe(grade);
    await page.getByRole('button', { name: dest, exact: true }).click();
    await expect.poll(async () => (await state(page)).delivered[grade], { timeout: 12000 }).toBe(1);
  }
  expect((await state(page)).handled).toBe(3); expect((await state(page)).score).toBe(300);
  await page.screenshot({ path: 'test-results/tie-grader-yard.png' });
  await page.getByRole('button', { name: 'Pause shift' }).click(); const elapsed = (await state(page)).elapsed;
  await page.waitForTimeout(400); expect((await state(page)).elapsed).toBe(elapsed);
  await page.getByRole('button', { name: 'Resume shift' }).click();
  await page.getByRole('button', { name: 'Pause shift' }).click();
  await page.getByRole('button', { name: 'Exit to games' }).click();
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
  await expect(page.locator('[data-tie-hud]')).toHaveCount(0); expect(errors).toEqual([]);
});

test('rejects incorrect grading and ungraded dispatch, supports walking, timeout, scores and replay', async ({ page }) => {
  await launchTieGrader(page);
  await page.locator('canvas').click({ position: { x: 10, y: 10 } });
  const from = (await state(page)).player.x;
  await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
  expect((await state(page)).player.x).toBeGreaterThan(from);
  await page.evaluate(() => window.__tieGrader!.setState({ held: { tie: { id: 100, grade: 'junk', condition: 'Deep split and a rotten core.' }, graded: null }, player: { x: -2, z: -2.5, facing: 0 }, target: null }));
  await page.keyboard.press('e'); await expect.poll(async () => (await state(page)).mistakes).toBe(1);
  expect((await state(page)).held?.tie.id).toBe(100); expect((await state(page)).piles.grade1).toHaveLength(0);
  await page.evaluate(() => { for (let i = 0; i < 4; i++) document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', repeat: true, bubbles: true })); });
  expect((await state(page)).mistakes).toBe(1);
  await page.getByRole('button', { name: 'Shredder', exact: true }).click();
  await expect.poll(async () => (await state(page)).target, { timeout: 12000 }).toBeNull();
  expect((await state(page)).mistakes).toBe(1);
  expect((await state(page)).message).toContain('Grade this tie into a pile first');
  expect((await state(page)).delivered.junk).toBe(0);
  await page.evaluate(() => window.__tieGrader!.setState({ elapsed: 179.99 }));
  await expect(page.getByRole('heading', { name: 'Shift complete.' })).toBeVisible();
  await page.getByRole('button', { name: 'Save score / Leaderboard' }).click();
  await expect(page.getByRole('dialog', { name: 'High scores.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close leaderboard' }).click();
  await page.getByRole('button', { name: 'New shift' }).click();
  expect((await state(page)).handled).toBe(0); expect((await state(page)).mistakes).toBe(0); expect((await state(page)).held).toBeNull();
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
});
