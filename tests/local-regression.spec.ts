import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import path from 'node:path';
import ExcelJS from 'exceljs';

const file = (name: string) => path.resolve('public/files', name);
const button = (page: Page, name: string) => page.getByRole('button', {name, exact: true});
async function confirm(page: Page) {
  const ack = page.getByRole('checkbox', {name: /Saya telah memeriksa/});
  if (await ack.count()) await ack.check();
  await button(page, 'Konfirmasi data').click();
  await page.getByRole('dialog').getByRole('button', {name: 'Konfirmasi data', exact: true}).click();
  await expect(page.getByRole('dialog', {name: 'Konfirmasi data dokumen'})).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/review\//);
}
async function upload(page: Page, name: string, label = 'Pilih berkas dokumen') {
  // Observe the real 450ms progress state before selecting a file. Polling after
  // setInputFiles can miss it when Chrome is busy; production timing stays intact.
  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-upload-progress-seen');
    const observer = new MutationObserver(() => {
      const visible = [...document.querySelectorAll('[role="status"]')].some(
        element => element.textContent?.includes('Menyiapkan kandidat data') && element.getClientRects().length > 0,
      );
      if (visible) {
        document.documentElement.setAttribute('data-upload-progress-seen', 'true');
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await page.getByLabel(label, {exact: true}).setInputFiles(file(name));
  await expect(page.locator('html')).toHaveAttribute('data-upload-progress-seen', 'true');
  await expect(page).toHaveURL(/\/review\/doc-/);
}
async function group(page: Page) {
  await page.getByLabel('Kelompok harga yang digunakan').selectOption('Harga satuan material dan jasa');
  await confirm(page);
}
async function exportRows(page: Page, info: TestInfo, name: string) {
  const pending = page.waitForEvent('download');
  await button(page, 'Ekspor Excel').click();
  const downloaded = await pending;
  const destination = info.outputPath(name + '.xlsx');
  await downloaded.saveAs(destination);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(destination);
  expect(workbook.worksheets.map((s) => s.name)).toEqual(['Keterangan', 'Ringkasan', 'Rincian', 'Jejak Sumber']);
  return JSON.stringify(workbook.getWorksheet('Rincian')!.getSheetValues());
}

test('workflow lengkap: unggah PDF/Excel, koreksi, HEA, Harga Timpang, snapshot dan ekspor', async ({page, baseURL}, info) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    // Chrome's built-in PDF viewer loads chrome:// resources locally.
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url());
  });
  await page.goto('/pengadaan');
  await button(page, 'Tambah pengadaan').click();
  await page.getByLabel('Nama pengadaan', {exact: true}).fill('Penggantian Jalur Pipa');
  await page.getByLabel('Nomor pengadaan', {exact: true}).fill('REG-2026-001');
  await page.getByLabel('Fungsi / unit kerja').fill('Maintenance');
  await button(page, 'Buat pengadaan').click();
  await expect(page.locator('[aria-current="step"]')).toContainText('Identitas & vendor');
  for (const name of ['PT Nusa Teknik Mandiri', 'PT Borneo Teknik Nusantara']) {
    await button(page, 'Tambah vendor').click();
    await page.getByLabel('Nama badan usaha').fill(name);
    await page.getByRole('dialog').getByRole('button', {name: 'Tambah vendor'}).click();
  }
  await page.getByRole('link', {name: /PT Nusa Teknik Mandiri.*Buka dokumen/}).click();
  await expect(page.getByRole('heading', {name: 'Pilih Dokumen', exact: true})).toBeVisible();
  await expect(page.getByRole('dialog', {name: 'Pilih Dokumen'})).toBeVisible();
  await expect(page.getByLabel('Pemilik dokumen')).toHaveCount(0);
  await page.screenshot({path: info.outputPath('vendor.png'), fullPage: true});
  await page.getByLabel('Unggah Form A5', {exact: true}).setInputFiles({name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('unknown bytes')});
  await expect(page.getByRole('alert')).toContainText('belum didukung');
  await upload(page, 'Form-A5-Nusa.pdf', 'Unggah Form A5');
  await expect(page.getByLabel('Harga Penawaran Barang (Rp)')).toHaveValue('1.000.000.000');
  await expect(page.locator('iframe.review-pdf-preview')).toHaveAttribute('src', '/files/Form-A5-Nusa.pdf');
  await expect(page.getByRole('navigation', {name: 'Progres evaluasi'})).toHaveCount(0);
  await page.screenshot({path: info.outputPath('review-pdf.png'), fullPage: true});
  await confirm(page);
  await button(page, 'Tutup dokumen vendor').click();
  await page.getByRole('link', {name: /PT Borneo Teknik Nusantara.*Buka dokumen/}).click();
  await expect(page.getByRole('heading', {name: 'Pilih Dokumen', exact: true})).toBeVisible();
  await upload(page, 'Form-A5-Borneo.pdf', 'Unggah Form A5');
  await expect(page.getByLabel('TKDN jasa (%)')).toHaveValue('30');
  await expect(button(page, 'Konfirmasi data')).toBeDisabled();
  await page.getByLabel('TKDN jasa (%)').fill('35');
  await confirm(page);
  await button(page, 'Tutup dokumen vendor').click();
  await page.locator('.procurement-path').getByRole('button', {name: /Evaluasi/}).click();
  await page.getByLabel('Preferensi barang (%)').fill('15');
  await page.getByLabel('Preferensi jasa (%)').fill('7,5');
  await button(page, 'Simpan preferensi').click();
  await button(page, 'Konfirmasi preferensi').click();
  for (const choice of await page.getByRole('checkbox').all()) await choice.check();
  await button(page, 'Evaluasi HEA').click();
  await expect(page.getByRole('heading', {name: 'Leaderboard HEA'})).toBeVisible();
  expect(await exportRows(page, info, 'hea')).toContain('1261794759.4224293029478248835170918485030216358352');
  await button(page, 'Kembali ke identitas & vendor').click();
  await upload(page, 'OE-Terminal.xlsx');
  await group(page);
  await page.getByRole('link', {name: /PT Nusa Teknik Mandiri.*Buka dokumen/}).click();
  await upload(page, 'Penawaran-Nusa.xlsx', 'Unggah Penawaran Harga');
  await group(page);
  await button(page, 'Tutup dokumen vendor').click();
  await page.locator('.procurement-path').getByRole('button', {name: /Evaluasi/}).click();
  await button(page, 'Harga Timpang').click();
  await page.getByLabel('OE pengadaan', {exact: true}).selectOption({label: 'OE-Terminal.xlsx · Terkonfirmasi'});
  await page.getByLabel('Penawaran vendor', {exact: true}).selectOption({label: 'Penawaran-Nusa.xlsx · Terkonfirmasi'});
  await button(page, 'Evaluasi harga').click();
  await expect(page.getByRole('heading', {name: 'Hasil Harga Timpang'})).toBeVisible();
  const rows = await exportRows(page, info, 'harga-timpang');
  expect(rows).toContain('125%');
  expect(rows).toContain('110%');
  expect(rows).toContain('Tidak timpang');
  expect(rows).not.toContain('Katup gate');
  await button(page, 'Lihat hasil & riwayat').click();
  await expect(page.getByRole('heading', {name: 'Hasil evaluasi tersimpan'})).toBeVisible();
  await expect(button(page, 'Buka hasil')).toHaveCount(2);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Pengadaan tidak ditemukan'})).toBeVisible();
});

test('Bank Data: Excel historis, publikasi, statistik dan estimasi', async ({page}, info) => {
  await page.goto('/bank');
  await button(page, 'Tambah dokumen historis').click();
  await page.getByLabel('Pilih OE historis').setInputFiles(file('OE-Historis-2024.xlsx'));
  await expect(page.getByRole('heading', {name: 'Review dokumen historis'})).toBeVisible();
  await page.getByLabel('Fungsi', {exact: true}).first().fill('Maintenance');
  await button(page, 'Simpan metadata').click();
  await button(page, 'Konfirmasi').click();
  await button(page, 'Publikasikan').click();
  await expect(page.getByText('Dokumen telah ditambahkan ke Bank Data OE.')).toBeVisible();
  await page.getByRole('tab', {name: 'Pencarian Referensi'}).click();
  for (const year of ['2024', '2025', '2026']) {
    await page.getByRole('checkbox', {name: `Pilih OE-Historis-${year}.xlsx`, exact: true}).first().check();
    await page.getByRole('checkbox', {name: `Sebanding OE-Historis-${year}.xlsx`, exact: true}).first().check();
  }
  await button(page, 'Lihat statistik').click();
  expect(await exportRows(page, info, 'bank-oe')).toContain('90000');
  await button(page, 'Lanjut ke bantuan estimasi').click();
  await page.getByLabel('Uraian pekerjaan').fill('Pengecatan tangki');
  await page.getByLabel('Kuantitas', {exact: true}).fill('10');
  await button(page, 'Buat estimasi').click();
  await expect(page.getByRole('heading', {name: /Hasil estimasi/})).toBeVisible();
  await expect(page.getByText(/^Rp\s+900\.000$/)).toBeVisible();
});
