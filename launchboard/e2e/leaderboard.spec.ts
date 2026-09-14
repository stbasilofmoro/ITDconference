import { test, expect } from '@playwright/test';
import './hooks';
import type {} from './carbon-rails.spec';
import type {} from './carbon-sort.spec';
import type {} from './kiln-keeper.spec';

for (const game of [
  { id: 'carbon-sort', index: 1, score: 4321, x: -170, y: -350 },
  { id: 'kiln-keeper', index: 2, score: 18500, x: -150, y: -382 },
  { id: 'carbon-rails', index: 3, score: 1, x: -200, y: -440 },
]) test(`${game.id}: named score form, local persistence, private fields excluded`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message));
  let posts = 0;
  await page.route('https://formspree.io/f/*', async (route) => {
    posts++; expect(route.request().postDataJSON()).toMatchObject({ firstName: 'Pat', lastName: 'Example', gameId: game.id, score: game.score });
    if (game.id === 'kiln-keeper' && posts === 1) await route.abort();
    else await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.addInitScript(() => localStorage.setItem('arema.qualityOverride', 'standard'));
  await page.goto('/?e2e'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter'); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'board');
  await page.evaluate((i) => window.__launchboard!.getState().setFocus(i), game.index);
  await page.keyboard.press('Enter');
  await page.waitForFunction((id) => id === 'carbon-sort' ? !!window.__carbonSort : id === 'kiln-keeper' ? !!window.__kilnKeeper : !!window.__carbonRails, game.id);
  await page.evaluate((id) => {
    if (id === 'carbon-sort') window.__carbonSort!.setState({ phase: 'won', score: 4321 });
    if (id === 'kiln-keeper') window.__kilnKeeper!.setState({ phase: 'won', elapsed: 90, inBand: 85 });
    if (id === 'carbon-rails') { const r = window.__carbonRails!.getState(); r.owners[0] = 0; r.owners[1] = 0; window.__carbonRails!.setState({ owners: r.owners, phase: 'won' }); }
  }, game.id);
  const p = await page.evaluate(([x, y]) => window.__launchboard!.contentToScreen(x, y), [game.x, game.y]);
  // Fixture state changes before R3F's result screen (and its suspended text) is
  // committed. Canvas clicks need explicit retrying; DOM locator auto-waiting
  // cannot see the button's mesh while that screen is still being drawn.
  await expect(async () => {
    await page.mouse.click(p.px, p.py);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await page.getByLabel('First name').fill('Pat'); await page.getByLabel('Last name').fill('Example');
  await page.getByRole('button', { name: 'Submit my score' }).click();
  await expect(page.getByRole('heading', { name: 'Score saved.' })).toBeVisible();
  if (game.id === 'kiln-keeper') { await expect(page.getByRole('alert')).toContainText('Saved here'); await page.getByRole('button', { name: 'Retry sending to ITD' }).click(); }
  await expect(page.getByText('A copy was also sent to ITD.', { exact: false })).toBeVisible();
  const raw = await page.evaluate(() => localStorage.getItem('itd.leaderboard.v1'));
  expect(JSON.parse(raw!)).toEqual([expect.objectContaining({ firstName: 'Pat', lastName: 'Example', game: game.id, score: game.score })]);
  expect(raw).not.toContain('phone'); expect(raw).not.toContain('address');
  await page.getByRole('button', { name: 'Close leaderboard' }).click(); await page.keyboard.press('Escape');
  await page.reload(); await page.waitForFunction(() => window.__launchboard?.getState().screen === 'attract');
  await page.keyboard.press('Enter'); await page.getByRole('button', { name: 'High scores', exact: true }).click();
  await page.getByRole('button', { name: game.id === 'carbon-sort' ? 'Carbon Sort' : game.id === 'kiln-keeper' ? 'Kiln Keeper' : 'Carbon Rails', exact: true }).click();
  await expect(page.getByText('Pat Example', { exact: true })).toBeVisible();
  expect(posts).toBe(game.id === 'kiln-keeper' ? 2 : 1); expect(errors).toEqual([]);
});
