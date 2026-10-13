import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";

test("compact evaluation preserves confirmed inputs, results and workbook export", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/pengadaan/proc-showcase?tab=hea");
  await expect(page.getByRole("navigation", { name: "Tahap pengadaan" }).getByRole("button")).toHaveCount(2);
  await expect(page.locator(".stepper,.result-metadata,.preference-context,.evaluation-selection,.hea-preferences .badge,.evaluation-result-header .badge")).toHaveCount(0);
  await expect(page.getByText("Hasil & jejak sumber", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Hasil tersimpan dengan input dan jejak sumber evaluasi.", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Hasil evaluasi mendukung pemeriksaan; tidak menetapkan pemenang.", { exact: true })).toHaveCount(0);
  const table = page.getByRole("table", { name: "Leaderboard HEA", exact: true });
  await expect(table.locator("th button,.data-table-filter-trigger")).toHaveCount(0);
  await expect(page.getByText("Urutan berdasarkan nilai berpresisi penuh", { exact: true })).toHaveCount(0);
  await expect(table.getByRole("link", { name: "Form-A5-Nusa.pdf", exact: true })).toHaveAttribute("href", "/pengadaan/proc-showcase/review/doc-25");
  const preferencesPanel = page.locator(".hea-preferences");
  const resultPanel = page.locator(".evaluation-result");
  if (page.viewportSize()!.width >= 1024) {
    expect((await preferencesPanel.boundingBox())!.x).toBeLessThan((await resultPanel.boundingBox())!.x);
    await expect(preferencesPanel).toHaveCSS("position", "sticky");
  } else {
    expect((await preferencesPanel.boundingBox())!.y).toBeLessThan((await resultPanel.boundingBox())!.y);
    await expect(preferencesPanel).toHaveCSS("position", "static");
  }
  const preference = page.getByLabel("Preferensi barang (%)");
  const original = await preference.inputValue();
  await preference.fill("");
  await expect(page.getByRole("button", { name: "Simpan", exact: true })).toBeDisabled();
  await preference.fill(original);
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page).toHaveURL(/tab=hea&hasil=result-/);
  await expect(page.getByRole("button", { name: "Simpan", exact: true })).toBeEnabled();
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { window.scrollTo(0, 0); return document.fonts.ready; });
  await page.screenshot({ path: info.outputPath("hea-compact.png"), fullPage: true });
  if (page.viewportSize()!.width >= 1024) {
    await resultPanel.evaluate(element => { (element as HTMLElement).style.minHeight = "1400px"; });
    await page.evaluate(() => window.scrollTo(0, 650));
    await expect.poll(async () => Math.round((await preferencesPanel.boundingBox())!.y)).toBe(24);
    await resultPanel.evaluate(element => { (element as HTMLElement).style.minHeight = ""; });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.getByRole("button", { name: "Lihat Detail", exact: true }).click();
  const reportDialog = page.getByRole("dialog", { name: "Detail perhitungan HEA", exact: true });
  await expect(reportDialog.locator("embed.hea-report-pdf")).toBeVisible();
  expect((await reportDialog.boundingBox())!.width).toBeGreaterThan(page.viewportSize()!.width * .9);
  // Native PDF rendering finishes independently of the embed's DOM load.
  // This bounded pause is only for the observational screenshot, not acceptance.
  await page.waitForTimeout(800);
  // Keep the viewport fixed: a full-page capture resizes the native PDF surface.
  await page.screenshot({ path: info.outputPath("hea-report-dialog.png"), fullPage: false });
  const pdfDownload = page.waitForEvent("download");
  await reportDialog.getByRole("link", { name: "Unduh PDF", exact: true }).click();
  await (await pdfDownload).saveAs(info.outputPath("hea-report.pdf"));
  await reportDialog.getByRole("button", { name: "Tutup detail HEA", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lihat Detail", exact: true })).toBeFocused();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor Excel", exact: true }).click();
  const download = await pending;
  const filename = info.outputPath("hea.xlsx");
  await download.saveAs(filename);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);
  const report = workbook.getWorksheet("Perhitungan HEA")!;
  expect(report).toBeTruthy();
  expect(report.getCell("C6").value).toBe("PT Nusa Teknik Mandiri");
  expect(report.getCell("J6").value).toBe(.3769);
  expect(report.getCell("I12").value).toBe(1261794759);
  const rows = JSON.stringify(workbook.getWorksheet("Rincian")!.getSheetValues());
  expect(rows).toContain("PT Nusa Teknik Mandiri");
  expect(rows).toContain("PT Borneo Teknik Nusantara");
  await page.getByRole("button", { name: "Harga Timpang", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Detail Item", exact: true })).toBeVisible();
  await expect(page.locator(".stepper,.result-metadata,.evaluation-result-header .badge")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("empty preferences show guidance, and one click saves, confirms and calculates", async ({ page }) => {
  await page.goto("/pengadaan/proc-terminal?tab=hea");
  const evaluate = page.getByRole("button", { name: "Simpan", exact: true });
  await expect(page.getByRole("region", { name: "Leaderboard HEA belum tersedia" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Leaderboard HEA", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Simpan preferensi", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Konfirmasi preferensi", exact: true })).toHaveCount(0);
  await page.getByLabel("Preferensi barang (%)").fill("15");
  await expect(evaluate).toBeDisabled();
  await page.getByLabel("Preferensi jasa (%)").fill("7,5");
  await expect(evaluate).toBeEnabled();
  await page.goto("/pengadaan/proc-showcase?tab=hea");
  await page.getByLabel("Preferensi barang (%)").fill("");
  await expect(page.getByRole("table", { name: "Leaderboard HEA", exact: true })).toHaveCount(0);
  await page.getByLabel("Preferensi barang (%)").fill("15.0");
  await page.getByLabel("Preferensi jasa (%)").fill("7,5");
  await evaluate.click();
  await expect(page).toHaveURL(/tab=hea&hasil=result-/);
  await expect(page.getByRole("table", { name: "Leaderboard HEA", exact: true }).locator("tbody tr")).toHaveCount(2);
  await expect(page.getByLabel("Preferensi jasa (%)")).toHaveValue("7.5");
  await page.getByRole("link", { name: "Form-A5-Nusa.pdf", exact: true }).click();
  await expect(page).toHaveURL(/review\/doc-25/);
  await expect(page.locator("embed.review-pdf-preview")).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await expect(page).toHaveURL(/tab=hea&hasil=result-/);
  await expect(page.getByRole("table", { name: "Leaderboard HEA", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("automatic evaluation excludes a removed A5 and reports the remaining partial result", async ({ page }) => {
  await page.goto("/pengadaan/proc-showcase/review/doc-26");
  await page.locator("header").getByRole("button", { name: "Hapus Form A5", exact: true }).click();
  await page.getByRole("dialog", { name: "Hapus Form A5?", exact: true }).getByRole("button", { name: "Hapus Form A5", exact: true }).click();
  await page.getByRole("button", { name: "Tutup dokumen vendor", exact: true }).click();
  await page.getByRole("button", { name: "Lanjut ke evaluasi", exact: true }).click();
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("table", { name: "Leaderboard HEA", exact: true }).locator("tbody tr")).toHaveCount(1);
  await expect(page.locator(".evaluation-result .alert")).toContainText("PT Borneo Teknik Nusantara");
});

test("old results-stage links recover to evaluation while preserving the snapshot parameter", async ({ page }) => {
  await page.goto("/pengadaan/proc-showcase?tab=riwayat&hasil=result-33");
  await expect(page).toHaveURL(/tab=hea&hasil=result-33/);
  await expect(page.getByRole("heading", { name: "Leaderboard HEA", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lihat hasil & riwayat", exact: true })).toHaveCount(0);
});

test("price overview pies precede full-width item details", async ({ page }, info) => {
  await page.goto("/pengadaan/proc-showcase?tab=harga");
  await expect(page.locator(".evaluation-price-sources,.evaluation-result > .alert")).toHaveCount(0);
  await expect(page.locator(".result-category-summary > div")).toHaveCount(0);
  await expect(page.locator(".result-category-summary small")).toHaveCount(0);
  await expect(page.locator(".result-counts span")).toHaveCount(5);
  await expect(page.locator(".result-counts")).toContainText("Total Item 2");
  await expect(page.getByLabel("Filter kategori hasil").locator("option[value=MATERIAL]")).toHaveText("Barang");
  await page.getByLabel("Filter kategori hasil").selectOption("MATERIAL");
  await expect(page.locator(".result-counts")).toContainText("Total Item 1");
  await expect(page.locator(".result-counts")).toContainText("Total Jasa 0");
  const overview = page.getByRole("region", { name: "Overview Harga Timpang", exact: true });
  await expect(overview.getByRole("figure")).toHaveCount(3);
  await expect(overview.getByRole("figure", { name: "Komposisi Seluruh Item" })).toContainText("50% · 1 item");
  await expect(overview.getByRole("figure", { name: "Komposisi Barang", exact: true })).toContainText("100% · 1 item");
  await expect(overview.getByRole("figure", { name: "Komposisi Jasa", exact: true })).toContainText("100% · 1 item");
  await page.getByLabel("Filter kategori hasil").selectOption("");
  const tableRegion = page.getByRole("region", { name: "Hasil perbandingan komponen harga", exact: true });
  expect((await overview.boundingBox())!.y).toBeLessThan((await tableRegion.boundingBox())!.y);
  const detailPanel = page.locator(".evaluation-result");
  expect((await tableRegion.boundingBox())!.width).toBeGreaterThan((await detailPanel.boundingBox())!.width * .85);
  await expect(page.locator(".price-classification-chart,.price-results-layout")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("price-cards.png"), fullPage: true });
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor Excel", exact: true }).click();
  const filename = info.outputPath("harga.xlsx");
  await (await pending).saveAs(filename);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);
  expect(JSON.stringify(workbook.getWorksheet("Rincian")!.getSheetValues())).toContain("125%");
  expect(JSON.stringify(workbook.getWorksheet("Ringkasan")!.getSheetValues())).toContain("Katup gate");
  await page.goto("/pengadaan/proc-terminal?tab=harga");
  await expect(page.getByRole("heading", { name: "Belum ada hasil Harga Timpang" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Evaluasi harga", exact: true })).toHaveCount(0);
});

test("detail search slides over totals and leaves filter search unavailable", async ({ page }, info) => {
  await page.goto("/pengadaan/proc-showcase?tab=harga");
  await expect(page.locator(".price-search-field")).toHaveCSS("transition-duration", "0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".price-search-field")).toHaveCSS("transition-duration", "0.26s, 0.26s, 0.26s");
  const filter = page.getByRole("button", { name: "Filter dan urutkan Hasil perbandingan komponen harga", exact: true });
  await filter.click();
  await expect(page.getByLabel("Cari di tabel", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tutup filter Hasil perbandingan komponen harga", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Cari item", exact: true });
  await trigger.click();
  const search = page.getByRole("textbox", { name: "Cari Detail Item", exact: true });
  await expect(search).toBeFocused();
  await expect(page.locator(".price-search-summary")).toHaveCSS("opacity", "0");
  await search.fill("PIPA BAJA");
  const table = page.getByRole("table", { name: "Hasil perbandingan komponen harga", exact: true });
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table).toContainText("Pipa baja");
  await expect(page.getByRole("region", { name: "Overview Harga Timpang" })).toContainText("50%");
  await page.screenshot({ path: info.outputPath("detail-search.png"), fullPage: true });
  await search.fill("tidak ditemukan");
  await expect(table).toContainText("Tidak ada baris sesuai filter.");
  await page.getByRole("button", { name: "Reset tabel", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await search.fill("Pipa");
  await search.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(search).toBeHidden();
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect(page.getByLabel("Jumlah hasil harga", { exact: true })).toBeVisible();
});
