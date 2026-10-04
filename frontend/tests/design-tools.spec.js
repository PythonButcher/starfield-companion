import { test, expect } from '@playwright/test';

test('cargo corridor supports dragging, persistence, fuel diagnosis and route repair', async ({ page, request }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/logistics/supply-network');
  await expect(page.getByRole('heading', { name: '2 / 2 routes supplied' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const node = page.getByRole('button', { name: 'Outpost node Luna Supply Depot', exact: true });
  const before = await node.getAttribute('transform');
  await node.scrollIntoViewIfNeeded();
  const box = await node.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 45, box.y + box.height / 2 + 35, { steps: 6 });
  await page.mouse.up();
  await expect(node).not.toHaveAttribute('transform', before);
  const placed = await node.getAttribute('transform');
  await page.getByLabel('Network name', { exact: true }).fill('Browser cargo corridor');
  const created = page.waitForResponse((r) => r.url().endsWith('/api/supply-networks') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save network', exact: true }).click();
  const network = await (await created).json();
  await expect(page).toHaveURL(new RegExp(`id=${network.id}`));
  await page.reload();
  await expect(page.getByLabel('Network name')).toHaveValue('Browser cargo corridor');
  await expect(node).toHaveAttribute('transform', placed);
  await page.locator('.route-select').first().click();
  await page.getByRole('button', { name: 'Edit route', exact: true }).click();
  await page.getByLabel('Measured fuel use / min').fill('10');
  await page.getByRole('button', { name: 'Apply route' }).click();
  await expect(page.getByRole('region', { name: 'Network inspector' })).toContainText('Fuel shortage');
  await expect(page.getByRole('heading', { name: '0 / 2 routes supplied' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit route', exact: true }).click();
  await page.getByLabel('Measured fuel use / min').fill('0.5');
  await page.getByRole('button', { name: 'Apply route' }).click();
  await expect(page.getByRole('heading', { name: '2 / 2 routes supplied' })).toBeVisible();
  await page.screenshot({ path: 'test-results/run2-cargo-network.png', fullPage: true });
  expect(errors).toEqual([]);
  await request.delete(`/api/supply-networks/${network.id}`);
});

test('cargo sites can be placed and connected without pointer gestures', async ({ page }) => {
  await page.goto('/logistics/supply-network');
  await page.getByRole('button', { name: 'New network', exact: true }).click();
  for (const [name, system] of [['Fuel reserve', 'Sol'], ['Receiver', 'Narion']]) {
    await page.getByRole('button', { name: '+ Place outpost', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByLabel('Site name', { exact: true }).fill(name);
    await page.getByLabel('Star system', { exact: true }).fill(system);
    if (name === 'Fuel reserve') {
      await page.getByRole('button', { name: 'Add resource', exact: true }).click();
      await page.getByLabel('Resource 1', { exact: true }).fill('Helium-3');
      await page.getByLabel('Units/min 1', { exact: true }).fill('3');
    }
    await page.getByRole('button', { name: 'Place site', exact: true }).click();
  }
  await page.getByRole('button', { name: '+ Draw cargo link', exact: true }).click();
  await page.getByRole('button', { name: 'Add resource', exact: true }).click();
  await page.getByLabel('Resource 1', { exact: true }).fill('Helium-3');
  await page.getByLabel('Units/min 1', { exact: true }).fill('1');
  await page.getByLabel('Measured fuel use / min').fill('0.5');
  await page.getByRole('button', { name: 'Apply route', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1 / 1 routes supplied' })).toBeVisible();
  const receiver = page.getByRole('button', { name: 'Outpost node Receiver', exact: true });
  await receiver.focus(); await receiver.press('Enter');
  const before = await receiver.getAttribute('transform'); await receiver.press('ArrowDown');
  await expect(receiver).not.toHaveAttribute('transform', before);
  await page.getByRole('button', { name: 'Remove site', exact: true }).click();
  await expect(page.locator('.route-select')).toContainText('broken');
  await page.getByRole('button', { name: 'Undo edit', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1 / 1 routes supplied' })).toBeVisible();
});

test('Ship Forge saves module snapshots, compares refits and persists custom measurements', async ({ page, request }) => {
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/crew/blueprints');
  await expect(page.getByTestId('ship-stat-mass').locator('strong')).not.toHaveText('—');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Blueprint name', { exact: true }).fill('Browser survey cutter');
  const saved = page.waitForResponse((r) => r.url().endsWith('/api/ship-blueprints') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save blueprint', exact: true }).click();
  const baseline = await (await saved).json();
  await expect(page).toHaveURL(new RegExp(`id=${baseline.id}`));
  await page.getByRole('combobox', { name: 'Catalog category', exact: true }).selectOption('Structural');
  await page.getByRole('button', { name: '+ Custom module', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByLabel('Module name', { exact: true }).fill('Dense structural frame');
  await page.getByLabel('Mass', { exact: true }).fill('1000');
  await page.getByLabel('Hull health', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Apply module', exact: true }).click();
  await page.getByLabel('Compare with saved blueprint').selectOption(String(baseline.id));
  await expect(page.getByTestId('ship-stat-mass')).toContainText('+1,000 vs Browser survey cutter');
  await page.getByLabel('Blueprint name', { exact: true }).fill('Browser heavy refit');
  const copied = page.waitForResponse((r) => r.url().endsWith('/api/ship-blueprints') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save a copy', exact: true }).click();
  const refit = await (await copied).json();
  expect(refit.analysis.stats.mass).toBe(baseline.analysis.stats.mass + 1000);
  expect(refit.analysis.stats.jump_range).toBeLessThan(baseline.analysis.stats.jump_range);
  await expect(page).toHaveURL(new RegExp(`id=${refit.id}`));
  await page.reload();
  await expect(page.getByLabel('Blueprint name')).toHaveValue('Browser heavy refit');
  await expect(page.getByRole('heading', { name: 'Dense structural frame', exact: true })).toBeVisible();
  await page.getByLabel('Compare with saved blueprint').selectOption(String(baseline.id));
  await expect(page.getByTestId('ship-stat-mass')).toContainText('+1,000');
  await page.screenshot({ path: 'test-results/run2-ship-forge.png', fullPage: true });
  await page.getByText('Assumptions, provenance & blueprint notes', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export blueprint JSON' }).click();
  const exported = await download;
  expect(exported.suggestedFilename()).toBe('ship-blueprint.json');
  expect(await exported.failure()).toBeNull();
  expect(errors).toEqual([]);
  await request.delete(`/api/ship-blueprints/${baseline.id}`); await request.delete(`/api/ship-blueprints/${refit.id}`);
});

test('design tools recover from analysis failures and fit a mobile viewport', async ({ page }) => {
  await page.route('**/api/ship-blueprints/analyze', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Design service offline' } }) }));
  await page.goto('/crew/blueprints');
  await expect(page.getByRole('alert')).toContainText('Design service offline');
  await page.unroute('**/api/ship-blueprints/analyze');
  await page.getByRole('button', { name: 'Retry connection' }).click();
  await expect(page.getByTestId('ship-stat-mass')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, artifact] of [['/crew/blueprints', 'ship-forge'], ['/logistics/supply-network', 'cargo-network']]) {
    await page.goto(path);
    await expect(page.locator('.tool-intro')).toBeVisible();
    if (artifact === 'ship-forge') await expect(page.getByTestId('ship-stat-mass')).toBeVisible();
    else await expect(page.getByRole('heading', { name: '2 / 2 routes supplied' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/run2-${artifact}-mobile.png`, fullPage: true });
  }
});
