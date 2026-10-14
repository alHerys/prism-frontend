import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";

const cell = (page: Page, row = 14, field = "material") => page.locator(`.oe-spreadsheet [data-source-row="${row}"] [data-field="${field}"]`);
async function open(page: Page) {
  await page.goto("/pengadaan/proc-showcase?tab=ringkasan");
  await page.locator(".owner-estimate-document").getByRole("link", { name: "Lihat", exact: true }).click();
  await expect(page.getByRole("treegrid")).toBeVisible();
}
async function change(page: Page, value: string) {
  await cell(page).dblclick();
  const editor = page.getByLabel("Jumlah Harga Material 1.2", { exact: true });
  await editor.fill(value); await editor.press("Tab");
}
const file = () => readFile("public/files/OE-Terminal.xlsx");

test("read-only spreadsheet keeps hierarchy, blank values, combined total and sticky columns", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await open(page);
  await expect(page.getByRole("treegrid").locator("input,textarea")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Jumlah Harga", exact: true })).toHaveAttribute("colspan", "2");
  await expect(cell(page, 13)).toHaveText("");
  await expect(cell(page, 21, "services")).toContainText("Rp 0");
  await expect(cell(page, 24, "combined")).toHaveAttribute("colspan", "2");
  await expect(page.getByRole("treegrid")).not.toContainText("Harga Satuan");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath("oe-view.png"), fullPage: false });
  const scroll = page.locator(".oe-table-scroll");
  const header = page.getByRole("columnheader", { name: "Uraian Pekerjaan", exact: true });
  const start = await header.boundingBox();
  await scroll.evaluate(el => { el.scrollTop = 200; el.scrollLeft = 180; });
  const end = await header.boundingBox();
  expect(Math.abs(start!.x - end!.x)).toBeLessThan(1);
  expect(Math.abs(start!.y - end!.y)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Tutup Semua", exact: true }).click();
  await expect(cell(page)).toHaveCount(0);
  await expect(cell(page, 19, "services")).toBeAttached();
  await page.getByLabel("Cari nomor atau uraian pekerjaan").fill("perlindungan");
  await expect(cell(page, 14, "description")).toContainText("pipa baja 4 inci");
  await expect(cell(page, 15, "description")).toContainText("perlindungan");
  await page.getByLabel("Cari nomor atau uraian pekerjaan").fill("tidak cocok");
  await expect(page.getByText("Tidak ada baris sesuai pencarian.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("keyboard edits, hidden drafts, undo and all three dirty-leave choices work", async ({ page }, info) => {
  await open(page); await page.getByRole("button", { name: "Edit OE", exact: true }).click();
  await cell(page).focus(); await page.keyboard.press("Enter");
  await page.getByLabel("Jumlah Harga Material 1.2", { exact: true }).fill("300.000");
  await page.keyboard.press("Escape");
  await expect(cell(page)).toContainText("200.000");
  await expect(page.getByRole("button", { name: "Simpan Perubahan", exact: true })).toHaveCount(0);
  await change(page, "300.000,123456789");
  await expect(cell(page, 14, "services")).toBeFocused();
  await page.keyboard.press("Shift+Tab"); await expect(cell(page)).toBeFocused();
  await page.keyboard.press("Enter"); await page.keyboard.press("Enter");
  await expect(cell(page, 15)).toBeFocused();
  await page.getByRole("button", { name: "Tutup Semua", exact: true }).click();
  await page.getByRole("button", { name: "Buka Semua", exact: true }).click();
  await expect(cell(page)).toHaveAttribute("data-changed", "true");
  await page.getByRole("button", { name: "Keluar Mode Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Perubahan belum disimpan" });
  await dialog.getByRole("button", { name: "Lanjut Mengedit", exact: true }).click();
  await expect(cell(page)).toContainText("300.000");
  await page.goBack(); await expect(dialog).toBeVisible();
  await page.screenshot({ path: info.outputPath("oe-unsaved.png"), fullPage: false });
  await dialog.getByRole("button", { name: "Lanjut Mengedit", exact: true }).click();
  await page.getByRole("button", { name: "Keluar Mode Edit", exact: true }).click();
  await dialog.getByRole("button", { name: "Buang Perubahan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit OE", exact: true })).toBeVisible();
  await expect(cell(page)).toContainText("200.000");
  await page.getByRole("button", { name: "Edit OE", exact: true }).click();
  await change(page, "300.000,123456789");
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await dialog.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
  await expect(page).not.toHaveURL(/review/);
  await page.locator(".owner-estimate-document").getByRole("link", { name: "Lihat", exact: true }).click();
  await expect(cell(page)).toContainText("300.000");
  await expect(page.getByRole("button", { name: "Konfirmasi Data", exact: true })).toHaveCount(0);
  await expect(cell(page, 24, "combined")).toContainText("1.275.000");
  await expect(page.getByRole("treegrid").locator("input,textarea")).toHaveCount(0);
});

test("invalid hidden values reopen and focus the cell without losing the draft", async ({ page }) => {
  await open(page); await page.getByRole("button", { name: "Edit OE", exact: true }).click();
  await change(page, "-1");
  await page.getByRole("button", { name: "Tutup Semua", exact: true }).click();
  await page.getByLabel("Cari nomor atau uraian pekerjaan").fill("tidak cocok");
  await page.getByRole("button", { name: "Simpan Perubahan", exact: true }).click();
  const input = page.getByLabel("Jumlah Harga Material 1.2", { exact: true });
  await expect(input).toBeFocused(); await expect(input).toHaveValue("-1");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("200.000"); await input.press("Tab");
  await page.getByRole("button", { name: "Keluar Mode Edit", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("actual upload chooses between detail sheets before replacement and confirms without a second dialog", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/pengadaan/proc-showcase?tab=ringkasan");
  await page.getByRole("button", { name: "Ganti OE", exact: true }).click();
  const upload = page.getByLabel("Pilih berkas OE terbaru", { exact: true });
  await upload.setInputFiles({ name: "invalid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.from("invalid") });
  await expect(page.getByRole("alert")).toContainText("tidak dapat dibaca");
  const zip = await JSZip.loadAsync(await file());
  const wb = await zip.file("xl/workbook.xml")!.async("string");
  const rel = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  zip.file("xl/workbook.xml", wb.replace('</x:sheets>', '<x:sheet name="Pilihan kedua" sheetId="3" r:id="rIdExtra" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></x:sheets>'));
  zip.file("xl/_rels/workbook.xml.rels", rel.replace('</Relationships>', '<Relationship Id="rIdExtra" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/></Relationships>'));
  zip.file("xl/worksheets/sheet3.xml", await zip.file("xl/worksheets/sheet2.xml")!.async("string"));
  await upload.setInputFiles({ name: "OE Pilihan.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await zip.generateAsync({ type: "nodebuffer" }) });
  await expect(page.getByText("Pilih tabel detail dari OE Pilihan.xlsx", { exact: true })).toBeVisible();
  await expect(page.locator(".owner-estimate-document")).toContainText("OE-Terminal.xlsx");
  await page.getByLabel("Pilih tabel detail dari OE Pilihan.xlsx").selectOption("Pilihan kedua");
  await page.getByRole("button", { name: "Gunakan Tabel", exact: true }).click();
  await expect(page.getByRole("treegrid")).toBeVisible();
  await expect(page.locator(".oe-table-meta")).toContainText("Pilihan kedua");
  const source = page.getByRole("link", { name: "Buka berkas asli", exact: true });
  const url = await source.getAttribute("href"); expect(url).toMatch(/^blob:/);
  expect(await page.evaluate(async url => (await (await fetch(url!)).arrayBuffer()).byteLength, url)).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "Konfirmasi Data", exact: true }).click();
  await expect(page.getByRole("button", { name: "Konfirmasi Data", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goBack(); await page.goBack();
  expect(errors).toEqual([]);
});
