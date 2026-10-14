import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
const cell = (page: Page, row = 13, field = "material") => page.locator(`.oe-spreadsheet [data-source-row="${row}"] [data-field="${field}"]`);
const open = async (page: Page) => { await page.goto("/pengadaan/proc-showcase/review/doc-28"); await expect(page.getByRole("treegrid")).toBeVisible(); };
async function change(page: Page, value: string) {
  await cell(page).dblclick();
  await page.getByLabel("Jumlah Harga Material 1.2", { exact: true }).fill(value);
  await page.keyboard.press("Tab");
}

test("readonly offer uses source styling, merged headers, child markers and header-only sticky scrolling", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await open(page);
  await expect(page.getByRole("treegrid").locator("input,textarea,.oe-expand")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Uraian Pekerjaan", exact: true })).toHaveAttribute("colspan", "2");
  await expect(page.getByRole("treegrid")).not.toContainText("Harga Satuan");
  await expect(page.getByRole("treegrid")).not.toContainText("Volume");
  await expect(cell(page)).toHaveText("250.000");
  await expect(cell(page, 12)).toHaveText("");
  await expect(cell(page, 23, "services")).toHaveText("-");
  await expect(cell(page, 26, "combined")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(cell(page, 20, "description")).toHaveCSS("text-align", "center");
  await expect(cell(page, 20, "description")).toHaveCSS("background-color", "rgb(255, 255, 0)");
  await expect(cell(page, 11, "description")).toHaveCSS("background-color", "rgb(209, 209, 209)");
  await expect(page.locator('[data-source-row="14"] .oe-marker')).toHaveText("-");
  await expect(page.locator('[data-source-row="15"] .oe-marker')).toHaveText("1.2.1");
  await expect(page.locator('[data-source-row="19"]')).toHaveClass(/oe-row-empty/);
  await expect(page.locator('.oe-spreadsheet tbody tr')).toHaveCount(17);
  if (info.project.name.startsWith("phone")) {
    expect((await page.getByRole("heading", { name: "Penawaran Harga", exact: true }).boundingBox())!.height).toBeLessThan(40);
    expect((await page.locator(".oe-review-header").boundingBox())!.height).toBeLessThan(220);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath("offer-view.png"), fullPage: false });
  const scroll = page.locator(".oe-table-scroll");
  if (info.project.name.startsWith("desktop")) await scroll.evaluate(el => { el.style.maxWidth = "860px"; });
  const header = page.getByRole("columnheader", { name: "Uraian Pekerjaan", exact: true });
  const before = await header.boundingBox();
  await scroll.evaluate(el => { el.scrollTop = 200; el.scrollLeft = 120; });
  const offset = await scroll.evaluate(el => el.scrollLeft);
  const after = await header.boundingBox();
  expect(offset).toBeGreaterThan(0);
  expect(before!.x - after!.x).toBeCloseTo(offset, 0);
  expect(before!.y).toBeCloseTo(after!.y, 0);
  await expect(cell(page, 13, "description")).not.toHaveCSS("position", "sticky");
  await page.getByLabel("Cari nomor atau uraian pekerjaan").fill("1.2.1");
  await expect(cell(page, 13, "description")).toContainText("pipa");
  await expect(page.locator('[data-source-row="15"] .oe-marker')).toHaveText("1.2.1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("keyboard edits retain exact precision, highlight and separate pair data after save", async ({ page }) => {
  await open(page); await page.getByRole("button", { name: "Edit Penawaran", exact: true }).click();
  await cell(page, 15, "description").focus(); await page.keyboard.press("Tab");
  await expect(cell(page, 15)).toBeFocused();
  await cell(page).focus(); await page.keyboard.press("Enter");
  await page.getByLabel("Jumlah Harga Material 1.2", { exact: true }).fill("999");
  await page.keyboard.press("Escape"); await expect(cell(page)).toHaveText("250.000");
  await change(page, "300.000,123456789");
  await expect(cell(page, 13, "services")).toBeFocused();
  await expect(cell(page)).toHaveAttribute("data-changed", "true");
  await page.getByLabel("Cari nomor atau uraian pekerjaan").fill("tidak ada");
  await page.getByRole("button", { name: "Hapus pencarian Penawaran", exact: true }).click();
  await expect(cell(page)).toHaveAttribute("data-changed", "true");
  await page.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Penawaran", exact: true })).toBeVisible();
  await expect(cell(page, 26, "combined")).toHaveText("1.095.000");
  await page.getByRole("button", { name: "Edit Penawaran", exact: true }).click();
  await cell(page).dblclick(); await expect(page.getByLabel("Jumlah Harga Material 1.2", { exact: true })).toHaveValue("300000,123456789");
  await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Keluar Mode Edit", exact: true }).click();
  await page.getByRole("button", { name: "Periksa Pasangan Harga", exact: true }).click();
  await expect(page.getByLabel("Penawaran Pipa baja 4 inci", { exact: true })).toHaveValue("125000");
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await expect(page.getByRole("treegrid")).toBeVisible();
});

test("invalid edits and all dirty leave choices retain or discard the correct spreadsheet", async ({ page }) => {
  await open(page); await page.getByRole("button", { name: "Edit Penawaran", exact: true }).click();
  await change(page, "-1");
  await page.getByLabel("Cari nomor atau uraian pekerjaan").fill("tidak cocok");
  await page.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
  await expect(page.getByLabel("Jumlah Harga Material 1.2", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Jumlah Harga Material 1.2", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Jumlah Harga Material 1.2", { exact: true }).fill("300.000"); await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Periksa Pasangan Harga", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Perubahan belum disimpan", exact: true });
  await dialog.getByRole("button", { name: "Lanjut Mengedit", exact: true }).click();
  await expect(cell(page)).toHaveAttribute("data-changed", "true");
  await page.getByRole("button", { name: "Keluar Mode Edit", exact: true }).click();
  await dialog.getByRole("button", { name: "Buang Perubahan", exact: true }).click();
  await expect(cell(page)).toHaveText("250.000");
  await page.getByRole("button", { name: "Edit Penawaran", exact: true }).click(); await change(page, "300.000");
  await page.getByRole("button", { name: "Periksa Pasangan Harga", exact: true }).click();
  await dialog.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
  await expect(page.getByLabel("Kelompok harga yang digunakan")).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await expect(cell(page)).toHaveText("300.000");
});

test("actual upload requires detail choice, confirms only the sheet and preserves source bytes", async ({ page }) => {
  await page.goto("/pengadaan/proc-showcase/vendor/showcase-borneo");
  const upload = page.getByLabel("Unggah Penawaran Harga", { exact: true });
  await upload.setInputFiles({ name: "invalid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.from("invalid") });
  await expect(page.getByRole("alert")).toContainText("tidak dapat dibaca");
  const zip = await JSZip.loadAsync(await readFile("public/files/Penawaran-Nusa.xlsx"));
  const wb = await zip.file("xl/workbook.xml")!.async("string");
  const rel = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  zip.file("xl/workbook.xml", wb.replace('</x:sheets>', '<x:sheet name="Pilihan kedua" sheetId="3" r:id="rIdExtra" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></x:sheets>'));
  zip.file("xl/_rels/workbook.xml.rels", rel.replace('</Relationships>', '<Relationship Id="rIdExtra" Target="worksheets/sheet3.xml"/></Relationships>'));
  zip.file("xl/worksheets/sheet3.xml", (await zip.file("xl/worksheets/sheet2.xml")!.async("string")).replace('<x:v>250000</x:v>', '<x:v>400000</x:v>'));
  await upload.setInputFiles({ name: "Pilihan Penawaran.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await zip.generateAsync({ type: "nodebuffer" }) });
  await expect(page.getByLabel("Pilih tabel detail dari Pilihan Penawaran.xlsx")).toBeVisible();
  await expect(page.getByRole("link", { name: "Buka Penawaran Harga", exact: true })).toHaveCount(0);
  await page.getByLabel("Pilih tabel detail dari Pilihan Penawaran.xlsx").selectOption("Pilihan kedua");
  await page.getByRole("button", { name: "Gunakan Tabel", exact: true }).click();
  await expect(cell(page)).toHaveText("400.000");
  const url = await page.getByRole("link", { name: "Buka berkas asli", exact: true }).getAttribute("href"); expect(url).toMatch(/^blob:/);
  await page.getByRole("button", { name: "Konfirmasi Data", exact: true }).click();
  await expect(page.getByRole("button", { name: "Konfirmasi Data", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Periksa Pasangan Harga", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pasangan harga belum tersedia", exact: true })).toBeVisible();
});
