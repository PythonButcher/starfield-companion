import { test, expect } from '@playwright/test';

// Artificial browser fixtures; real save bytes and private metadata are not committed.
const snapshot = {
  extracted_at: '2026-10-14T12:00:00Z',
  player: { name: 'Test Explorer', level: 74, location: 'Test Ship', playtime: '1d.2h.3m.1 day.2 hours.3 minutes', experience: 12.5, experience_required: 200 },
  save: { saved_at: '2026-10-14T11:59:00Z', current_game_version: '1.16.244.0', created_game_version: '1.15.222.0', format_version: 153 },
  source: { filename: 'test-copy-with-a-long-filename-for-mobile-layout.sfs' },
  plugins: { full: [{ name: 'Test.esm' }], light: [], medium: [] },
};

function connection(status = 'ready', data = snapshot) {
  return { status, snapshot: data, checked_at: '2026-10-14T12:00:00Z', error: status === 'stale' || status === 'unavailable' ? { code: 'truncated_save', message: 'The copied save is incomplete.' } : null };
}

test('copied save appears, refreshes on demand and labels a failed refresh', async ({ page }) => {
  let result = connection();
  let reads = 0;
  await page.route('**/api/playthrough', async (route) => {
    reads += 1;
    await route.fulfill({ json: result });
  });
  await page.goto('/');
  const panel = page.getByRole('region', { name: 'Current playthrough' });
  await expect(panel).toContainText('Test Explorer');
  await expect(panel).toContainText('74');
  await expect(panel).toContainText('Test Ship');
  await expect(panel).toContainText('1 day 2 hours 3 minutes');
  await expect(panel).toContainText('Read from your copied save');
  await expect(panel).toContainText('App notes and plans are kept separately');
  const beforeRefresh = reads; // React StrictMode can read twice during mount.
  result = connection('ready', { ...snapshot, player: { ...snapshot.player, level: 75 } });
  await panel.getByRole('button', { name: 'Refresh save', exact: true }).click();
  await expect(panel.locator('dd').nth(1)).toHaveText('75');
  expect(reads).toBe(beforeRefresh + 1);
  const stableReads = reads;
  await page.waitForTimeout(1200);
  expect(reads).toBe(stableReads); // No background save polling in this slice.
  result = connection('stale', result.snapshot);
  await panel.getByRole('button', { name: 'Refresh save', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('may be out of date');
  await expect(panel).toContainText('Last successful reading');
  await expect(panel.locator('dd').nth(1)).toHaveText('75');
  result = connection();
  await page.getByRole('button', { name: 'Refresh terminal', exact: true }).click();
  await expect(panel).toContainText('Read from your copied save');
  await expect(panel.getByRole('alert')).toHaveCount(0);
  await panel.getByText('Save details and plugins', { exact: true }).click();
  await expect(panel).toContainText('Test.esm');
  await page.screenshot({ path: 'test-results/playthrough-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/playthrough-mobile.png', fullPage: true });
});

test('connection setup and unreadable saves show clear states and recover', async ({ page }) => {
  let result = connection('not_configured', null);
  await page.route('**/api/playthrough', (route) => route.fulfill({ json: result }));
  await page.goto('/');
  const panel = page.getByRole('region', { name: 'Current playthrough' });
  await expect(panel).toContainText('Save folder not connected');
  result = connection('unavailable', null);
  await panel.getByRole('button', { name: 'Refresh save', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('No copied save could be read');
  result = connection();
  await panel.getByRole('button', { name: 'Refresh save', exact: true }).click();
  await expect(panel).toContainText('Test Explorer');
  await expect(panel.getByRole('alert')).toHaveCount(0);
});
