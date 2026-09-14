import { test, expect, devices, type Page } from '@playwright/test';
import './hooks';

test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium' });

async function swipe(page: Page, from: [number, number], to: [number, number], cancel = false) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1], id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: to[0], y: to[1], id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

async function home(page: Page) {
  await page.goto('/?e2e&beaver');
  await expect(page.getByRole('button', { name: 'TOUCH TO PLAY' })).toBeVisible();
  await page.getByRole('button', { name: 'TOUCH TO PLAY' }).tap();
  await expect(page.locator('.phone-game')).toHaveCount(6);
}
async function launch(page: Page, title: string) {
  await home(page);
  await page.locator('.phone-game').filter({ hasText: title }).tap();
  await expect(page.getByRole('dialog', { name: 'Turn your phone sideways' })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('dialog', { name: 'Turn your phone sideways' })).toBeHidden();
}
test('portrait picker, high scores, sound, and five-minute reset fit the phone', async ({ page }) => {
  await home(page);
  await page.screenshot({ path: 'test-results/phone-picker.png' });
  await page.getByRole('button', { name: 'High scores', exact: true }).tap();
  await expect(page.getByRole('dialog', { name: 'High scores.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close leaderboard' }).tap();
  await page.getByRole('button', { name: 'Sound settings' }).tap();
  await expect(page.getByRole('dialog', { name: 'Sound settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Close sound settings' }).tap();
  await page.evaluate(() => window.__launchboard!.getState().markInput(performance.now() - 300001));
  await expect(page.getByRole('button', { name: 'TOUCH TO PLAY' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/phone-welcome.png' });
});
test('beaver gesture hopping, portrait hold, and idle exit', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await launch(page, 'Beaver Crossing');
  await page.getByRole('button', { name: 'Start crossing', exact: true }).tap();
  await swipe(page, [500, 240], [500, 170]);
  await expect.poll(() => page.evaluate(() => window.__beaver!.getState().row)).toBe(1);
  await page.screenshot({ path: 'test-results/phone-beaver.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('dialog', { name: 'Turn your phone sideways' })).toBeVisible();
  const before = await page.evaluate(() => window.__beaver!.getState().time);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__beaver!.getState().time)).toBe(before);
  await page.evaluate(() => window.__launchboard!.getState().markInput(performance.now() - 300001));
  await expect(page.getByRole('button', { name: 'TOUCH TO PLAY' })).toBeVisible();
  await expect(page.locator('[data-phone-hud]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('carbon sort gesture movement, rotation, drop, and pause', async ({ page }) => {
  await launch(page, 'Carbon Sort');
  await page.getByRole('button', { name: 'Start sorting', exact: true }).tap();
  const x = await page.evaluate(() => window.__carbonSort!.getState().active!.x);
  await expect(page.getByRole('button', { name: 'Left', exact: true })).toBeHidden();
  await swipe(page, [500, 210], [440, 210]);
  expect(await page.evaluate(() => window.__carbonSort!.getState().active!.x)).toBe(x - 1);
  const direction = await page.evaluate(() => window.__carbonSort!.getState().active!.direction);
  await page.touchscreen.tap(500, 210);
  expect(await page.evaluate(() => window.__carbonSort!.getState().active!.direction)).not.toBe(direction);
  await swipe(page, [500, 170], [500, 250]);
  await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  const heldTime = await page.evaluate(() => window.__carbonSort!.getState().fallTimer);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__carbonSort!.getState().fallTimer)).toBe(heldTime);
  await page.getByRole('button', { name: 'Pause', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Resume sorting' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume sorting' }).tap();
  await page.screenshot({ path: 'test-results/phone-sort.png' });
});
test('kiln phone gestures control the actual conveyor', async ({ page }) => {
  await launch(page, 'Kiln Keeper');
  await page.getByRole('button', { name: 'Start the conveyor', exact: true }).tap();
  await expect(page.getByRole('slider', { name: 'Conveyor speed' })).toBeHidden();
  await swipe(page, [500, 210], [830, 210]);
  await expect.poll(() => page.evaluate(() => window.__kilnKeeper!.getState().feed)).toBeGreaterThan(.98);
  await swipe(page, [500, 210], [1, 210]);
  await expect.poll(() => page.evaluate(() => window.__kilnKeeper!.getState().feed)).toBeLessThan(.01);
  const fed = await page.evaluate(() => window.__kilnKeeper!.getState().fed);
  await swipe(page, [500, 210], [500, 210], true);
  expect(await page.evaluate(() => window.__kilnKeeper!.getState().fed)).toBe(fed);
  await page.touchscreen.tap(500, 210);
  await expect.poll(() => page.evaluate(() => window.__kilnKeeper!.getState().fed)).toBeGreaterThan(fed);
  await page.screenshot({ path: 'test-results/phone-kiln.png' });
});
test('rail globe keeps readable ticket, route, card and payment controls', async ({ page, context }) => {
  await launch(page, 'Carbon Rails');
  await page.getByRole('button', { name: 'Choose your first tickets', exact: true }).tap();
  await expect(page.getByRole('checkbox')).toHaveCount(3);
  await page.getByRole('checkbox').first().uncheck();
  await page.getByRole('button', { name: 'Confirm destinations', exact: true }).tap();
  await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Routes & cards', exact: true }).tap();
  await page.getByRole('combobox', { name: 'Region', exact: true }).selectOption('1');
  await expect(page.getByRole('combobox', { name: 'Railway', exact: true })).toHaveValue('12');
  await page.screenshot({ path: 'test-results/phone-rails.png' });
  const cards = await page.evaluate(() => window.__carbonRails!.getState().players[0].hand.length);
  await page.getByRole('button', { name: 'Draw from deck', exact: true }).tap();
  expect(await page.evaluate(() => window.__carbonRails!.getState().players[0].hand.length)).toBe(cards + 1);
  const deck = await page.getByRole('button', { name: 'Draw from deck', exact: true }).boundingBox();
  const cdp = await context.newCDPSession(page);
  const touch = { x: deck!.x + deck!.width / 2, y: deck!.y + deck!.height / 2, id: 1 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...touch, y: touch.y - 80 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await page.evaluate(() => window.__carbonRails!.getState().players[0].hand.length)).toBe(cards + 1);
});
test('Convention Hall scanner and simultaneous touch controls fit a small iPhone', async ({ page, context }) => {
  await launch(page, 'Convention Hall');
  await page.setViewportSize({ width: 667, height: 375 });
  await page.getByRole('button', { name: 'Enter the hall', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Scan', exact: true })).toBeHidden();
  await page.touchscreen.tap(500, 200);
  await expect.poll(() => page.evaluate(() => window.__conventionHall!.getState().found)).toBe(1);
  const cdp = await context.newCDPSession(page);
  const before = await page.evaluate(() => window.__conventionHall!.getState().z);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 230, id: 1 }, { x: 350, y: 180, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150, y: 170, id: 1 }, { x: 380, y: 180, id: 2 }] });
  await expect.poll(() => page.evaluate(() => window.__conventionHall!.getState().z)).toBeLessThan(before);
  expect(await page.evaluate(() => window.__conventionHall!.getState().yaw)).toBeGreaterThan(0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Resume exploring' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume exploring' }).tap();
  await page.screenshot({ path: 'test-results/phone-hall.png' });
});
test('Jumper simultaneous move and jump, release and orientation pause', async ({ page, context }) => {
  await launch(page, 'Jumper 3');
  await page.setViewportSize({ width: 667, height: 375 });
  await page.getByRole('button', { name: 'Start chapter', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Jump', exact: true })).toBeHidden();
  const cdp = await context.newCDPSession(page);
  const before = await page.evaluate(() => window.__jumper3!.getState().x);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 230, y: 230, id: 1 }, { x: 500, y: 230, id: 2 }] });
  await expect.poll(() => page.evaluate(() => window.__jumper3!.getState().x)).toBeGreaterThan(before);
  expect(await page.evaluate(() => window.__jumper3!.getState().y)).toBeGreaterThan(0);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.evaluate(() => window.__jumper3!.setState({ power: 'spark', fireCooldown: 0 }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 500, y: 240, id: 3 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 500, y: 170, id: 3 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.__jumper3!.getState().shots.filter(s => !s.evil).length)).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/phone-jumper.png' });
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.getByRole('dialog', { name: 'Turn your phone sideways' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__jumper3!.getState().paused)).toBe(true);
});

test('phone result submits a named score and keeps it after reload', async ({ page }) => {
  await page.route('https://formspree.io/f/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await launch(page, 'Carbon Sort');
  await page.getByRole('button', { name: 'Start sorting', exact: true }).tap();
  await page.evaluate(() => window.__carbonSort!.setState({ phase: 'won', score: 7654 }));
  await page.getByRole('button', { name: 'Save score / Leaderboard', exact: true }).tap();
  await page.setViewportSize({ width: 390, height: 664 });
  await page.getByLabel('First name', { exact: true }).fill('Jamie');
  await page.getByLabel('Last name', { exact: true }).fill('Rail');
  await page.getByRole('button', { name: 'Submit my score' }).tap();
  await expect(page.getByRole('heading', { name: 'Score saved.' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'TOUCH TO PLAY' }).tap();
  await page.getByRole('button', { name: 'High scores', exact: true }).tap();
  await page.getByRole('button', { name: 'Carbon Sort', exact: true }).tap();
  await expect(page.locator('.score-list')).toContainText('Jamie Rail');
  await expect(page.locator('.score-list')).toContainText('7,654');
});


test('all six games launch in succession using the same mobile graphics canvas', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await home(page);
  await page.setViewportSize({ width: 844, height: 390 });
  const canvas = await page.locator('canvas').elementHandle();
  for (const [name, start] of [['Beaver Crossing', 'Start crossing'], ['Carbon Sort', 'Start sorting'], ['Kiln Keeper', 'Start the conveyor'], ['Carbon Rails', 'Choose your first tickets'], ['Convention Hall', 'Enter the hall'], ['Jumper 3', 'Start chapter'], ['Carbon Sort', 'Start sorting']]) {
    await page.locator('.phone-game').filter({ hasText: name }).tap();
    await expect(page.getByRole('button', { name: start, exact: true })).toBeVisible();
    await page.getByRole('button', { name: start, exact: true }).tap();
    if (name === 'Carbon Rails') await page.getByRole('button', { name: 'Confirm destinations' }).tap();
    await page.getByRole('button', { name: name === 'Carbon Rails' ? 'Routes & cards' : 'Menu', exact: true }).tap();
    await page.getByRole('button', { name: name === 'Convention Hall' || name === 'Jumper 3' ? 'Launchboard' : 'Exit to games', exact: true }).tap();
    await expect(page.locator('.phone-game')).toHaveCount(6);
    expect(await canvas!.evaluate(node => node.isConnected)).toBe(true);
    expect(await page.evaluate(() => window.__launchboard!.getState().contextLost)).toBe(false);
  }
  expect(errors).toEqual([]);
});
