import { test, expect, type Page } from '@playwright/test';
import './hooks';
type AudioState = { context: string; active: boolean; muted: boolean; music: number; effects: number; voices: number; peak: number; musicSteps: number; status: string; recent: { cue: string; game: string }[] };
declare global { interface Window { __boothAudio?: { getState(): AudioState } } }
const audio = (p: Page) => p.evaluate(() => window.__boothAudio!.getState());
async function ready(p: Page) {
  await p.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await p.goto('/?e2e&beaver'); await p.waitForFunction(() => window.__launchboard?.getState().screen === 'attract' && !!window.__boothAudio);
}

test('audio waits for interaction, produces a soft signal, and remembers independent volume and mute controls', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); await ready(page);
  expect(await audio(page)).toMatchObject({ context: 'locked', voices: 0, musicSteps: 0 });
  await page.keyboard.press('Enter'); await expect.poll(async () => (await audio(page)).context).toBe('running');
  await expect.poll(async () => (await audio(page)).musicSteps).toBeGreaterThan(2);
  await expect.poll(async () => (await audio(page)).peak).toBeGreaterThan(0.0001); expect((await audio(page)).peak).toBeLessThan(0.3);
  await page.getByRole('button', { name: 'Sound settings', exact: true }).click(); await page.getByLabel('Music', { exact: false }).focus(); await page.keyboard.press('Home');
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
  expect(await audio(page)).toMatchObject({ music: 0.1, effects: 0.45 }); expect(await page.evaluate(() => window.__launchboard!.getState().focusIndex)).toBe(0);
  await page.getByRole('button', { name: 'Mute all sound' }).click(); await expect.poll(async () => (await audio(page)).context).toBe('suspended'); expect((await audio(page)).voices).toBe(0);
  const step = (await audio(page)).musicSteps; await page.waitForTimeout(300); expect((await audio(page)).musicSteps).toBe(step);
  await page.getByRole('button', { name: 'Turn sound on' }).click(); await expect.poll(async () => (await audio(page)).context).toBe('running');
  await page.getByRole('button', { name: 'Mute all sound' }).click(); await page.reload(); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract'); await page.keyboard.press('Enter');
  await expect.poll(async () => (await audio(page)).context).toBe('suspended'); expect(await audio(page)).toMatchObject({ music: 0.1, muted: true, voices: 0, musicSteps: 0 }); expect(errors).toEqual([]);
});

test('all six games trigger their own cues through normal keyboard play', async ({ page }) => {
  test.setTimeout(120_000); const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message)); await ready(page); await page.keyboard.press('Enter');
  const games = [
    ['beaver-crossing', '__beaver', 'ArrowLeft', 'hop'], ['carbon-sort', '__carbonSort', 'ArrowRight', 'move'], ['kiln-keeper', '__kilnKeeper', 'ArrowRight', 'feed'],
    ['carbon-rails', '__carbonRails', 'd', 'card'], ['convention-hall', '__conventionHall', 'Space', 'scan'], ['jumper-3', '__jumper3', 'Space', 'jump'],
  ];
  for (const [index, [id, hook, key, cue]] of games.entries()) {
    await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board'); await page.evaluate((i) => window.__launchboard!.getState().setFocus(i), index); await page.keyboard.press('Enter');
    await page.waitForFunction((name) => !!(window as unknown as Record<string, unknown>)[name], hook); await page.keyboard.press('Enter');
    await expect.poll(async () => (await audio(page)).recent.some((e) => e.game === id && e.cue === 'start')).toBe(true);
    if (id === 'carbon-rails') { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
    if (id === 'jumper-3') await page.waitForFunction(() => !window.__jumper3!.getState().wasJump);
    await page.keyboard.press(key); await expect.poll(async () => (await audio(page)).recent.filter((e) => e.game === id).map((e) => e.cue), { message: `${id} should play ${cue}` }).toContain(cue); await page.keyboard.press('Escape');
  }
  await page.evaluate(() => window.__launchboard!.getState().toAttract()); await expect.poll(async () => (await audio(page)).context).toBe('suspended'); expect((await audio(page)).voices).toBe(0); expect(errors).toEqual([]);
});

test('tablet mute controls survive interruption without stuck or stacked voices', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true }); const page = await context.newPage(); await ready(page); await page.touchscreen.tap(8, 8);
  await expect.poll(async () => (await audio(page)).context).toBe('running');
  const button = page.getByRole('button', { name: 'Sound settings', exact: true }); expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(56); await button.tap();
  await page.getByRole('button', { name: 'Mute all sound' }).tap(); await expect.poll(async () => (await audio(page)).context).toBe('suspended');
  await page.getByRole('button', { name: 'Turn sound on' }).tap(); await page.getByRole('button', { name: 'Close sound settings' }).tap();
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect.poll(async () => (await audio(page)).context).toBe('suspended'); expect((await audio(page)).voices).toBe(0);
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.touchscreen.tap(8, 8); await expect.poll(async () => (await audio(page)).context).toBe('running'); expect((await audio(page)).voices).toBeLessThan(30);
  await page.screenshot({ path: 'test-results/audio-tablet.png' }); await context.close();
});

test('games remain available when Web Audio is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'AudioContext', { value: undefined }); Object.defineProperty(window, 'webkitAudioContext', { value: undefined }); });
  await ready(page); await page.keyboard.press('Enter'); await expect.poll(async () => (await audio(page)).status).toBe('unavailable');
  await page.keyboard.press('Enter'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'game'); await page.keyboard.press('Escape'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board');
});
