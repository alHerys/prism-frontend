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
  await expect(table.locator("tbody tr")).toHaveCount(2);
  const preference = page.getByLabel("Preferensi barang (%)");
  const original = await preference.inputValue();
  await preference.fill("16");
  await expect(page.getByRole("button", { name: "Evaluasi HEA", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Konfirmasi preferensi", exact: true })).toBeDisabled();
  await preference.fill(original);
  await page.getByRole("button", { name: "Evaluasi HEA", exact: true }).click();
  await expect(page).toHaveURL(/tab=hea&hasil=result-/);
  await expect(page.getByRole("button", { name: "Evaluasi HEA", exact: true })).toBeEnabled();
  await expect(table.locator("tbody tr")).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => { window.scrollTo(0, 0); return document.fonts.ready; });
  await page.screenshot({ path: info.outputPath("hea-compact.png"), fullPage: true });
  await page.getByRole("button", { name: "Lihat input dan jejak sumber", exact: true }).click();
  await expect(page.locator(".result-trace")).toContainText("Form-A5-Nusa.pdf");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor Excel", exact: true }).click();
  const download = await pending;
  const filename = info.outputPath("hea.xlsx");
  await download.saveAs(filename);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);
  const rows = JSON.stringify(workbook.getWorksheet("Rincian")!.getSheetValues());
  expect(rows).toContain("PT Nusa Teknik Mandiri");
  expect(rows).toContain("PT Borneo Teknik Nusantara");
  await page.getByRole("button", { name: "Harga Timpang", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hasil Harga Timpang", exact: true })).toBeVisible();
  await expect(page.locator(".stepper,.result-metadata,.evaluation-result-header .badge")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("automatic evaluation excludes a removed A5 and reports the remaining partial result", async ({ page }) => {
  await page.goto("/pengadaan/proc-showcase/review/doc-26");
  await page.locator("header").getByRole("button", { name: "Hapus Form A5", exact: true }).click();
  await page.getByRole("dialog", { name: "Hapus Form A5?", exact: true }).getByRole("button", { name: "Hapus Form A5", exact: true }).click();
  await page.getByRole("button", { name: "Tutup dokumen vendor", exact: true }).click();
  await page.getByRole("button", { name: "Lanjut ke evaluasi", exact: true }).click();
  await page.getByRole("button", { name: "Evaluasi HEA", exact: true }).click();
  await expect(page.getByRole("table", { name: "Leaderboard HEA", exact: true }).locator("tbody tr")).toHaveCount(1);
  await expect(page.locator(".evaluation-result .alert")).toContainText("PT Borneo Teknik Nusantara");
});

test("old results-stage links recover to evaluation while preserving the snapshot parameter", async ({ page }) => {
  await page.goto("/pengadaan/proc-showcase?tab=riwayat&hasil=result-33");
  await expect(page).toHaveURL(/tab=hea&hasil=result-33/);
  await expect(page.getByRole("heading", { name: "Leaderboard HEA", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lihat hasil & riwayat", exact: true })).toHaveCount(0);
});
