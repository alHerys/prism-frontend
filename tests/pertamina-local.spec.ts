import { selectPriceVendor } from "./helpers/price-vendor";
import { test, expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import type { PertaminaCatalog } from "../src/infrastructure/pertamina/catalog";

const catalogPath = process.env.PRISM_PERTAMINA_REFERENCE;
const catalog = catalogPath ? JSON.parse(readFileSync(catalogPath, "utf8")) as PertaminaCatalog & { sources: { relativePath: string }[] } : undefined;
test.skip(!catalog, "Requires an explicitly selected private local catalog.");
const sourcePath = (kind: string, index = 0) => path.resolve(path.dirname(catalogPath!), "../..", catalog!.sources.filter(s => s.kind === kind)[index].relativePath);
const complete = "/pengadaan/proc-pertamina-complete";
const browserChecks = new WeakMap<Page, { errors: string[]; unexpected: string[] }>();

async function exportExcel(page: Page, info: TestInfo, filename: string, scope = page.locator("body")) {
  const download = page.waitForEvent("download");
  await scope.getByRole("button", { name: "Ekspor Excel", exact: true }).click();
  const target = info.outputPath(filename); await (await download).saveAs(target);
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile(target); return workbook;
}
async function openFields(page: Page) {
  await expect(page.locator(".a5-review-header")).toBeVisible();
  const button = page.getByRole("button", { name: "Periksa nilai", exact: true });
  if (await button.count()) await button.click();
  await expect(page.getByLabel("Harga Penawaran Barang", { exact: true })).toBeVisible();
}
async function openHistory(page: Page) {
  const link = page.getByRole("link", { name: "Riwayat & Statistik", exact: true });
  if (!(await link.isVisible())) await page.getByRole("button", { name: "Buka navigasi", exact: true }).click();
  await link.click();
}
async function checkLayout(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator("body")).not.toContainText(/\b(dummy|simulasi|demo)\b/i);
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [], unexpected: string[] = [];
  browserChecks.set(page, { errors, unexpected });
  page.on("pageerror", e => errors.push(e.message));
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && (url.hostname !== "127.0.0.1" || url.pathname.startsWith("/api/"))) unexpected.push(request.url());
  });
});
test.afterEach(async ({ page }) => {
  expect(browserChecks.get(page)?.errors).toEqual([]);
  expect(browserChecks.get(page)?.unexpected).toEqual([]);
});

test("local HEA follows saved A5/preferences and reports the saved values", async ({ page }, info) => {
  await page.goto(`${complete}?tab=hea`);
  const table = page.getByRole("table", { name: "Leaderboard HEA", exact: true });
  await expect(table.locator("tbody tr")).toHaveCount(2);
  const vendor = catalog!.a5[0].candidate.vendorName;
  const oldRow = table.getByRole("row").filter({ hasText: vendor });
  const oldValue = await oldRow.locator("td.numeric").getAttribute("title");
  const initial = await exportExcel(page, info, "hea-initial.xlsx");
  expect(initial.getWorksheet("Perhitungan HEA")).toBeDefined();
  await oldRow.getByRole("link").click();
  await openFields(page);
  const edited = (BigInt(catalog!.a5[0].candidate.values.hpb) * 2n).toString();
  await page.getByLabel("Harga Penawaran Barang", { exact: true }).fill(edited);
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /Konfirmasi/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await expect(table.getByRole("row").filter({ hasText: vendor }).locator("td.numeric")).not.toHaveAttribute("title", oldValue!);
  await page.getByLabel("Preferensi barang (%)").fill("0"); await page.getByLabel("Preferensi jasa (%)").fill("0");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  const expected = (BigInt(edited) + BigInt(catalog!.a5[0].candidate.values.hpj) + BigInt(catalog!.a5[0].candidate.values.knb)).toString();
  await expect(table.getByRole("row").filter({ hasText: vendor }).locator("td.numeric")).toHaveAttribute("title", expected);
  const latest = await exportExcel(page, info, "hea-edited.xlsx");
  expect(JSON.stringify(latest.getWorksheet("Rincian")!.getSheetValues())).toContain(expected);
  await checkLayout(page);
  await page.screenshot({ path: info.outputPath("hea-local.png"), fullPage: true });
  await page.getByRole("button", { name: "Lihat Detail", exact: true }).click();
  await expect(page.locator("embed.hea-report-pdf")).toBeVisible();
  const pdf = page.waitForEvent("download"); await page.getByRole("link", { name: "Unduh PDF", exact: true }).click(); await (await pdf).saveAs(info.outputPath("hea-local.pdf"));
  await page.getByRole("button", { name: "Tutup detail HEA", exact: true }).click();
  await openHistory(page);
  await expect(page.getByRole("tab", { name: "Hasil Evaluasi", exact: true })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Aktivitas", exact: true })).toBeVisible();
});

test("raw uploads save without confirmation and make HEA/price available", async ({ page }, info) => {
  const base = "/pengadaan/proc-pertamina-new";
  await page.goto(`${base}?tab=ringkasan`);
  await page.getByRole("button", { name: "Tambah vendor", exact: true }).click();
  await page.getByRole("dialog", { name: "Tambah vendor", exact: true }).getByLabel("Pilih Form A5 vendor").setInputFiles([sourcePath("FORM_A5", 0), sourcePath("FORM_A5", 1)]);
  await openFields(page);
  await expect(page.getByRole("button", { name: "Simpan", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Simpan", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByText("Vendor dan data telah disimpan.")).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Konfirmasi/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Selesai", exact: true }).click();
  await page.getByRole("button", { name: /2 Evaluasi/ }).click();
  await page.getByLabel("Preferensi barang (%)").fill("25"); await page.getByLabel("Preferensi jasa (%)").fill("7,5");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  await expect(page.getByRole("table", { name: "Leaderboard HEA" }).locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Kembali ke identitas & vendor", exact: true }).click();
  await page.getByLabel("Pilih berkas dokumen", { exact: true }).setInputFiles(sourcePath("OE"));
  await expect(page.getByRole("treegrid")).toBeVisible();
  await page.getByRole("button", { name: "Simpan Data", exact: true }).click();
  await expect(page.getByRole("button", { name: "Simpan Data", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  const card = page.locator(".procurement-vendor-card").filter({ has: page.getByRole("heading", { name: catalog!.a5[0].candidate.vendorName, exact: true }) });
  await card.getByRole("link", { name: /Buka dokumen/ }).click();
  await page.getByLabel("Unggah Penawaran Harga", { exact: true }).setInputFiles(sourcePath("OFFER"));
  await expect(page.getByRole("treegrid")).toBeVisible();
  await page.getByRole("button", { name: "Simpan Data", exact: true }).click();
  await expect(page.getByRole("button", { name: "Simpan Data", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  const vendorDialog = page.getByRole("dialog", { name: "Pilih Dokumen", exact: true });
  await expect(vendorDialog).toBeVisible();
  await vendorDialog.getByRole("button", { name: "Tutup dokumen vendor", exact: true }).click();
  await page.getByRole("button", { name: /2 Evaluasi/ }).click();
  await page.getByRole("button", { name: "Harga Timpang", exact: true }).click();
  await selectPriceVendor(page, catalog!.a5[0].candidate.vendorName);
  await expect(page.getByRole("region", { name: "Overview Harga Timpang", exact: true }).getByRole("figure")).toHaveCount(3);
  const workbook = await exportExcel(page, info, "harga-upload.xlsx");
  expect(workbook.worksheets.map(s => s.name)).toEqual(["Rekap File Harga Timpang"]);
  expect(workbook.worksheets[0].getColumn("R").hidden).toBe(true);
  await checkLayout(page);
  await page.screenshot({ path: info.outputPath("price-upload.png"), fullPage: true });
});

test("spreadsheet edits leave evaluation unchanged", async ({ page }, info) => {
  await page.goto(`${complete}?tab=harga`);
  await selectPriceVendor(page, catalog!.a5[0].candidate.vendorName);
  const original = await exportExcel(page, info, "price-before.xlsx");
  await page.getByRole("button", { name: "Kembali ke identitas & vendor", exact: true }).click();
  await page.locator(".owner-estimate-document").getByRole("link", { name: "Lihat", exact: true }).click();
  await page.getByRole("button", { name: "Edit OE", exact: true }).click();
  const cell = page.locator("tr.oe-row-item td.oe-material").first();
  await cell.dblclick(); await cell.getByRole("textbox").fill("123,45"); await cell.getByRole("textbox").press("Tab");
  await page.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
  await expect(page.getByText("Mode Edit", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await page.getByRole("button", { name: /2 Evaluasi/ }).click();
  await page.getByRole("button", { name: "Harga Timpang", exact: true }).click();
  await selectPriceVendor(page, catalog!.a5[0].candidate.vendorName);
  const after = await exportExcel(page, info, "price-after.xlsx");
  expect(after.worksheets[0].getSheetValues()).toEqual(original.worksheets[0].getSheetValues());
  await openHistory(page);
  await expect(page.getByRole("tab", { name: "Hasil Evaluasi", exact: true })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Aktivitas", exact: true })).toBeVisible();
});

test("price vendor selection prevents another supplier inheriting the prepared result", async ({ page }, info) => {
  await page.goto(`${complete}?tab=harga`);
  const selector = page.getByRole("combobox", { name: "Vendor Harga Timpang", exact: true });
  await expect(selector).toHaveText("Pilih vendor");
  await expect(page.getByRole("figure")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ekspor Excel", exact: true })).toHaveCount(0);
  await selectPriceVendor(page, catalog!.a5[0].candidate.vendorName);
  const ownerId = new URL(page.url()).searchParams.get("vendor")!;
  await expect(page.getByRole("figure")).toHaveCount(3);
  await expect(page.getByText(`Penawaran: ${catalog!.sources.find(s => s.kind === "OFFER")!.name}`, { exact: true })).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor Excel", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toContain(catalog!.a5[0].candidate.vendorName.replace(/[^\w-]/g, "-"));
  const file = info.outputPath("price-owned.xlsx"); await download.saveAs(file);
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile(file);
  expect(workbook.worksheets[0].getCell("B5").value).toBe(`Vendor: ${catalog!.a5[0].candidate.vendorName}`);
  await checkLayout(page);
  await page.screenshot({ path: info.outputPath("price-vendor-result.png"), fullPage: true });
  await selectPriceVendor(page, catalog!.a5[1].candidate.vendorName);
  await expect(page.getByRole("heading", { name: "Belum ada penawaran harga untuk vendor ini", exact: true })).toBeVisible();
  await expect(page.getByRole("figure")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ekspor Excel", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Buka dokumen vendor", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("price-vendor-empty.png"), fullPage: true });
  await page.goBack();
  await expect(selector).toContainText(catalog!.a5[0].candidate.vendorName);
  await expect(page.getByRole("figure")).toHaveCount(3);
  await page.goBack();
  await expect(selector).toHaveText("Pilih vendor");
  await expect(page.getByRole("figure")).toHaveCount(0);
  await page.goto(`${complete}?tab=harga&vendor=outside&hasil=unknown`);
  await expect(selector).toHaveText("Pilih vendor");
  await expect(page.getByRole("figure")).toHaveCount(0);
  await page.goto(`${complete}?tab=harga&vendor=${encodeURIComponent(ownerId)}&hasil=outside`);
  await expect(page.getByRole("figure")).toHaveCount(3);
  await expect(page).not.toHaveURL(/hasil=/);
});
