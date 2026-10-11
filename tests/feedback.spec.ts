import { test, expect } from '@playwright/test';

test('history summary sticks beside activity, returns on upward scroll and stays readable on short screens', async ({ page }, info) => {
  await page.goto('/riwayat');
  const summary = page.getByRole('complementary', { name: 'Ringkasan aktivitas terfilter', exact: true });
  await expect(summary).toBeVisible();
  const initial = await summary.boundingBox();
  if (info.project.use.viewport!.width >= 1024) {
    await page.evaluate(y => window.scrollTo(0, y), initial!.y + 150);
    await expect.poll(async () => (await summary.boundingBox())!.y).toBe(20);
    await page.screenshot({ path: info.outputPath('history-summary-sticky.png'), animations: 'disabled' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () => Math.abs((await summary.boundingBox())!.y - initial!.y)).toBeLessThan(1);
    await page.setViewportSize({ width: info.project.use.viewport!.width, height: 320 });
    await summary.scrollIntoViewIfNeeded();
    expect((await summary.boundingBox())!.height).toBeLessThanOrEqual(280);
    await summary.locator('.history-context p').scrollIntoViewIfNeeded();
    await expect(summary.locator('.history-context p')).toBeInViewport();
  } else {
    await expect(summary).toHaveCSS('position', 'static');
    await summary.scrollIntoViewIfNeeded();
    await expect(summary.locator('.history-context p')).toBeInViewport();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('textbox', { name: 'Cari aktivitas atau hasil', exact: true }).fill('Estimasi Pengecatan');
  await expect(summary.locator('dd').first()).toHaveText('1');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-02T02:00:00Z'));
});

test('simplified sidebar and dashboard retain real continuation links', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Lanjutkan pengadaan', exact: true })).toBeVisible();
  await expect(page.locator('.dashboard-distribution, .dashboard-procurements')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Buka riwayat aktivitas' })).toHaveCount(0);
  const narrow = info.project.use.viewport!.width < 1024;
  if (narrow) await page.getByRole('button', { name: 'Buka navigasi' }).click();
  const navigation = narrow ? page.getByRole('dialog', { name: 'Navigasi ruang kerja' }) : page.locator('.sidebar');
  await expect(navigation.locator('.nav-caption')).toHaveCount(0);
  await expect(navigation.getByText('Regional Kalimantan', { exact: true })).toBeVisible();
  await expect(navigation.locator('.sidebar-foot img')).toHaveCount(0);
  await expect(navigation.getByText('PT Pertamina Patra Niaga', { exact: true })).toBeVisible();
  await expect(navigation.locator('.sidebar-continuation')).toHaveCount(0);
  if (narrow) await page.keyboard.press('Escape');
  else {
    const offset = await navigation.evaluate(element => {
      const sidebar = element.getBoundingClientRect();
      const logo = element.querySelector('.logo-full')!.getBoundingClientRect();
      return Math.abs(logo.x + logo.width / 2 - sidebar.x - sidebar.width / 2);
    });
    expect(offset).toBeLessThan(2);
    await page.getByRole('button', { name: 'Ringkas navigasi' }).click();
    await expect(navigation.locator('.sidebar-continuation')).toHaveCount(0);
    await page.getByRole('button', { name: 'Perluas navigasi' }).click();
  }
  await page.getByRole('link', { name: 'Lanjutkan Penggantian Jalur Pipa Terminal', exact: true }).click();
  await expect(page).toHaveURL(/\/pengadaan\/proc-terminal$/);
  await expect(page.getByRole('navigation', { name: 'Tahap pengadaan' })).toBeVisible();
});

test('table header sorting and filter menu work with existing procurement data', async ({ page }, info) => {
  await page.goto('/pengadaan');
  const table = page.locator('.procurement-table');
  await expect(table.locator('tbody tr')).toHaveCount(3);
  await expect(page.locator('.table-toolbar').getByRole('combobox')).toHaveCount(0);
  await expect(page.getByText(/^Menampilkan .*pengadaan$/)).toHaveCount(0);
  await table.getByRole('button', { name: 'Vendor', exact: true }).click();
  await expect(table.locator('thead th[aria-sort="ascending"]')).toHaveText('Vendor');
  await expect(table.locator('tbody tr').first().locator('td').nth(1)).toHaveText('0 vendor');
  await table.getByRole('button', { name: 'Vendor', exact: true }).click();
  await expect(table.locator('thead th[aria-sort="descending"]')).toHaveText('Vendor');
  await expect(table.locator('tbody tr').first().locator('td').nth(1)).toHaveText('2 vendor');
  await expect(table.locator('.table-sort svg')).toHaveCount(1);
  await table.getByRole('button', { name: 'Dokumen', exact: true }).click();
  await expect(table.locator('tbody tr').first().locator('td').nth(2)).toHaveText('3 dokumen');
  const trigger = page.getByRole('button', { name: 'Filter dan urutkan pengadaan', exact: true });
  await trigger.click();
  const menu = page.getByRole('dialog', { name: 'Filter dan urutkan pengadaan', exact: true });
  await expect(menu).toBeVisible();
  const bounds = (await menu.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(info.project.use.viewport!.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(info.project.use.viewport!.height);
  await menu.getByRole('radio', { name: 'Perlu ditinjau', exact: true }).check();
  await expect(table.locator('tbody tr')).toHaveCount(1);
  await expect(table.getByRole('link', { name: 'Penggantian Jalur Pipa Terminal', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const search = page.getByRole('textbox', { name: 'Cari pengadaan', exact: true });
  const iconOffset = await search.locator('..').evaluate(element => {
    const box = element.getBoundingClientRect();
    const icon = element.querySelector('svg')!.getBoundingClientRect();
    return Math.abs(box.y + box.height / 2 - icon.y - icon.height / 2);
  });
  expect(iconOffset).toBeLessThan(2);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath('filtered-procurements.png'), animations: 'disabled' });
});

test('Bank and history filters remain functional in their new order', async ({ page }, info) => {
  await page.goto('/bank');
  await page.getByRole('tab', { name: 'Dokumen Historis', exact: true }).click();
  const filters = page.getByRole('region', { name: 'Filter referensi' });
  const bankOrder = await filters.locator('label').evaluateAll(elements => elements.map(element => {
    const first = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    return first?.textContent?.trim() ?? '';
  }));
  expect(bankOrder).toEqual(['Fungsi', 'Periode', '']);
  await expect(filters.locator('.bank-select > svg')).toHaveCount(2);
  await filters.getByRole('combobox', { name: 'Periode', exact: true }).selectOption('2024');
  await expect(page.getByRole('heading', { name: 'Dokumen terpublikasi', exact: true })).toBeVisible();
  await expect(page.locator('.bank-reference-table tbody tr')).toHaveCount(1);
  await expect(page.getByText('Lihat harga satuan dari dokumen OE historis yang sudah dipublikasikan beserta sumbernya.', { exact: true })).toBeVisible();
  await page.goto('/riwayat');
  const historyFilters = page.getByRole('region', { name: 'Filter riwayat' });
  await expect(historyFilters).toBeVisible();
  const order = await historyFilters.locator('label').evaluateAll(elements => elements.map(element => {
    const first = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    return first?.textContent?.trim() ?? '';
  }));
  expect(order).toEqual(['Modul', 'Pengadaan', 'Dari tanggal', 'Sampai tanggal', '']);
  const icons = await page.locator('.history-event .bank-document-icon svg').evaluateAll(elements => elements.map(element => element.innerHTML));
  expect(new Set(icons).size).toBeGreaterThanOrEqual(4);
  await expect(page.locator('.history-context dl > div')).toHaveCount(3);
  await historyFilters.getByRole('textbox', { name: 'Cari aktivitas atau hasil' }).fill('Estimasi Pengecatan');
  await expect(page.locator('.history-event')).toHaveCount(1);
  await expect(page.locator('.history-context dd').first()).toHaveText('1');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath('filtered-history.png'), animations: 'disabled' });
});
