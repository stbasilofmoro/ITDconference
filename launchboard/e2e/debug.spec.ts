import { test, expect } from '@playwright/test';
import './hooks';

test('debug panel exposes every tube parameter and writes overrides', async ({ page }) => {
  await page.goto('/?e2e&debug');
  const panel = page.getByTestId('debug-panel');
  await expect(panel).toBeVisible();
  await expect(panel.locator('input[type=range]')).toHaveCount(17);

  await panel.locator('input[data-param="curvature"]').fill('0.1');
  await expect.poll(() => page.evaluate(() => window.__launchboard!.tubeOverrides().curvature)).toBe(0.1);

  await panel.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Object.keys(window.__launchboard!.tubeOverrides()).length)).toBe(0);

  await page.keyboard.press('Control+Shift+D');
  await expect(panel).toBeHidden();
});
