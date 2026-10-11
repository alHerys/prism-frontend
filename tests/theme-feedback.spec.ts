import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
async function ready(page: Page, route: string) {
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Menyiapkan ruang kerja', { exact: true })).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-10-02T02:00:00Z')); });
test('Ocean defaults without replacing an explicitly saved Forest selection', async ({ page }, info) => {
  await ready(page, '/pengaturan');
  await expect(page.locator('html')).toHaveAttribute('data-workspace-accent', 'ocean');
  await page.getByRole('tab', { name: 'Tampilan', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Ocean', exact: true })).toBeChecked();
  await page.locator('.settings-swatch-option').filter({ hasText: 'Forest' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-workspace-accent', 'forest');
  await page.getByRole('tab', { name: 'Tampilan', exact: true }).click();
  await page.locator('.settings-swatch-option').filter({ hasText: 'Ocean' }).click();
  await ready(page, '/');
  if (info.project.use.viewport!.width < 1024) await page.getByRole('button', { name: 'Buka navigasi', exact: true }).click();
  const link = page.getByRole('navigation', { name: 'Navigasi utama', exact: true }).getByRole('link', { name: 'Pengadaan', exact: true });
  // Compare the actual drawn path with the existing Folder dashboard icon, not a class name.
  expect(await link.locator('svg path').getAttribute('d')).toBe(await page.locator('.dashboard-procurement-icon svg path').first().getAttribute('d'));
  await link.click(); await expect(page).toHaveURL(/\/pengadaan$/);
});
test('every route follows all four accents while semantic badges remain fixed', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  let statuses: unknown;
  for (const accent of ['Ocean', 'Forest', 'Plum', 'Ember']) {
    await ready(page, '/pengaturan');
    await page.getByRole('tab', { name: 'Tampilan', exact: true }).click();
    await page.locator('.settings-swatch-option').filter({ hasText: accent }).click();
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const color = (name: string) => { const probe = document.createElement('span'); probe.style.color = style.getPropertyValue(name); document.body.append(probe); const value = getComputedStyle(probe).color; probe.remove(); return value; };
      return { bright: color('--accent-bright'), deep: color('--accent-deep'), soft: color('--accent-soft'), wash: color('--accent-wash'), border: color('--accent-border') };
    });
    await ready(page, '/');
    const gradient = await page.locator('.dashboard-metric-featured').evaluate(e => getComputedStyle(e).backgroundImage);
    expect(gradient).toContain(tokens.bright); expect(gradient).toContain(tokens.deep);
    await expect(page.locator('.dashboard-procurement-icon').first()).toHaveCSS('background-color', tokens.soft);
    await expect(page.locator('.dashboard-activity-icon').first()).toHaveCSS('background-color', tokens.soft);
    await expect(page.locator('.dashboard-metric-featured .dashboard-metric-open')).toHaveCSS('color', tokens.deep);
    await page.screenshot({ path: info.outputPath(`${accent.toLowerCase()}-dashboard.png`), fullPage: true, animations: 'disabled' });
    await ready(page, '/pengadaan');
    await expect(page.locator('.procurement-folder').first()).toHaveCSS('background-color', tokens.wash);
    await expect(page.locator('.page-number')).toHaveCSS('background-color', tokens.soft);
    const nextStatuses = await page.locator('.badge.success,.badge.warning').evaluateAll(es => es.map(e => [e.textContent, getComputedStyle(e).color, getComputedStyle(e).backgroundColor]));
    if (!statuses) statuses = nextStatuses; else expect(nextStatuses).toEqual(statuses);
    await page.locator('.procurement-filter-trigger').click();
    await expect(page.locator('.procurement-filter-trigger')).toHaveCSS('background-color', tokens.soft);
    for (const label of await page.locator('.procurement-filter-menu label:has(input:checked)').all()) await expect(label).toHaveCSS('background-color', tokens.soft);
    await page.keyboard.press('Escape');
    for (const route of ['/pengadaan/proc-showcase?tab=hea', '/pengadaan/proc-showcase?tab=harga', '/pengadaan/proc-terminal?tab=riwayat', '/pengadaan/proc-terminal/vendor/vendor-nusa', '/pengadaan/proc-terminal/review/doc-21', '/bank', '/riwayat', '/pengaturan', '/bantuan']) {
      await ready(page, route);
      await expect(page.locator('html')).toHaveAttribute('data-workspace-accent', accent.toLowerCase());
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const zone of await page.locator('.fernly-upload .upload-zone,.bank-dropzone').all()) await expect(zone).toHaveCSS('border-color', tokens.border);
      if (route === '/bank' || route === '/riwayat') {
        for (const tab of await page.getByRole('tab').all()) {
          await tab.click(); await expect(tab).toHaveAttribute('aria-selected', 'true');
          for (const primary of await page.locator('.bank-overview-primary').all()) {
            expect(await primary.evaluate(e => getComputedStyle(e).backgroundImage)).toContain(tokens.deep);
          }
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      }
    }
  }
  expect(errors).toEqual([]);
});
