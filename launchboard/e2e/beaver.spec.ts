import { test, expect, type Page } from '@playwright/test';
import './hooks';
import type { Run } from '../src/games/beaver-crossing/engine';

declare global {
  interface Window {
    __beaver?: { getState(): Run; action(action: string): void; setScenario(level: number, row?: number, x?: number, time?: number): void };
  }
}
async function launch(page: Page) {
  await page.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await page.goto('/?e2e&beaver');
  await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__launchboard?.getState().screen)).toBe('board');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.__beaver);
}
const state = (page: Page) => page.evaluate(() => window.__beaver!.getState());

test('launch, touch arrows, collision, retry, all five finishes, and private prize fields', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  await launch(page);
  expect((await state(page)).phase).toBe('intro');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
  const up = await page.evaluate(() => window.__launchboard!.contentToScreen(-695, -245));
  await page.mouse.click(up.px, up.py);
  await expect.poll(async () => (await state(page)).row).toBe(1);
  // Stand in an active exhaust lane to exercise the real collision and retry flow.
  await page.evaluate(() => window.__beaver!.setScenario(2, 5, 4, 4));
  await expect.poll(async () => (await state(page)).phase).toBe('hit');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('playing');
  expect((await state(page)).level).toBe(2);
  expect((await state(page)).row).toBe(0);
  for (let level = 0; level < 5; level++) {
    await page.evaluate((i) => window.__beaver!.setScenario(i, 11), level);
    await page.keyboard.press('ArrowUp');
    await expect.poll(async () => (await state(page)).phase).toBe(level === 4 ? 'won' : 'cleared');
    if (level < 4) {
      await page.keyboard.press('Enter');
      await expect.poll(async () => (await state(page)).phase).toBe('intro');
      expect((await state(page)).level).toBe(level + 1);
    }
  }
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('Beaver');
  await page.getByLabel('First name').press('End');
  await page.keyboard.type(' Jr');
  await page.getByLabel('First name').press('Backspace');
  await expect(page.getByLabel('First name')).toHaveValue('Test J');
  expect((await state(page)).phase).toBe('won');
  await page.getByRole('button', { name: 'Finish without submitting' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__launchboard!.getState().screen)).toBe('board');
  expect(errors).toEqual([]);
});

test('Formspree rejection keeps entered details; acceptance clears the form and prevents duplicates', async ({ page }) => {
  // Inject only the public test endpoint into this browser's module response. Every POST
  // is intercepted below; this test never sends a claim or message to an external service.
  await page.route('**/src/games/beaver-crossing/claims.ts*', async (route) => {
    const response = await route.fetch();
    const source = (await response.text()).replace(/export const FORMSPREE_ENDPOINT = [^;]+;/, 'export const FORMSPREE_ENDPOINT = "https://formspree.io/f/testonly";');
    await route.fulfill({ response, body: source });
  });
  let requests = 0;
  await page.route('https://formspree.io/f/testonly', async (route) => {
    requests++;
    expect(route.request().postDataJSON()).toMatchObject({ name: 'Test Beaver', company: 'Example Rail', levelsCompleted: 5 });
    await route.fulfill({ status: requests === 1 ? 429 : 200, contentType: 'application/json', body: requests === 1 ? '{"error":"test rate limit"}' : '{"ok":true}' });
  });
  await launch(page);
  await page.evaluate(() => window.__beaver!.setScenario(4, 11));
  await page.keyboard.press('ArrowUp');
  await expect.poll(async () => (await state(page)).phase).toBe('won');
  await page.keyboard.press('Enter');
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('Beaver');
  await page.getByLabel('Company', { exact: true }).fill('Example Rail');
  await page.getByLabel('Phone number').fill('+1 555 010 2345');
  await page.getByLabel('Full mailing address').fill('123 Example St, Example, NY 10001, USA');
  await page.getByRole('button', { name: 'Claim my maple syrup' }).click();
  await expect(page.getByRole('alert')).toContainText('busy');
  await expect(page.getByLabel('First name')).toHaveValue('Test');
  await page.getByRole('button', { name: 'Claim my maple syrup' }).click();
  await expect(page.getByRole('heading', { name: 'Claim received.' })).toBeVisible();
  await expect(page.getByLabel('First name')).toHaveCount(0);
  expect(requests).toBe(2);
  const saved = await page.evaluate(() => localStorage.getItem('itd.leaderboard.v1'));
  expect(JSON.parse(saved!)).toEqual([expect.objectContaining({ firstName: 'Test', lastName: 'Beaver', game: 'beaver-crossing' })]);
  expect(saved).not.toContain('Example Rail'); expect(saved).not.toContain('123 Example St'); expect(saved).not.toContain('555');
  await page.getByRole('button', { name: 'Back to the launchboard' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
