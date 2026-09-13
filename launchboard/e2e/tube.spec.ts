import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __launchboard?: { contentToScreen(x: number, y: number): { px: number; py: number }; clicks?: () => number };
  }
}

test('tube renders and maps pointer hits through the curved glass', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('/?e2e');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => !!window.__launchboard);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/tube-check.png' });

  const target = await page.evaluate(() => window.__launchboard!.contentToScreen(-55, 270));
  await page.mouse.click(target.px, target.py);
  await expect.poll(() => page.evaluate(() => window.__launchboard!.clicks!())).toBe(1);

  const miss = await page.evaluate(() => window.__launchboard!.contentToScreen(600, -300));
  await page.mouse.click(miss.px, miss.py);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__launchboard!.clicks!())).toBe(1);

  expect(errors).toEqual([]);
});
