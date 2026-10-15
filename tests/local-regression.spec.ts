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
  const confirmation = page.getByRole('dialog', { name: 'Konfirmasi data dokumen', exact: true });
  const warning = confirmation.getByRole('checkbox', { name: /Saya telah memeriksa/ });
  if (await warning.count()) await warning.check();
  await confirmation.getByRole('button', {name: 'Konfirmasi data', exact: true}).click();
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
  if (!name.endsWith('.xlsx')) await expect(page.locator('html')).toHaveAttribute('data-upload-progress-seen', 'true');
  await expect(page).toHaveURL(/\/review\/doc-/);
}
async function exportRows(page: Page, info: TestInfo, name: string) {
  const pending = page.waitForEvent('download');
  await button(page, 'Ekspor Excel').click();
  const downloaded = await pending;
  const destination = info.outputPath(name + '.xlsx');
  await downloaded.saveAs(destination);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(destination);
  expect(workbook.worksheets.map((s) => s.name)).toEqual([...(name === 'hea' ? ['Perhitungan HEA'] : []), 'Keterangan', 'Ringkasan', 'Rincian', 'Jejak Sumber']);
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
    await page.getByRole("button", { name: "Isi nama vendor secara manual", exact: true }).click();
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
  await expect(page.getByLabel('Harga Penawaran Barang')).toHaveValue('1.000.000.000');
  await expect(page.locator('embed.review-pdf-preview')).toHaveAttribute('src', '/files/Form-A5-Nusa.pdf');
  await expect(page.getByRole('navigation', {name: 'Progres evaluasi'})).toHaveCount(0);
  await page.screenshot({path: info.outputPath('review-pdf.png'), fullPage: true});
  await confirm(page);
  await button(page, 'Tutup dokumen vendor').click();
  await page.getByRole('link', {name: /PT Borneo Teknik Nusantara.*Buka dokumen/}).click();
  await expect(page.getByRole('heading', {name: 'Pilih Dokumen', exact: true})).toBeVisible();
  await upload(page, 'Form-A5-Borneo.pdf', 'Unggah Form A5');
  await expect(page.getByLabel('TKDN jasa (%)')).toHaveValue('30');
  await page.getByLabel('TKDN jasa (%)').fill('35');
  await confirm(page);
  await button(page, 'Tutup dokumen vendor').click();
  await page.locator('.procurement-path').getByRole('button', {name: /Evaluasi/}).click();
  await page.getByLabel('Preferensi barang (%)').fill('15');
  await page.getByLabel('Preferensi jasa (%)').fill('7,5');
  await button(page, 'Simpan').click();
  await expect(page.getByRole('heading', {name: 'Leaderboard HEA'})).toBeVisible();
  expect(await exportRows(page, info, 'hea')).toContain('1261794759.4224293029478248835170918485030216358352');
  await button(page, 'Kembali ke identitas & vendor').click();
  await upload(page, 'OE-Terminal.xlsx');
  await button(page, 'Konfirmasi Data').click();
  await expect(page.getByRole('button', { name: 'Konfirmasi Data', exact: true })).toHaveCount(0);
  await button(page, 'Kembali ke pengadaan').click();
  await page.getByRole('link', {name: /PT Nusa Teknik Mandiri.*Buka dokumen/}).click();
  await upload(page, 'Penawaran-Nusa.xlsx', 'Unggah Penawaran Harga');
  await button(page, "Konfirmasi Data").click();
  await button(page, "Kembali ke pengadaan").click();
  await button(page, 'Tutup dokumen vendor').click();
  await page.locator('.procurement-path').getByRole('button', {name: /Evaluasi/}).click();
  await button(page, 'Harga Timpang').click();
  await expect(page.getByRole('heading', {name: 'Pilih vendor untuk melihat hasil Harga Timpang.'})).toBeVisible();
  await button(page, 'HEA').click();
  await expect(page.getByRole('heading', {name: 'Leaderboard HEA'})).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Pengadaan tidak ditemukan'})).toBeVisible();
});

test('Bank Data: Excel historis, publikasi dan estimasi otomatis', async ({page}) => {
  await page.goto('/bank');
  await button(page, 'Tambah dokumen historis').click();
  await page.getByLabel('Pilih OE historis').setInputFiles(file('OE-Historis-2024.xlsx'));
  await expect(page.getByRole('heading', {name: 'Review dokumen historis'})).toBeVisible();
  await page.getByLabel('Fungsi', {exact: true}).first().fill('Maintenance');
  await button(page, 'Simpan metadata').click();
  await button(page, 'Konfirmasi').click();
  await button(page, 'Publikasikan').click();
  await expect(page.getByText('Dokumen telah ditambahkan ke Bank Data OE.')).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByLabel('Uraian pekerjaan').fill('Pengecatan tangki');
  await page.getByLabel('Kuantitas', {exact: true}).fill('10');
  await button(page, 'Buat estimasi').click();
  await expect(page.getByRole('heading', {name: /Hasil estimasi/})).toBeVisible();
  await expect(page.getByText(/^Rp\s+875\.000$/)).toBeVisible();
});

test('annotation cleanup: procurement columns and history sections', async ({page}, info) => {
  for (const width of [1366,390]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/pengadaan');
    const table = page.locator('.procurement-table');
    await expect(table.getByRole('columnheader', {name:'Dokumen',exact:true})).toHaveCount(0);
    await expect(table.getByRole('columnheader', {name:'Kesiapan',exact:true})).toHaveCount(0);
    await expect(table.getByRole('columnheader')).toHaveCount(3);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`procurement-${width}.png`),fullPage:true});
    await page.goto('/bank');
    await expect(page.getByRole('heading',{name:'Susun kebutuhan estimasi'})).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`bank-${width}.png`),fullPage:true});
    await page.goto('/riwayat');
    await expect(page.getByRole('tab')).toHaveCount(2);
    await expect(page.getByRole('tab',{name:'Hasil Evaluasi',exact:true})).toHaveCount(0);
    await page.screenshot({path:info.outputPath(`history-${width}.png`),fullPage:true});
  }
});
