import { test, expect } from '@playwright/test';

test('illustration gallery renders without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/?gallery');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/gallery.png' });
  expect(errors).toEqual([]);
});
