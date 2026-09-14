import { test, expect, type Page } from '@playwright/test';
import './hooks';
import type { Run } from '../src/games/convention-hall/engine';

declare global { interface Window {
  __conventionHall?: { getState(): Run; setState(patch: Partial<Run>): void };
  __hallPad?: { buttons: { pressed: boolean }[]; axes: number[] };
} }
const state = (page: Page) => page.evaluate(() => window.__conventionHall!.getState());
async function launch(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('arema.qualityOverride', 'standard');
    window.__hallPad = { buttons: Array.from({ length: 16 }, () => ({ pressed: false })), axes: [0, 0, 0, 0] };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.__hallPad] });
  });
  await page.goto('/?e2e'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board');
  await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => window.__launchboard?.getState().focusIndex === 1);
  await page.keyboard.press('ArrowDown'); await page.waitForFunction(() => window.__launchboard?.getState().focusIndex === 4);
  await page.keyboard.press('Enter'); await page.waitForFunction(() => !!window.__conventionHall);
}
async function point(page: Page, x: number, y: number) { return page.evaluate(([x, y]) => window.__launchboard!.contentToScreen(x, y), [x, y]); }
async function tap(page: Page, x: number, y: number) { const p = await point(page, x, y); await page.mouse.click(p.px, p.py); }

test('fifth tile, first badge, keyboard, drag, touch hold, controller, pause and exit', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); await launch(page);
  await page.screenshot({ path: 'test-results/convention-intro.png' });
  await page.keyboard.press('Enter'); await expect.poll(async () => (await state(page)).phase).toBe('playing');
  await page.keyboard.press('Space'); await expect.poll(async () => (await state(page)).found).toBe(1);
  expect((await state(page)).people.filter((p) => p.scanned)).toHaveLength(1);
  await page.screenshot({ path: 'test-results/convention-scanned.png' });
  const z = (await state(page)).z; await page.keyboard.down('w'); await expect.poll(async () => (await state(page)).z).toBeLessThan(z - 0.3); await page.keyboard.up('w');
  const p = await point(page, 0, 100); await page.mouse.move(p.px, p.py); await page.mouse.down(); await page.mouse.move(p.px + 90, p.py, { steps: 5 }); await page.mouse.up();
  expect((await state(page)).yaw).toBeGreaterThan(0.2);
  const t = await point(page, -758, -298), before = await state(page); await page.mouse.move(t.px, t.py); await page.mouse.down();
  await expect.poll(async () => (await state(page)).z).toBeLessThan(before.z - 0.25); await page.mouse.up();
  const yaw = (await state(page)).yaw; await page.evaluate(() => { window.__hallPad!.axes[2] = 1; });
  await expect.poll(async () => (await state(page)).yaw).toBeGreaterThan(yaw + 0.2); await page.evaluate(() => { window.__hallPad!.axes[2] = 0; });
  await tap(page, 625, -483); await expect.poll(async () => (await state(page)).paused).toBe(true);
  const paused = await state(page); await page.waitForTimeout(500); expect((await state(page)).elapsed).toBe(paused.elapsed);
  await page.keyboard.press('Enter'); await expect.poll(async () => (await state(page)).paused).toBe(false);
  await page.keyboard.press('Escape'); await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board'); expect(errors).toEqual([]);
});

test('vendors telegraph and attack, scanning stops them, timeout and replay reset the hall', async ({ page }) => {
  await launch(page); await page.keyboard.press('Enter');
  await page.evaluate(() => {
    const r = window.__conventionHall!.getState(), vendor = r.people.find((p) => p.rude)!;
    r.people.forEach((p) => { p.x = p.homeX = 16; p.z = p.homeZ = -22; });
    Object.assign(vendor, { x: 0, homeX: 0, z: 21, homeZ: 21, cooldown: 0 });
    window.__conventionHall!.setState({ elapsed: 5, people: r.people, x: 0, z: 24, yaw: 0, pitch: -0.035 });
  });
  await expect.poll(async () => (await state(page)).people.some((p) => p.windup > 0)).toBe(true);
  await expect.poll(async () => (await state(page)).breath.length).toBeGreaterThan(0);
  await expect.poll(async () => (await state(page)).health).toBe(75);
  await tap(page, 721, -391); await expect.poll(async () => (await state(page)).scanCount).toBe(1);
  expect((await state(page)).people.find((p) => p.scanned)?.rude).toBe(true); expect((await state(page)).breath).toHaveLength(0);
  await page.evaluate(() => window.__conventionHall!.setState({ elapsed: 179.95 }));
  await expect.poll(async () => (await state(page)).phase).toBe('lost');
  await page.keyboard.press('Enter'); await expect.poll(async () => (await state(page)).phase).toBe('playing');
  expect(await state(page)).toMatchObject({ health: 100, found: 0, score: 0, scanCount: 0 });
});

test('five badge contacts win and the name form saves the real score locally', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('https://formspree.io/f/*', async (route) => { submitted = route.request().postDataJSON(); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await launch(page); await page.keyboard.press('Enter');
  for (let i = 0; i < 5; i++) {
    await page.evaluate((index) => {
      const r = window.__conventionHall!.getState(); r.people.forEach((p) => { p.x = p.homeX = 16; p.z = p.homeZ = -22; });
      const target = r.people.find((p) => p.company === r.targets[index])!; Object.assign(target, { x: 0, homeX: 0, z: 18, homeZ: 18 });
      window.__conventionHall!.setState({ people: r.people, scanCooldown: 0, x: 0, z: 24, yaw: 0, pitch: -0.035 });
    }, i);
    await page.keyboard.press('Space'); await expect.poll(async () => (await state(page)).found).toBe(i + 1);
  }
  expect((await state(page)).phase).toBe('won'); const score = (await state(page)).score; expect(score).toBeGreaterThan(4000);
  await page.screenshot({ path: 'test-results/convention-won.png' }); await tap(page, -211, -423); await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('First name').fill('Pat'); await page.getByLabel('Last name').fill('Example'); await page.getByRole('button', { name: 'Submit my score' }).click();
  await expect(page.getByText('A copy was also sent to ITD.', { exact: false })).toBeVisible();
  expect(submitted).toMatchObject({ firstName: 'Pat', lastName: 'Example', score, gameId: 'convention-hall' });
  await page.getByRole('button', { name: 'Close leaderboard' }).click(); await page.keyboard.press('Escape');
  await page.reload(); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract'); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'High scores', exact: true }).click(); await page.getByRole('button', { name: 'Convention Hall', exact: true }).click();
  await expect(page.getByText('Pat Example', { exact: true })).toBeVisible();
});
