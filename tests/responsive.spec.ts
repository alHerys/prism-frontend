import { test, expect } from '@playwright/test';

const routes = [
  '/', '/pengadaan', '/pengadaan/proc-terminal',
  '/pengadaan/proc-terminal?tab=hea', '/pengadaan/proc-terminal?tab=harga',
  '/pengadaan/proc-showcase?tab=hea',
  '/pengadaan/proc-showcase?tab=harga',
  '/pengadaan/proc-terminal?tab=riwayat',
  '/pengadaan/proc-terminal/vendor/vendor-nusa',
  '/pengadaan/proc-terminal/review/doc-21',
  '/pengadaan/proc-terminal/review/doc-23',
  '/pengadaan/proc-terminal/review/doc-24',
  '/pengadaan/missing',
  '/pengadaan/proc-terminal/vendor/missing',
  '/pengadaan/proc-terminal/review/missing',
  '/bank', '/riwayat', '/missing-page',
];
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-02T02:00:00Z'));
});
test('every route and tab remains readable without document overflow', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Menyiapkan ruang kerja', { exact: true })).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => innerWidth)).toBe(info.project.use.viewport!.width);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (route === '/bank' || route === '/riwayat') {
      const tabs = await page.getByRole('tab').all();
      for (const tab of tabs) {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
    await page.screenshot({ path: info.outputPath(`route-${routes.indexOf(route)}.png`), fullPage: true, animations: 'disabled' });
  }
  expect(errors).toEqual([]);
});

test('review editing and dirty-exit protection remain usable above the action bar', async ({ page }, info) => {
  await page.goto('/pengadaan/proc-terminal/review/doc-21');
  const input = page.getByLabel('TKDN jasa (%)', { exact: true });
  await input.fill('31');
  await expect(input).toBeFocused();
  await expect.poll(() => input.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const action = document.querySelector('.review-action')!.getBoundingClientRect();
    return bounds.top >= 0 && bounds.bottom <= action.top;
  })).toBe(true);
  await expect(page.getByRole('button', { name: 'Konfirmasi data', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Kembali ke pengadaan', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Perubahan belum disimpan' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(input).toHaveValue('31');
  await expect(page.getByText('Dikoreksi', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Konfirmasi data', exact: true })).toBeEnabled();
  const notificationClose = page.getByRole('button', { name: 'Tutup pemberitahuan', exact: true });
  if (await notificationClose.count()) await notificationClose.click();
  await input.focus();
  await page.evaluate(() => document.fonts.ready);
  // A viewport capture represents the fixed footer accurately; full-page capture
  // would place it at an artificial position in the long source/editor document.
  await page.screenshot({ path: info.outputPath('review-correction.png'), animations: 'disabled', mask: [page.locator('iframe')] });
});
test('navigation, search and creation dialog preserve focus at breakpoint boundaries', async ({ page }, info) => {
  await page.goto('/');
  if (info.project.use.viewport!.width < 1024) {
    const trigger = page.getByRole('button', { name: 'Buka navigasi', exact: true });
    await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Navigasi ruang kerja' });
    await expect(drawer).toBeVisible();
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press('Tab');
      expect(await drawer.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await drawer.getByRole('link', { name: 'Bank Data OE', exact: true }).click();
    await expect(page).toHaveURL(/\/bank$/);
    await expect(drawer).toHaveCount(0);
  } else {
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buka navigasi' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Ringkas navigasi' }).click();
    await expect(page.getByRole('button', { name: 'Perluas navigasi' })).toHaveAttribute('aria-expanded', 'false');
  }
  await page.goto('/');
  await page.getByRole('search').getByRole('textbox').fill('Terminal');
  await page.getByRole('search').getByRole('textbox').press('Enter');
  await expect(page).toHaveURL(/\/pengadaan\?cari=Terminal$/);
  await page.getByRole('button', { name: 'Tambah pengadaan', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah pengadaan', exact: true });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tambah pengadaan', exact: true })).toBeFocused();
});
