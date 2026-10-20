import { test, expect, devices, type Page } from '@playwright/test';
import './hooks';

const CLAIM_BUTTON = 'You won all games? Get your free maple syrup';
const { defaultBrowserType: _phoneBrowser, ...phoneDevice } = devices['iPhone 13'];
const boardState = (page: Page) => page.evaluate(() => ({ screen: window.__launchboard!.getState().screen, activeGameId: window.__launchboard!.getState().activeGameId }));

async function ready(page: Page, quality = 'standard') {
  await page.route('https://formspree.io/f/**', route => route.abort());
  await page.addInitScript(value => localStorage.setItem('arema.qualityOverride', value), quality);
  await page.goto('/?e2e&beaver');
  await page.waitForFunction(screen => window.__launchboard?.getState().screen === screen, quality === 'safe' ? 'board' : 'attract');
}
async function openCanvasClaim(page: Page) {
  const point = await page.evaluate(() => window.__launchboard!.contentToScreen(-600, -370));
  expect(await page.evaluate(({ px, py }) => document.elementFromPoint(px, py)?.tagName, point)).toBe('CANVAS');
  await expect(async () => {
    await page.mouse.click(point.px, point.py);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

for (const quality of ['standard', 'pro']) {
  test(`${quality} CRT board paints and activates the syrup button through the canvas`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await ready(page, quality);
    await page.keyboard.press('Enter');
    await expect.poll(() => boardState(page)).toEqual({ screen: 'board', activeGameId: null });
    await openCanvasClaim(page);
    expect(await boardState(page)).toEqual({ screen: 'board', activeGameId: null });
    await page.getByRole('button', { name: 'Finish without submitting', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath(`${quality}-crt-claim-button.png`) });
    expect(errors).toEqual([]);
  });
}

test('board claim opens by keyboard without launching a game and clears private details on close and idle', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await page.keyboard.press('Enter');
  const claim = page.getByRole('button', { name: CLAIM_BUTTON, exact: true });
  await expect(claim).toHaveCount(1);
  await claim.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await boardState(page)).toEqual({ screen: 'board', activeGameId: null });
  await page.getByLabel('First name', { exact: true }).fill('Private');
  await page.getByLabel('Full mailing address').fill('123 Private Address');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(claim).toBeFocused();
  await page.screenshot({ path: test.info().outputPath('desktop-claim-button.png') });
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Full mailing address')).toHaveValue('');
  await page.getByLabel('Company', { exact: true }).fill('Private company');
  await page.evaluate(() => window.__launchboard!.getState().markInput(performance.now() - 300001));
  await expect.poll(() => boardState(page)).toEqual({ screen: 'attract', activeGameId: null });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await openCanvasClaim(page);
  await expect(page.getByLabel('Company', { exact: true })).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('itd.leaderboard.v1'))).toBeNull();
  await page.getByRole('button', { name: 'Finish without submitting', exact: true }).click();
  expect(errors).toEqual([]);
});

test('CSS fallback keeps the all-games claim reachable without starting a game', async ({ page }) => {
  await ready(page, 'safe');
  await expect(page.getByTestId('css-fallback')).toBeVisible();
  const claim = page.getByRole('button', { name: CLAIM_BUTTON, exact: true });
  const mask = await claim.evaluate(button => {
    const tube = button.closest('.fb-tube');
    const overlay = tube?.querySelector('.fb-mask');
    return { insideTube: !!tube, maskFollows: !!overlay && !!(button.compareDocumentPosition(overlay) & Node.DOCUMENT_POSITION_FOLLOWING), maskAllowsClicks: !!overlay && getComputedStyle(overlay).pointerEvents === 'none' };
  });
  expect(mask).toEqual({ insideTube: true, maskFollows: true, maskAllowsClicks: true });
  await claim.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await boardState(page)).toEqual({ screen: 'board', activeGameId: null });
  await page.getByRole('button', { name: 'Finish without submitting', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('fallback-crt-claim-button.png') });
});

test.describe('phone syrup claim', () => {
  test.use(phoneDevice);

  test('portrait welcome promotes every game and the board form remains usable', async ({ page }) => {
    await ready(page);
    await expect(page.getByText('Beat Every Game', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'TOUCH TO PLAY' }).tap();
    const claim = page.getByRole('button', { name: CLAIM_BUTTON, exact: true });
    await claim.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath('phone-claim-button.png') });
    await claim.tap();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await boardState(page)).toEqual({ screen: 'board', activeGameId: null });
    await page.getByLabel('First name', { exact: true }).fill('Mobile');
    await page.getByLabel('Full mailing address').fill('123 Test Street');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Finish without submitting', exact: true }).tap();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.phone-game')).toHaveCount(6);
    await claim.tap();
    await expect(page.getByLabel('First name', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Full mailing address')).toHaveValue('');
    await page.getByRole('button', { name: 'Finish without submitting', exact: true }).tap();
  });
});
