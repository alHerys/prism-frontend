import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import path from 'node:path';
async function exercise(page: Page, table: Locator) {
  const body = await table.locator('tbody').innerText();
  const buttons = table.locator('th .table-sort');
  for (const button of await buttons.all()) {
    await button.click();
    await expect(button.locator('..').locator('..')).toHaveAttribute('aria-sort', 'ascending');
    await button.click();
    await expect(button.locator('..').locator('..')).toHaveAttribute('aria-sort', 'descending');
  }
  const trigger = table.getByRole('button', { name: /^Filter dan urutkan/ });
  await trigger.click();
  const menu = page.getByRole('dialog', { name: /^Filter dan urutkan/ });
  await expect(menu).toBeVisible();
  const bounds = await menu.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const fields = menu.locator('fieldset');
  if (await fields.count() > 2) {
    await fields.nth(2).getByRole('radio').last().check();
    expect(await table.locator('tbody tr').count()).toBeGreaterThan(0);
    await menu.getByRole('button', { name: 'Reset tabel', exact: true }).click();
  }
  await menu.getByLabel('Cari di tabel').fill('nonexistent-prism-row');
  await expect(table.getByText('Tidak ada baris sesuai filter.')).toBeVisible();
  await menu.getByRole('button', { name: 'Reset tabel', exact: true }).click();
  await expect(table.locator('tbody')).toHaveText(body.replace(/\s+/g, ' ').trim(), { useInnerText: true });
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
}
test.beforeEach(async ({ page }) => { await page.clock.setFixedTime(new Date('2026-10-11T02:00:00Z')); });
test('all production table surfaces expose working sorting and bounded filter menus', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/pengadaan/proc-terminal?tab=dokumen', '/pengadaan/proc-terminal/vendor/vendor-nusa', '/pengadaan/proc-terminal/review/doc-24', '/pengadaan/proc-showcase?tab=hea', '/pengadaan/proc-showcase?tab=harga', '/bank']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.data-table table').first()).toBeVisible();
    for (const table of await page.locator('.data-table table').all()) await exercise(page, table);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.table-wrap,.table-scroll').evaluateAll(elements => elements.forEach(element => { element.scrollLeft = 0; }));
    await page.screenshot({ path: info.outputPath(`route-${encodeURIComponent(route)}.png`), fullPage: true, animations: 'disabled' });
    if (route === '/bank') {
      await page.locator('.data-table-filter-trigger').first().click();
      await page.screenshot({ path: info.outputPath('bank-filter-menu.png'), animations: 'disabled' });
      await page.keyboard.press('Escape');
    }
  }
  await page.goto('/riwayat');
  await page.getByRole('tab', { name: 'Hasil Evaluasi', exact: true }).click();
  await exercise(page, page.getByRole('table', { name: 'Hasil evaluasi tersimpan', exact: true }));
  await page.getByRole('button', { name: 'Lihat hasil', exact: true }).first().click();
  await exercise(page, page.getByRole('table', { name: 'Rincian snapshot', exact: true }));
  await page.getByRole('button', { name: 'Tutup rincian', exact: true }).click();
  await page.getByRole('tab', { name: 'Statistik Aktivitas', exact: true }).click();
  await exercise(page, page.getByRole('table', { name: 'Rincian harian', exact: true }));
  await page.goto('/bank');
  await page.getByRole('button', { name: 'Tambah dokumen historis', exact: true }).click();
  await page.getByLabel('Pilih OE historis').setInputFiles(path.resolve('public/files/OE-Historis-2024.xlsx'));
  await expect(page.getByRole('heading', { name: 'Review dokumen historis', exact: true })).toBeVisible();
  await exercise(page, page.getByRole('table', { name: 'Harga dokumen historis', exact: true }));
  await page.getByRole('tab', { name: 'Dokumen Historis', exact: true }).click();
  await exercise(page, page.getByRole('table', { name: 'Draft dokumen historis', exact: true }));
  expect(errors).toEqual([]);
});
test('sorted and filtered price-pair edits save the correct original item', async ({ page }) => {
  await page.goto('/pengadaan/proc-terminal/review/doc-24');
  const table = page.getByRole('table', { name: 'Pasangan komponen harga', exact: true });
  await table.getByRole('button', { name: 'OE (Rp)', exact: true }).click();
  await table.getByRole('button', { name: /^Filter dan urutkan/ }).click();
  const menu = page.getByRole('dialog');
  await menu.getByLabel('Cari di tabel').fill('Katup');
  await page.keyboard.press('Escape');
  await table.getByLabel('OE Katup gate 4 inci', { exact: true }).fill('870000');
  await page.getByLabel('Kelompok harga yang digunakan').selectOption('Harga satuan material dan jasa');
  await page.getByRole('button', { name: 'Konfirmasi data', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi data', exact: true }).click();
  await expect(page).not.toHaveURL(/\/review\//);
  await page.locator('a[href="/pengadaan/proc-terminal/review/doc-24"]').click();
  await expect(page.getByLabel('OE Katup gate 4 inci', { exact: true })).toHaveValue('870000');
  await expect(page.getByLabel('OE Pipa baja 4 inci', { exact: true })).toHaveValue('100000');
  await expect(page.getByLabel('OE Pemasangan pipa', { exact: true })).toHaveValue('50000');
});
test('reference filters preserve selected IDs when rows are hidden or reordered', async ({ page }) => {
  await page.goto('/bank');
  await page.getByRole('tab', { name: 'Pencarian Referensi', exact: true }).click();
  for (const checkbox of await page.getByRole('checkbox', { name: /^Pilih OE-Historis/ }).all()) await checkbox.uncheck();
  await page.getByRole('checkbox', { name: 'Pilih OE-Historis-2024.xlsx', exact: true }).check();
  const table = page.getByRole('table', { name: 'Referensi Bank Data OE', exact: true });
  await table.getByRole('button', { name: 'Harga satuan', exact: true }).click();
  await table.getByRole('button', { name: /^Filter dan urutkan/ }).click();
  const menu = page.getByRole('dialog');
  await menu.getByLabel('Cari di tabel').fill('2026');
  await expect(table.getByRole('checkbox', { name: 'Pilih OE-Historis-2024.xlsx', exact: true })).toHaveCount(0);
  await expect(page.locator('.bank-reference-selection')).toContainText('1 referensi dipilih');
  await menu.getByRole('button', { name: 'Reset tabel', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('checkbox', { name: 'Pilih OE-Historis-2024.xlsx', exact: true })).toBeChecked();
});
