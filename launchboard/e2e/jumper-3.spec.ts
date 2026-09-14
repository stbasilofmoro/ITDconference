import { test, expect, type Page } from '@playwright/test';
import './hooks';
import type { Run } from '../src/games/jumper-3/engine';

declare global { interface Window { __jumper3?: { getState(): Run; setState(patch: Partial<Run>): void } } }
const state = (page: Page) => page.evaluate(() => window.__jumper3!.getState());
async function launch(page: Page) {
  await page.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await page.goto('/?e2e'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board');
  await page.evaluate(() => window.__launchboard!.getState().setFocus(5)); await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.__jumper3); await page.getByRole('button', { name: 'Start chapter' }).click();
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
}

test('sixth tile launches Atom with keyboard movement, jumps, power-ups, pause and exit', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); await launch(page);
  await page.screenshot({ path: 'test-results/jumper-yard.png' });
  await page.keyboard.down('ArrowRight'); await expect.poll(async () => (await state(page)).x).toBeGreaterThan(3); await page.keyboard.up('ArrowRight');
  await page.keyboard.down('Space'); await expect.poll(async () => (await state(page)).y).toBeGreaterThan(1); await page.keyboard.up('Space');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  await page.evaluate(() => window.__jumper3!.setState({ x: 6.5, vx: 0, y: 0, vy: 0, grounded: true, wasJump: false }));
  await page.keyboard.down('Space'); await expect.poll(async () => (await state(page)).solids.some((s) => s.contents === 'helmet' && s.used)).toBe(true); await page.keyboard.up('Space');
  await page.evaluate(() => window.__jumper3!.setState({ power: 'spark' })); await page.keyboard.down('x'); await expect.poll(async () => (await state(page)).shots.length).toBeGreaterThan(0); await page.keyboard.up('x');
  await page.getByRole('button', { name: 'Pause', exact: true }).click(); const paused = await state(page); expect(paused.paused).toBe(true); await page.waitForTimeout(350); expect((await state(page)).elapsed).toBe(paused.elapsed);
  await page.getByRole('button', { name: 'Resume adventure' }).click(); await expect.poll(async () => (await state(page)).paused).toBe(false);
  await page.getByRole('button', { name: 'Exit', exact: true }).click(); await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
  await page.screenshot({ path: 'test-results/jumper-board.png' }); expect(errors).toEqual([]);
});

test('three restored seals win, and a real result saves under first and last name', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('https://formspree.io/f/*', async (route) => { submitted = route.request().postDataJSON(); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await launch(page);
  for (let stage = 0; stage < 3; stage++) {
    await page.evaluate(() => { const r = window.__jumper3!.getState(); const goal = [116, 130, 144][r.stage]; r.enemies.forEach((e) => e.dead = true); window.__jumper3!.setState({ enemies: r.enemies, x: goal - 2.5, y: 0, vy: 0, grounded: true }); });
    await expect.poll(async () => (await state(page)).phase).toBe(stage === 2 ? 'won' : 'cleared');
    if (stage < 2) { await page.getByRole('button', { name: 'Next chapter' }).click(); await page.getByRole('button', { name: 'Start chapter' }).click(); await page.screenshot({ path: `test-results/jumper-chapter-${stage + 2}.png` }); }
  }
  await expect(page.getByRole('heading', { name: 'Industry rises again.' })).toBeVisible(); const score = (await state(page)).score;
  await page.getByRole('button', { name: 'Save score / Leaderboard' }).click(); await page.getByLabel('First name').fill('Atom'); await page.getByLabel('Last name').fill('Example'); await page.getByRole('button', { name: 'Submit my score' }).click();
  await expect(page.getByText('A copy was also sent to ITD.', { exact: false })).toBeVisible(); expect(submitted).toMatchObject({ gameId: 'jumper-3', firstName: 'Atom', lastName: 'Example', score });
  await page.reload(); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract'); await page.keyboard.press('Enter'); await page.getByRole('button', { name: 'High scores', exact: true }).click();
  await page.getByRole('button', { name: 'Jumper 3: The Legend of Atom', exact: true }).click(); await expect(page.getByText('Atom Example', { exact: true })).toBeVisible();
});

test.describe('tablet platforming', () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  test('three fingers can move, jump and fire; releases, cancellation and rotation clear holds', async ({ page }) => {
    await launch(page); await page.evaluate(() => { const r = window.__jumper3!.getState(); window.__jumper3!.setState({ power: 'spark', enemies: [], pickups: [], solids: r.solids.filter((s) => s.kind === 'ground') }); });
    const session = await page.context().newCDPSession(page);
    async function finger(name: string, id: number) { const b = (await page.getByRole('button', { name, exact: true }).boundingBox())!; expect(b.height).toBeGreaterThanOrEqual(56); expect(b.width).toBeGreaterThanOrEqual(56); return { id, x: b.x + b.width / 2, y: b.y + b.height / 2 }; }
    const right = await finger('Right', 1), jump = await finger('Jump', 2), fire = await finger('Blaster', 3);
    const x = (await state(page)).x;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right, jump, fire] });
    await expect.poll(async () => (await state(page)).y).toBeGreaterThan(0.5); await expect.poll(async () => (await state(page)).shots.length).toBeGreaterThan(0);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [jump, fire] });
    await expect.poll(async () => (await state(page)).x).toBeGreaterThan(x + 2); await expect(page.getByRole('button', { name: 'Right', exact: true })).toHaveClass(/pressed/); await expect(page.getByRole('button', { name: 'Jump', exact: true })).not.toHaveClass(/pressed/);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await expect.poll(async () => Math.abs((await state(page)).vx)).toBe(0);
    expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(1); await page.screenshot({ path: 'test-results/jumper-tablet.png' });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right] }); await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); await expect.poll(async () => Math.abs((await state(page)).vx)).toBe(0);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right] }); await page.setViewportSize({ width: 768, height: 1024 }); await expect.poll(async () => (await state(page)).paused).toBe(true);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.getByRole('button', { name: 'Resume adventure' }).tap(); await expect.poll(async () => Math.abs((await state(page)).vx)).toBe(0);
    await page.screenshot({ path: 'test-results/jumper-portrait.png' }); await page.getByRole('button', { name: 'Exit', exact: true }).tap(); await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board'); await expect(page.locator('.jumper-hud')).toHaveCount(0);
  });
});
