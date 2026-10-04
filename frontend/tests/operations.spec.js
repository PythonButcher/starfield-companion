import { test, expect } from '@playwright/test';

test('outpost power planning, export, portfolio and Hub alerts', async ({ page, request }) => {
  await page.goto('/outposts');
  await page.getByLabel('Outpost name').fill('Browser iron base');
  await page.getByLabel('Outpost planet').selectOption({ label: 'Luna' });
  await page.getByLabel('Module catalog').selectOption({ label: 'Extractor - Solid (-5 power)' });
  await page.getByRole('button', { name: 'Add module', exact: true }).click();
  await page.getByRole('combobox', { name: 'Module 1 resource', exact: true }).selectOption('Iron');
  await expect(page.getByText('-5 net power', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Browser iron base', exact: true })).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: 'Fix Browser iron base' }).click();
  await expect(page.getByLabel('Outpost name')).toHaveValue('Browser iron base');
  await page.getByLabel('Module catalog').selectOption({ label: 'Solar Array (6 power)' });
  await page.getByRole('button', { name: 'Add module', exact: true }).click();
  await expect(page.getByText('1 net power', { exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Shopping List' }).click();
  expect((await download).suggestedFilename()).toBe('outpost-shopping-list.txt');
  await page.getByRole('button', { name: 'Save Plan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Browser iron base', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Resource portfolio' }).click();
  await expect(page.locator('.resource-cell.covered')).toContainText(['Iron']);
  const plans = await (await request.get('/api/outposts')).json();
  await request.delete('/api/outposts/' + plans.find((p) => p.name === 'Browser iron base').id);
});

test('crafting resolver consumes inventory and opens resource hunt', async ({ page }) => {
  await page.goto('/crafting');
  await page.getByLabel('Search recipes').fill('Adaptive');
  await page.getByLabel('Target recipe').selectOption('Adaptive Frame');
  await page.getByLabel('Target quantity').fill('3');
  await page.getByRole('button', { name: 'Add inventory material' }).click();
  await page.getByLabel('Inventory material 1', { exact: true }).fill('Iron');
  await page.getByLabel('Inventory count 1', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Resolve materials' }).click();
  await expect(page.getByText('Iron × 1', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Find on Planets' }).last().click();
  await expect(page.getByLabel('Resource filter')).toHaveValue('Iron');
  await expect(page.getByLabel('Target resources (comma separated)')).toHaveValue('Iron');
});

test('missions link logs transactionally and radar resumes them', async ({ page, request }) => {
  await page.goto('/missions');
  await page.getByRole('button', { name: 'New mission', exact: true }).click();
  await page.getByLabel('Mission title').fill('Browser mission');
  await page.getByLabel('Mission priority').selectOption('High');
  await page.getByLabel('Mission target planet').selectOption({ label: 'Jemison' });
  await page.getByLabel('Mission notes (hidden in spoiler-safe mode)').fill('A hidden story detail');
  await page.getByRole('button', { name: 'Add checklist step' }).click();
  await page.getByLabel('Step 1', { exact: true }).fill('Land at the lodge');
  await page.getByRole('button', { name: 'Save mission', exact: true }).click();
  await expect(page.getByText('A hidden story detail')).toHaveCount(0);
  await page.getByLabel('Land at the lodge', { exact: true }).click();
  await expect(page.getByText('1/1 steps complete')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Land at the lodge', { exact: true })).toBeChecked();
  await page.getByRole('link', { name: 'Log Entry for Mission' }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Browser mission');
  await expect(page.getByLabel('Planet', { exact: true })).toHaveValue('Jemison');
  await page.getByRole('button', { name: 'Save log', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Browser mission' })).toBeVisible();
  await page.goto('/radar');
  await expect(page.getByRole('link', { name: 'Browser mission', exact: true })).toBeVisible();
  const missions = await (await request.get('/api/missions')).json();
  const mission = missions.find((m) => m.title === 'Browser mission');
  expect(mission.linked_log_ids).toHaveLength(1);
  await request.delete('/api/logs/' + mission.linked_log_ids[0]);
  await request.delete('/api/missions/' + mission.id);
});

test('survey counters expose gaps and create a prefilled expedition', async ({ page, request }) => {
  const planet = await (await request.post('/api/planets', { data: { name: 'Browser survey', system_name: 'Sol', flora: 4, fauna: 2, planetary_traits: ['Test trait'], resources: ['Iron'] } })).json();
  await page.goto('/surveys');
  await page.getByLabel('Record survey on planet').selectOption(String(planet.id));
  await page.getByRole('button', { name: 'Record counters', exact: true }).click();
  await page.getByLabel('Survey completion percent').fill('80');
  await page.getByLabel('scanned flora', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Save survey counters' }).click();
  await expect(page.getByText('flora: 3 / 4 — 1 remaining', { exact: true })).toBeVisible();
  await page.getByLabel('Completion tier').selectOption('nearly');
  await page.getByRole('link', { name: 'Launch Expedition' }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Survey Browser survey');
  await request.delete('/api/planets/' + planet.id);
});

test('new module errors are recoverable and mobile layout fits', async ({ page }) => {
  await page.route('**/api/portfolio/coverage', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Offline test' } }) }));
  await page.goto('/portfolio');
  await expect(page.getByRole('alert')).toContainText('Offline test');
  await page.unroute('**/api/portfolio/coverage');
  await page.getByRole('button', { name: 'Retry connection' }).click();
  await expect(page.locator('.resource-matrix')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/outposts', '/crafting', '/missions', '/surveys', '/portfolio', '/radar', '/media', '/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await expect(page.getByRole('heading', { name: 'Fleet & outpost status' })).toBeVisible();
  await page.screenshot({ path: 'test-results/hub-mobile.png', fullPage: true });
});
