import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import ExcelJS from 'exceljs';
import path from 'node:path';

// Observe actual requests: Playwright's fixed clock replaces the Performance API.
const excelLoaded = new WeakSet<Page>();

// Every test uses a fresh browser context and the application's synthetic initial
// state. Fixed Date leaves the real processing timers running.
test.beforeEach(async ({ page, baseURL }) => {
  page.on('request', request => {
    if (/exceljs.*\.js/.test(request.url())) excelLoaded.add(page);
  });
  await page.clock.setFixedTime(new Date('2026-10-02T02:00:00Z'));
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(baseURL!) || /^(blob:|data:|chrome:|chrome-extension:)/.test(url)) await route.continue();
    else await route.abort('blockedbyclient');
  });
});

async function click(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click();
}
async function tab(page: Page, name: string) {
  if (name === 'HEA' || name === 'Harga Timpang') {
    await page.getByRole('navigation', { name: 'Tahap pengadaan' }).getByRole('button', { name: /Evaluasi/ }).click();
    await click(page, name);
  } else await page.getByRole('tab', { name, exact: true }).click();
}
async function capture(page: Page, name: string) {
  await expect(page.getByText('Menyiapkan ruang kerja', { exact: true })).toHaveCount(0);
  if (name === 'review') await expect(page.getByLabel('TKDN jasa (%)')).toBeVisible();
  if (name === 'dashboard') {
    await expect(page.getByRole('region', { name: 'Lanjutkan pekerjaan', exact: true })).toBeVisible();
    await expect(page.locator('.dashboard-distribution, .dashboard-procurements')).toHaveCount(0);
  }
  const close = page.getByRole('button', { name: 'Tutup pemberitahuan' });
  if (await close.count()) await close.click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // Native Chrome PDF rendering varies; its source URL is asserted in the upload test.
  await page.evaluate(() => document.fonts.ready);
  // Functional acceptance and reconstructed visual regression are separate runs.
  // Keep the original snapshots intact; the Fernly config selects its own namespace.
  if (process.env.PRISM_VISUAL_CAPTURE === '1') {
    await expect(page).toHaveScreenshot(`prism-${name}.png`, { fullPage: true, mask: name === 'review' ? [page.locator('iframe')] : [] });
  }
}
async function returnToEvaluation(page: Page, module = 'HEA') {
  await expect(page).not.toHaveURL(/\/review\//);
  await expect(page.locator('.vendor-focus-shell, .procurement-path')).toBeVisible();
  if (await page.locator('.vendor-focus-shell').count()) await page.locator('.review-back').click();
  await page.getByRole('navigation', { name: 'Tahap pengadaan' }).getByRole('button', { name: /Evaluasi/ }).click();
  await tab(page, module);
}
async function confirm(page: Page) {
  const price = await page.getByRole('heading', { name: /Periksa (Owner Estimate|Penawaran vendor)/ }).count();
  await click(page, 'Konfirmasi data');
  await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi data', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/review\//);
  await returnToEvaluation(page, price ? 'Harga Timpang' : 'HEA');
}
async function exportWorkbook(page: Page, info: TestInfo, name: string) {
  const pending = page.waitForEvent('download');
  await click(page, 'Ekspor Excel');
  const download = await pending;
  expect(excelLoaded.has(page)).toBe(true);
  expect(download.suggestedFilename()).toMatch(/^PRISM-.*\.xlsx$/);
  const filename = info.outputPath(`${name}.xlsx`);
  await download.saveAs(filename);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);
  expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(['Keterangan', 'Ringkasan', 'Rincian', 'Jejak Sumber']);
  return workbook;
}

test('desktop shell, sidebar, keyboard dialog and unsaved correction protection', async ({ page }) => {
  await page.goto('/');
  await capture(page, 'dashboard');
  await click(page, 'Ringkas navigasi');
  await expect(page.getByRole('button', { name: 'Perluas navigasi' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Bank Data OE' })).toBeVisible();
  await capture(page, 'dashboard-collapsed');
  await click(page, 'Perluas navigasi');
  await page.getByRole('link', { name: 'Lanjutkan Penggantian Jalur Pipa Terminal', exact: true }).click();
  await capture(page, 'procurement-detail');
  await tab(page, 'HEA');
  await page.getByRole('link', { name: 'Periksa dokumen' }).first().click();
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toHaveCount(0);
  await capture(page, 'review');
  const confirmationRect = await page.getByRole('button', { name: 'Konfirmasi data', exact: true }).boundingBox();
  expect(confirmationRect).not.toBeNull();
  expect(confirmationRect!.y + confirmationRect!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.getByLabel('TKDN jasa (%)').fill('31');
  await expect(page.getByRole('button', { name: 'Konfirmasi data', exact: true })).toBeDisabled();
  await click(page, 'Kembali ke pengadaan');
  const dialog = page.getByRole('dialog', { name: 'Perubahan belum disimpan' });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel('TKDN jasa (%)')).toHaveValue('31');
  await click(page, 'Kembali ke pengadaan');
  await dialog.getByRole('button', { name: 'Buang perubahan' }).click();
  await returnToEvaluation(page);
  await page.getByRole('link', { name: 'Periksa dokumen' }).first().click();
  await expect(page.getByLabel('TKDN jasa (%)')).toHaveValue('30');
  await page.getByLabel('TKDN jasa (%)').fill('31');
  await click(page, 'Kembali ke pengadaan');
  await dialog.getByRole('button', { name: 'Simpan & kembali' }).click();
  await returnToEvaluation(page);
  await page.getByRole('link', { name: 'Periksa dokumen' }).first().click();
  await expect(page.getByLabel('TKDN jasa (%)')).toHaveValue('31');
  await expect(page.getByText('Dikoreksi', { exact: true })).toBeVisible();
  await page.getByLabel('TKDN jasa (%)').fill('32');
  await page.goBack();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Tetap di halaman' }).click();
  await expect(page.getByLabel('TKDN jasa (%)')).toHaveValue('32');
  await page.goBack();
  await dialog.getByRole('button', { name: 'Buang perubahan' }).click();
  await returnToEvaluation(page);
  await page.getByRole('link', { name: 'Periksa dokumen' }).first().click();
  await expect(page.getByLabel('TKDN jasa (%)')).toHaveValue('31');
});

test('confirmed HEA and explicit price sources preserve results and XLSX traceability', async ({ page }, info) => {
  const errors: string[] = [];
  const outbound: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(info.project.use.baseURL as string).origin) outbound.push(request.url());
  });
  await page.goto('/pengadaan/proc-terminal?tab=hea');
  expect(excelLoaded.has(page)).toBe(false);
  await expect(page.getByRole('button', { name: 'Evaluasi HEA', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Periksa dokumen' }).first().click();
  await confirm(page);
  await page.getByRole('link', { name: 'Periksa dokumen' }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Konfirmasi data', exact: true })).toBeDisabled();
  await page.getByLabel('TKDN jasa (%)').fill('35');
  await click(page, 'Simpan perubahan');
  await page.getByRole('checkbox').check();
  await confirm(page);
  await page.getByLabel('Preferensi barang (%)').fill('15');
  await page.getByLabel('Preferensi jasa (%)').fill('7.5');
  await click(page, 'Simpan preferensi');
  await click(page, 'Konfirmasi preferensi');
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await click(page, 'Evaluasi HEA');
  await expect(page.getByRole('heading', { name: 'Leaderboard HEA' })).toBeVisible();
  await expect(page.locator('td[title="1261794759.4224293029478248835170918485030216358352"]')).toBeVisible();
  await capture(page, 'hea-result');
  await click(page, 'Lihat input dan jejak sumber');
  await expect(page.getByText('Harga penawaran barang', { exact: true }).first()).toBeVisible();
  const hea = await exportWorkbook(page, info, 'hea');
  expect(JSON.stringify(hea.getWorksheet('Rincian')!.getSheetValues())).toContain('1261794759.4224293029478248835170918485030216358352');
  expect(JSON.stringify(hea.getWorksheet('Jejak Sumber')!.getSheetValues())).toContain('35%');
  await tab(page, 'Harga Timpang');
  for (const [label, filename] of [['OE pengadaan', 'OE_Terminal.xlsx'], ['Penawaran vendor', 'Penawaran_Nusa.xlsx']]) {
    await page.getByLabel(label, { exact: true }).selectOption({ label: `${filename} · Perlu ditinjau` });
    await page.getByRole('link', { name: 'Periksa sumber dan kelompok harga' }).click();
    await expect(page.getByRole('button', { name: 'Konfirmasi data', exact: true })).toBeDisabled();
    await page.getByLabel('Kelompok harga yang digunakan').selectOption('Harga satuan material dan jasa');
    await click(page, 'Simpan perubahan');
    const warning = page.getByRole('checkbox', { name: /Saya telah memeriksa/ });
    if (await warning.count()) await warning.check();
    await confirm(page);
  }
  await page.getByLabel('OE pengadaan', { exact: true }).selectOption({ label: 'OE_Terminal.xlsx · Terkonfirmasi' });
  await page.getByLabel('Penawaran vendor', { exact: true }).selectOption({ label: 'Penawaran_Nusa.xlsx · Terkonfirmasi' });
  await click(page, 'Evaluasi harga');
  await expect(page.getByRole('heading', { name: 'Hasil Harga Timpang' })).toBeVisible();
  await expect(page.getByText('Hasil parsial · Belum dievaluasi:', { exact: false })).toBeVisible();
  await capture(page, 'price-result');
  const price = await exportWorkbook(page, info, 'price');
  const rows = JSON.stringify(price.getWorksheet('Rincian')!.getSheetValues());
  expect(rows).toContain('125%');
  expect(rows).toContain('110%');
  expect(rows).toContain('Tidak timpang');
  expect(rows).not.toContain('Katup gate');
  expect(JSON.stringify(price.getWorksheet('Ringkasan')!.getSheetValues())).toContain('Katup gate');
  await page.getByRole('link', { name: 'Bank Data OE', exact: true }).click();
  await capture(page, 'bank-documents');
  await tab(page, 'Pencarian Referensi');
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await capture(page, 'bank-references');
  await click(page, 'Lihat statistik');
  await capture(page, 'bank-statistics');
  const bank = await exportWorkbook(page, info, 'bank');
  expect(JSON.stringify(bank.getWorksheet('Ringkasan')!.getSheetValues())).toContain('90000');
  await click(page, 'Lanjut ke bantuan estimasi');
  await page.getByLabel('Uraian pekerjaan').fill('Pengecatan tangki');
  await page.getByLabel('Kuantitas', { exact: true }).fill('10');
  await click(page, 'Buat estimasi');
  await expect(page.getByRole('heading', { name: /Hasil estimasi/ })).toBeVisible();
  await capture(page, 'bank-estimate');
  await page.getByRole('link', { name: 'Riwayat & Statistik', exact: true }).click();
  await tab(page, 'Hasil Evaluasi');
  await capture(page, 'history-results');
  await tab(page, 'Statistik Aktivitas');
  await capture(page, 'history-statistics');
  expect(errors).toEqual([]);
  expect(outbound).toEqual([]);
});

test('real file upload rejects unsupported bytes and accepts registered PDF through review', async ({ page }) => {
  await page.goto('/pengadaan/proc-terminal?tab=dokumen');
  await page.getByRole('link', { name: /PT Nusa Teknik Mandiri.*Buka dokumen/ }).click();
  const upload = page.getByLabel('Pilih berkas dokumen');
  await upload.setInputFiles({ name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not a supported PDF') });
  await expect(page.getByRole('alert')).toBeVisible();
  await upload.setInputFiles(path.resolve('public/files/Form-A5-Nusa.pdf'));
  await expect(page).toHaveURL(/\/review\/doc-/);
  await expect(page.getByLabel('Harga Penawaran Barang (Rp)')).toHaveValue('1.000.000.000');
  await expect(page.locator('iframe.review-pdf-preview')).toHaveAttribute('src', '/files/Form-A5-Nusa.pdf');
  await expect(page.locator('.review-document-identity').getByText('Perlu ditinjau')).toBeVisible();
  await confirm(page);
});

test('motion preference removes nonessential movement and active motion preserves navigation', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  const durations = await page.locator('.sidebar, .page').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return [...style.transitionDuration.split(','), ...style.animationDuration.split(',')].map(value => parseFloat(value));
  }).flat());
  expect(durations.every(duration => duration <= 0.001)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await click(page, 'Ringkas navigasi');
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Bank Data OE' }).click();
  await expect(page.getByRole('heading', { name: 'Bank Data OE', exact: true })).toBeVisible();
  await tab(page, 'Pencarian Referensi');
  await expect(page.getByRole('tab', { name: 'Pencarian Referensi' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Pencarian Referensi' })).toHaveAttribute('aria-selected', 'true');
});

test('historical XLSX upload requires metadata and confirmation before publication', async ({ page }) => {
  await page.goto('/bank');
  await click(page, 'Tambah dokumen historis');
  await page.getByLabel('Pilih OE historis').setInputFiles(path.resolve('public/files/OE-Historis-2024.xlsx'));
  await expect(page.getByRole('heading', { name: 'Review dokumen historis' })).toBeVisible();
  await expect(page.getByText('Harga · E5', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publikasikan', exact: true })).toBeDisabled();
  await page.getByLabel('Fungsi', { exact: true }).first().fill('Maintenance');
  await click(page, 'Simpan metadata');
  await click(page, 'Konfirmasi');
  await click(page, 'Publikasikan');
  await expect(page.getByText('Dokumen telah ditambahkan ke Bank Data OE.')).toBeVisible();
  await tab(page, 'Bantuan Estimasi');
  await page.getByLabel('Uraian pekerjaan').fill('Pengecatan tangki');
  await page.getByLabel('Kuantitas', { exact: true }).fill('10');
  await expect(page.getByRole('button', { name: 'Buat estimasi', exact: true })).toBeEnabled();
});

test('procurement search, sorting and pagination reflect created records', async ({ page }) => {
  await page.goto('/pengadaan');
  for (let index = 1; index <= 4; index++) {
    await click(page, 'Tambah pengadaan');
    await page.getByLabel('Nama pengadaan', { exact: true }).fill(`Pengadaan acceptance ${index}`);
    await page.getByLabel('Nomor pengadaan', { exact: true }).fill(`ACCEPTANCE-${index}`);
    await page.getByLabel('Fungsi / unit kerja', { exact: true }).fill('Maintenance');
    await click(page, 'Buat pengadaan');
    await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Pengadaan', exact: true }).click();
  }
  await page.getByRole('combobox', { name: 'Jumlah pengadaan per halaman' }).click();
  await page.getByRole('option', { name: '5', exact: true }).click();
  await expect(page.locator('.procurement-table tbody tr')).toHaveCount(5);
  await expect(page.getByLabel('Halaman 1 dari 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sebelumnya', exact: true })).toBeDisabled();
  await click(page, 'Selanjutnya');
  await expect(page.locator('.procurement-table tbody tr')).toHaveCount(2);
  await expect(page.getByLabel('Halaman 2 dari 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Selanjutnya', exact: true })).toBeDisabled();
  await page.locator('.table-toolbar').getByRole('textbox', { name: 'Cari pengadaan', exact: true }).fill('acceptance');
  await expect(page.locator('.procurement-table tbody tr')).toHaveCount(4);
  await expect(page.getByLabel('Halaman 1 dari 1', { exact: true })).toBeVisible();
  await page.getByRole('columnheader').getByRole('button', { name: 'Pengadaan', exact: true }).click();
  await expect(page.locator('tbody tr').first().getByRole('link', { name: 'Pengadaan acceptance 4', exact: true })).toBeVisible();
});

test('direct routes and navigation load the same styles and preserve tab drafts', async ({ page, context }) => {
  const direct = await context.newPage();
  async function compareStyles(url: string, ready: string, selectors: string[]) {
    await expect(page.getByRole('heading', { name: ready, exact: true })).toBeVisible();
    await direct.goto(url);
    await expect(direct.getByRole('heading', { name: ready, exact: true })).toBeVisible();
    const read = (target: Page) => target.evaluate(selectors => selectors.map(selector => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing style probe: ${selector}`);
      const css = getComputedStyle(element);
      return [css.fontFamily, css.fontSize, css.color, css.backgroundColor, css.borderRadius, css.padding, css.display];
    }), selectors);
    expect(await read(page)).toEqual(await read(direct));
  }
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Bank Data OE' }).click();
  await compareStyles('/bank', 'Perkembangan harga referensi', ['.topbar', '.bank-page .panel', '.bank-chart']);
  await tab(page, 'Bantuan Estimasi');
  await page.getByLabel('Kuantitas', { exact: true }).fill('100');
  await tab(page, 'Statistik Harga');
  await tab(page, 'Bantuan Estimasi');
  await expect(page.getByLabel('Kuantitas', { exact: true })).toHaveValue('100');
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Riwayat & Statistik' }).click();
  await compareStyles('/riwayat', 'Catatan aktivitas', ['.topbar', '.bank-history .panel', '.bank-history .history-timeline']);
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('link', { name: 'Lanjutkan Penggantian Jalur Pipa — Siap Evaluasi', exact: true }).click();
  await compareStyles('/pengadaan/proc-showcase?tab=hea', 'Leaderboard HEA', ['.procurement-path', '.panel', '.table']);
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('link', { name: 'Lanjutkan Penggantian Jalur Pipa Terminal', exact: true }).click();
  await tab(page, 'HEA');
  await page.getByRole('link', { name: 'Periksa dokumen' }).first().click();
  await compareStyles('/pengadaan/proc-terminal/review/doc-21', 'Periksa Form A5', ['.focus-head', '.review-editor', '.review-source']);
  await direct.close();
});
