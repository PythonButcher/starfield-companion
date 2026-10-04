import { test, expect } from '@playwright/test';

test('five workspaces open with a living starter profile and no browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await expect(nav.locator('.nav-links > a')).toHaveText([
    'Command Hub', 'Galaxy & Surveys', 'Logistics & Industry', 'Fleet & Crew', 'Logbook & Archives',
  ]);
  await expect(page.getByRole('heading', { name: 'The Frontier', exact: true })).toBeVisible();
  await expect(page.getByText('Vectera / Narion', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'One Small Step', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/run2-command-hub.png', fullPage: true });
  await page.getByRole('link', { name: '+ New Mission', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  for (const [label, title] of [['Fleet & Crew', 'Fleet & Crew'], ['Logbook & Archives', 'Captain’s Logs'],
    ['Logistics & Industry', 'Outpost Planner'], ['Galaxy & Surveys', 'Galaxy & Surveys']]) {
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
  }
  await expect(page.getByRole('button', { name: '+ New planet' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('system selection connects planets, survey gaps, outposts and mission records', async ({ page }) => {
  await page.goto('/galaxy');
  await page.getByRole('combobox', { name: 'System search' }).fill('Narion');
  await page.getByRole('option', { name: /^Narion / }).click();
  const inspector = page.getByRole('region', { name: 'Narion system inspector' });
  await expect(inspector.getByRole('link', { name: /Vectera/ })).toBeVisible();
  await expect(inspector.getByRole('link', { name: /Survey the Narion System/ })).toBeVisible();
  await inspector.getByRole('link', { name: /Vectera/ }).click();
  await expect(page.getByRole('dialog')).toContainText('100%');
  await expect(page.getByRole('heading', { name: 'Survey gap breakdown' })).toBeVisible();
  await page.getByRole('link', { name: 'Launch Expedition Log', exact: true }).click();
  await expect(page.getByLabel('Planet', { exact: true })).toHaveValue('Vectera');
  await expect(page.getByLabel('System', { exact: true })).toHaveValue('Narion');
  await page.goto('/galaxy?system=Sol');
  const sol = page.getByRole('region', { name: 'Sol system inspector' });
  await expect(sol).toContainText('19');
  await expect(sol.locator('.level-safe')).toContainText('Level 1');
  await sol.getByRole('link', { name: /Luna Extraction Post/ }).click();
  await expect(page.getByLabel('Outpost name')).toHaveValue('Luna Extraction Post');
  await expect(page.getByText('3 net power', { exact: true })).toBeVisible();
  // The sample 2/3 solar calibration must survive native number-field validation.
  const saved = page.waitForResponse((response) => response.url().includes('/api/outposts/') && response.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Save Plan', exact: true }).click();
  expect((await saved).status()).toBe(200);
  await page.goto('/galaxy?system=Alpha%20Centauri');
  await page.getByRole('region', { name: 'Alpha Centauri system inspector' }).getByRole('link', { name: /^Jemison / }).click();
  await expect(page.getByRole('dialog')).toContainText('65%');
  await expect(page.locator('.survey-counters')).toContainText('3 / 8');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('region', { name: 'Alpha Centauri system inspector' }).getByRole('link', { name: /^Jemison / }).click();
  await expect(page.getByRole('dialog')).toContainText('65%');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.screenshot({ path: 'test-results/run2-galaxy.png', fullPage: true });
});

test('legacy routes retain query strings and anchors', async ({ page }) => {
  for (const [oldPath, newPath] of [
    ['/planet-pulse?resource=Iron', '/galaxy?resource=Iron'], ['/surveys?system=Narion', '/galaxy/surveys?system=Narion'],
    ['/outposts?planet_id=3', '/logistics/outposts?planet_id=3'], ['/portfolio', '/logistics/portfolio'],
    ['/crafting', '/logistics/crafting'], ['/ram', '/logistics/crafting/research'],
    ['/missions#mission-1', '/journal/missions#mission-1'], ['/media', '/journal/media'], ['/radar', '/'],
  ]) {
    await page.goto(oldPath);
    await expect(page).toHaveURL('http://127.0.0.1:5174' + newPath);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('untouched planner is quiet, validation follows submission, and mobile galaxy fits', async ({ page }) => {
  const invalid = [];
  page.on('response', (response) => { if (response.status() >= 400) invalid.push(response.url()); });
  await page.goto('/logistics/outposts');
  await expect(page.getByText('Name your outpost to begin power calibration.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save Plan', exact: true }).click();
  await expect(page.getByLabel('Outpost name')).toBeFocused();
  expect(invalid).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/galaxy?system=Narion');
  await expect(page.getByRole('region', { name: 'Narion system inspector' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/run2-galaxy-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Drive-By +' }).click();
  await expect(page.getByRole('heading', { name: 'Quick actions', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Quick actions', exact: true })).toHaveCount(0);
});

test('starter settings require an explicit confirmation and allow cancellation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Constellation starter settings' }).click();
  await expect(page.getByRole('button', { name: 'Clear starter records', exact: true })).toBeDisabled();
  await page.getByLabel('Type CLEAR STARTER to confirm').fill('CLEAR STARTER');
  await expect(page.getByRole('button', { name: 'Clear starter records', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('heading', { name: 'The Frontier', exact: true })).toBeVisible();
});
