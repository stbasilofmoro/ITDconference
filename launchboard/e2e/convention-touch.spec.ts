import { test, expect, type Page, type CDPSession } from '@playwright/test';
import './hooks';
import type {} from './convention-hall.spec';

test.use({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
test.setTimeout(90_000);
const state = (page: Page) => page.evaluate(() => window.__conventionHall!.getState());
async function launch(page: Page) {
  await page.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await page.goto('/?e2e'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  const center = await page.evaluate(() => window.__launchboard!.contentToScreen(0, 0)); await page.touchscreen.tap(center.px, center.py);
  await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board');
  const tile = await page.evaluate(() => window.__launchboard!.contentToScreen(325, -140));
  await expect(async () => { await page.touchscreen.tap(tile.px, tile.py); await expect(page.getByRole('button', { name: 'Enter the hall', exact: true })).toBeVisible({ timeout: 1500 }); }).toPass({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Enter the hall', exact: true }).tap();
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
}
type Finger = { id: number; x: number; y: number; radiusX: number; radiusY: number; force: number };
const finger = (id: number, x: number, y: number): Finger => ({ id, x, y, radiusX: 8, radiusY: 8, force: 1 });
const send = (cdp: CDPSession, type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', fingers: Finger[]) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: fingers });
async function joystick(page: Page) { const b = (await page.getByRole('group', { name: 'Movement joystick' }).boundingBox())!; return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }

test('native multitouch moves, looks and scans together, then every finger releases cleanly', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); await launch(page);
  const cdp = await page.context().newCDPSession(page), j = await joystick(page);
  const m = finger(1, j.x, j.y - 22), l = finger(2, 720, 340);
  await send(cdp, 'touchStart', [m]); await expect.poll(async () => (await state(page)).z).toBeLessThan(23.8);
  await send(cdp, 'touchStart', [m, l]); l.x += 25; await send(cdp, 'touchMove', [m, l]);
  await expect.poll(async () => (await state(page)).yaw).toBeCloseTo(0.15, 2);
  l.x -= 25; await send(cdp, 'touchMove', [m, l]); await expect.poll(async () => (await state(page)).yaw).toBeCloseTo(0, 2);
  const button = (await page.getByRole('button', { name: 'Scan', exact: true }).boundingBox())!, s = finger(3, button.x + button.width / 2, button.y + button.height / 2);
  await send(cdp, 'touchStart', [m, l, s]); await expect.poll(async () => (await state(page)).found).toBe(1);
  // Chromium sends pointerup for the IDs listed in a partial touchEnd.
  await send(cdp, 'touchEnd', [s]); await send(cdp, 'touchEnd', [m]);
  const stopped = await state(page); l.x += 35; await send(cdp, 'touchMove', [l]);
  await expect.poll(async () => (await state(page)).yaw).toBeCloseTo(0.21, 2);
  expect((await state(page)).z).toBeCloseTo(stopped.z, 5);
  await send(cdp, 'touchEnd', []); await page.waitForTimeout(350);
  const after = await state(page); expect(after.z).toBeCloseTo(stopped.z, 5); expect(after.scanCount).toBe(1);
  expect(await page.evaluate(() => visualViewport!.scale)).toBe(1);
  expect(await page.locator('.hall-touch').evaluate((el) => getComputedStyle(el).touchAction)).toBe('none');
  await page.screenshot({ path: 'test-results/convention-ipad-landscape.png' }); expect(errors).toEqual([]);
});

test('cancel, lost capture, pause, blur and rotation clear held movement; controls stay finger-sized', async ({ page }) => {
  await launch(page); const cdp = await page.context().newCDPSession(page), j = await joystick(page), m = finger(1, j.x, j.y - 42);
  await send(cdp, 'touchStart', [m]); await expect.poll(async () => (await state(page)).z).toBeLessThan(23.8);
  await send(cdp, 'touchCancel', []); const cancelled = await state(page); await page.waitForTimeout(300); expect((await state(page)).z).toBe(cancelled.z);
  await send(cdp, 'touchStart', [m]); await send(cdp, 'touchMove', [{ ...m, x: 450, y: 340 }]); await send(cdp, 'touchEnd', []);
  const outside = await state(page); await page.waitForTimeout(300); expect((await state(page)).x).toBe(outside.x); expect((await state(page)).z).toBe(outside.z);
  await page.getByRole('group', { name: 'Movement joystick' }).evaluate((el) => el.addEventListener('pointerdown', (e) => { (el as HTMLElement & { testPointer?: number }).testPointer = (e as PointerEvent).pointerId; }, { once: true }));
  await send(cdp, 'touchStart', [m]); await send(cdp, 'touchMove', [{ ...m, y: m.y - 1 }]); expect(await page.getByRole('group', { name: 'Movement joystick' }).evaluate((el) => {
    // Exercise the browser's lost-capture cleanup using the real active pointer.
    const id = (el as HTMLElement & { testPointer?: number }).testPointer;
    if (id !== undefined && el.hasPointerCapture(id)) { el.releasePointerCapture(id); return true; } return false;
  })).toBe(true);
  await send(cdp, 'touchMove', [{ ...m, y: m.y - 2 }]); const uncaptured = await state(page); await page.waitForTimeout(300); expect((await state(page)).z).toBe(uncaptured.z);
  await send(cdp, 'touchEnd', []);
  // Keep movement held while a second finger pauses.
  await send(cdp, 'touchStart', [m]); const pause = (await page.getByRole('button', { name: 'Pause', exact: true }).boundingBox())!;
  await send(cdp, 'touchStart', [m, finger(2, pause.x + 20, pause.y + 20)]); await expect.poll(async () => (await state(page)).paused).toBe(true);
  await send(cdp, 'touchCancel', []); await page.getByRole('button', { name: 'Resume exploring' }).tap();
  const resumed = await state(page); await page.waitForTimeout(300); expect((await state(page)).z).toBe(resumed.z);
  await send(cdp, 'touchStart', [m]); await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect.poll(async () => (await state(page)).paused).toBe(true);
  await send(cdp, 'touchCancel', []); await page.getByRole('button', { name: 'Resume exploring' }).tap();
  await send(cdp, 'touchStart', [m]); await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(async () => (await state(page)).paused).toBe(true); await send(cdp, 'touchCancel', []);
  await page.getByRole('button', { name: 'Resume exploring' }).tap(); const rotated = await state(page); await page.waitForTimeout(300); expect((await state(page)).z).toBe(rotated.z);
  for (const name of ['Scan', 'Pause', 'Exit']) { const b = (await page.getByRole('button', { name, exact: true }).boundingBox())!; expect(b.height).toBeGreaterThanOrEqual(56); expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x + b.width).toBeLessThanOrEqual(768); }
  expect(await page.evaluate(() => visualViewport!.scale)).toBe(1); await page.screenshot({ path: 'test-results/convention-ipad-portrait.png' });
  await page.getByRole('button', { name: 'Exit', exact: true }).tap(); await expect(page.locator('[data-hall-touch-host]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
});

test('tablet result, score form, replay and exit use native touch buttons', async ({ page }) => {
  await page.route('https://formspree.io/f/*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await launch(page); await page.evaluate(() => window.__conventionHall!.setState({ phase: 'won', found: 5, scanCount: 5, score: 4500 }));
  await page.getByRole('button', { name: 'Save score / Leaderboard', exact: true }).tap(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('First name').fill('Tablet'); await page.getByLabel('Last name').fill('Player'); await page.getByRole('button', { name: 'Submit my score' }).tap();
  await expect(page.getByText('A copy was also sent to ITD.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Back to the game' }).tap(); await page.getByRole('button', { name: 'Try a fresh hall' }).tap();
  await expect.poll(async () => (await state(page)).phase).toBe('playing'); expect(await state(page)).toMatchObject({ score: 0, found: 0, health: 100 });
  await page.getByRole('button', { name: 'Exit', exact: true }).tap(); await expect(page.locator('.hall-touch')).toHaveCount(0);
});
