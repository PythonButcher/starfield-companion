import { test, expect } from '@playwright/test';

const save = {
  status: 'ready', checked_at: '2026-10-15T12:00:00Z', error: null,
  snapshot: {
    extracted_at: '2026-10-15T12:00:00Z', source: { filename: 'ui-test.sfs' },
    player: { name: 'Alex Morgan', level: 74, location: 'New Atlantis', playtime: '8d.3h.14m.', experience: 1200, experience_required: 4520 },
    save: { saved_at: '2026-10-15T11:50:00Z', current_game_version: '1.16.244.0', created_game_version: '1.15.222.0', format_version: 153 },
    plugins: { full: [{ name: 'Starfield.esm' }], light: [], medium: [] },
  },
};

async function expectDocumentFits(page) {
  await expect.poll(() => page.evaluate(() => ({
    width: document.documentElement.scrollWidth <= innerWidth,
    height: document.documentElement.scrollHeight <= innerHeight + 1,
  }))).toEqual({ width: true, height: true });
}

test('Command Hub fits desktop windows and the slate supports keyboard selection and log reading', async ({ page }) => {
  await page.route('**/api/playthrough', (route) => route.fulfill({ json: save }));
  await page.goto('/');
  await expect(page.getByText('Alex Morgan', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /^One Small Step/ })).toBeVisible();
  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(size);
    await expectDocumentFits(page);
    await page.screenshot({ path: `test-results/terminal-hub-${size.width}.png`, fullPage: true });
    // The normal save summary and telemetry fit without a second scrollbar.
    await expect.poll(() => page.locator('.command-overview').evaluate((el) => Math.max(0, el.scrollHeight - el.clientHeight - 1))).toBe(0);
    await expect(page.getByRole('navigation', { name: 'Command shortcuts' })).toBeInViewport();
  }
  const resume = page.getByRole('radio', { name: 'Resume', exact: true });
  await resume.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Briefing', exact: true })).toBeChecked();
  await expect(page.getByRole('heading', { name: 'AI Ship Briefing' })).toBeVisible();
  await page.getByRole('radio', { name: 'Logs', exact: true }).check();
  const read = page.getByRole('region', { name: 'Logs slate' }).getByRole('button', { name: /^Read / }).first();
  await read.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(read).toBeFocused();
  await page.getByRole('radio', { name: 'Worlds', exact: true }).check();
  await expect(page.getByRole('region', { name: 'Worlds slate' })).toContainText('100% surveyed');
  await expect(page.getByRole('region', { name: 'Worlds slate' }).getByRole('link', { name: /Vectera/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'Save details and plugins', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Starfield.esm');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Save details and plugins', exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/terminal-hub-mobile.png', fullPage: true });
});

test('long slate content stays accessible without extending the desktop shell', async ({ page }) => {
  await page.route('**/api/playthrough', (route) => route.fulfill({ json: save }));
  await page.route('**/api/briefing', (route) => route.fulfill({ json: { mode: 'mock', briefing: 'An extended ship briefing. '.repeat(300) + 'End of briefing.' } }));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.getByRole('radio', { name: 'Briefing', exact: true }).check();
  const screen = page.getByRole('region', { name: 'Briefing slate' });
  await expect(screen).toContainText('End of briefing.');
  await expectDocumentFits(page);
  await screen.focus();
  await page.keyboard.press('Control+End');
  await expect.poll(() => screen.evaluate((el) => el.scrollTop > 0)).toBe(true);
  await expect(page.getByRole('radio', { name: 'Resume', exact: true })).toBeInViewport();
});

test('other desktop workspaces keep navigation visible and preserve access to long forms', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const path of ['/crew', '/journal', '/journal/missions', '/journal/media', '/logistics/outposts', '/logistics/portfolio', '/logistics/crafting', '/crew/blueprints', '/logistics/supply-network']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.scan-loader')).toHaveCount(0);
    await expectDocumentFits(page);
    await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true })).toBeInViewport();
    if (path === '/logistics/outposts') {
      await page.getByRole('button', { name: 'Save Plan', exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: 'Save Plan', exact: true })).toBeInViewport();
      await expect(page.locator('.section-header')).toBeInViewport();
    }
  }
  await page.goto('/galaxy');
  await expect(page.locator('.terminal-shell')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Galaxy & Surveys', exact: true })).toBeVisible();
});
