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

  await page.setViewportSize({ width: 1280, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tube-bezel-4x3.png' });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);

  const target = await page.evaluate(() => window.__launchboard!.contentToScreen(-55, 270));
  await page.mouse.click(target.px, target.py);
  await expect.poll(() => page.evaluate(() => window.__launchboard!.clicks!())).toBe(1);

  const miss = await page.evaluate(() => window.__launchboard!.contentToScreen(600, -300));
  await page.mouse.click(miss.px, miss.py);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__launchboard!.clicks!())).toBe(1);

  // Small corner target: the curved mapping must hit it, the flat (no-barrel) mapping must miss it.
  const corner = await page.evaluate(() => window.__launchboard!.contentToScreen(-760, 400));
  await page.mouse.click(corner.px, corner.py);
  await expect.poll(() => page.evaluate(() => window.__launchboard!.clicks!())).toBe(2);

  const flat = await page.evaluate(([x, y]) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / 2160, h / 1410);
    const tubeX = (w - 2160 * scale) / 2 + 120 * scale;
    const tubeY = (h - 1410 * scale) / 2 + 110 * scale;
    const tubeW = 1920 * scale;
    const tubeH = 1080 * scale;
    return { px: tubeX + (x / 1920 + 0.5) * tubeW, py: tubeY + (1 - (y / 1080 + 0.5)) * tubeH };
  }, [-760, 400]);
  test.info().annotations.push({
    type: 'flat-vs-curved-px',
    description: Math.hypot(flat.px - corner.px, flat.py - corner.py).toFixed(1),
  });
  await page.mouse.click(flat.px, flat.py);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__launchboard!.clicks!())).toBe(2);

  expect(errors).toEqual([]);
});
