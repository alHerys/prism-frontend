import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

async function pdfs(names: string[]) {
  const bytes = await readFile("public/files/Form-A5-Nusa.pdf");
  return names.map((name, index) => ({ name, mimeType: "application/pdf", buffer: Buffer.concat([bytes, Buffer.from(`\n% Synthetic test ${index} ${name}\n`)]) }));
}
async function backend(page: Page, names?: Record<string, string>, failFile?: string) {
  const calls: string[] = [];
  let failed = false;
  await page.route("**/api/form-a5/extractions", async route => {
    const request = route.request();
    const file = decodeURIComponent(request.headers()["x-document-filename"]);
    calls.push(file);
    expect(request.headers()["x-goog-api-key"]).toBeUndefined();
    if (file === failFile && !failed) { failed = true; await route.fulfill({ status: 503, json: { error: { code: "PROVIDER_NOT_CONFIGURED" } } }); return; }
    const field = (value: string) => ({ value, quote: value, page: 1 });
    const vendor = names?.[file] ?? `PT Vendor ${file.match(/-(\d+)/)?.[1] ?? "Uji"}`;
    await route.fulfill({ json: { sha256: createHash("sha256").update(request.postDataBuffer()!).digest("hex"), candidate: { vendor_name: vendor, vendor_quote: vendor, hpb: field("1000000000"), hpj: field("300000000"), knb: field("25000000"), tkdn_barang: field("0.4"), tkdn_jasa: field("0.3") }, warnings: [] } });
  });
  return calls;
}
async function newProcurement(page: Page) {
  await page.goto("/pengadaan");
  await page.getByRole("button", { name: "Tambah pengadaan", exact: true }).click();
  await page.getByLabel("Nama pengadaan", { exact: true }).fill("Impor vendor uji");
  await page.getByLabel("Nomor pengadaan", { exact: true }).fill("IMPORT-TEST");
  await page.getByLabel("Fungsi / unit kerja").fill("Maintenance");
  await page.getByRole("button", { name: "Buat pengadaan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tambahkan vendor melalui Form A5" })).toBeVisible();
  const toastClose = page.getByRole("button", { name: "Tutup pemberitahuan", exact: true });
  if (await toastClose.count()) await toastClose.click();
  return new URL(page.url()).pathname;
}
async function selectPdfs(page: Page, files: Awaited<ReturnType<typeof pdfs>>) {
  await page.getByRole("button", { name: "Tambah vendor", exact: true }).click();
  await page.getByRole("dialog", { name: "Tambah vendor", exact: true }).getByLabel("Pilih Form A5 vendor").setInputFiles(files);
}
async function drawer(page: Page) {
  await expect(page.locator(".a5-review-header")).toBeVisible();
  const open = page.getByRole("button", { name: "Periksa nilai", exact: true });
  if (await open.count()) await open.click();
  await expect(page.locator(".review-editor")).toBeVisible();
}
async function confirm(page: Page) {
  await page.getByRole("button", { name: "Konfirmasi vendor & data", exact: true }).click();
  await page.getByRole("dialog", { name: "Konfirmasi vendor & data", exact: true }).getByRole("button", { name: "Konfirmasi", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Konfirmasi vendor & data", exact: true })).toHaveCount(0);
}

test("one primary add action opens a multi-PDF drop dialog and cancellation preserves vendors", async ({ page }, info) => {
  const calls = await backend(page);
  await page.goto("/pengadaan/proc-showcase?tab=ringkasan");
  const panel = page.getByRole("region", { name: "Identitas dan vendor", exact: true });
  const add = panel.getByRole("button", { name: "Tambah vendor", exact: true });
  await expect(add).toHaveCount(1);
  await expect(add).toHaveClass(/primary/);
  await expect(panel.getByRole("button", { name: "Unggah Form A5", exact: true })).toHaveCount(0);
  await add.click();
  const popup = page.getByRole("dialog", { name: "Tambah vendor", exact: true });
  await expect(popup.getByLabel("Pilih Form A5 vendor")).toHaveAttribute("multiple", "");
  await expect(popup.getByText("Unggah satu atau beberapa PDF Form A5. Setiap file mewakili satu vendor.", { exact: true })).toBeVisible();
  const bounds = await popup.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: info.outputPath("add-vendor-upload.png") });
  await popup.getByRole("button", { name: "Tutup unggahan vendor", exact: true }).click();
  await expect(add).toBeFocused();
  await expect(page.locator(".procurement-vendor-card")).toHaveCount(2);
  expect(calls).toEqual([]);
  await add.click();
  await page.keyboard.press("Escape");
  await expect(add).toBeFocused();
  await add.click();
  const files = await pdfs(["Popup-1.pdf", "Popup-2.pdf"]);
  const transfer = await page.evaluateHandle(entries => {
    const data = new DataTransfer();
    for (const entry of entries) data.items.add(new File([new Uint8Array(entry.bytes)], entry.name, { type: "application/pdf" }));
    return data;
  }, files.map(file => ({ name: file.name, bytes: [...file.buffer] })));
  await popup.locator(".upload-zone").dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByRole("tab")).toHaveCount(2);
  await expect(page.getByRole("tab").filter({ hasText: "Perlu diperiksa" })).toHaveCount(2);
  expect(calls).toHaveLength(2);
});

test("five PDFs stay candidates until confirmation, preserve drafts/tabs and return with native sources", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const calls = await backend(page);
  const procurement = await newProcurement(page);
  const files = await pdfs(["A5-1.pdf", "A5-2.pdf", "A5-3.pdf", "A5-4.pdf", "A5-5.pdf"]);
  await selectPdfs(page, files);
  await expect(page.getByRole("tab")).toHaveCount(5);
  await expect(page.getByRole("tab").filter({ hasText: "Perlu diperiksa" })).toHaveCount(5);
  await drawer(page);
  await expect(page.getByLabel("Nama vendor", { exact: true })).toHaveValue("PT Vendor 1");
  const native = page.locator("embed.review-pdf-preview"); const original = await native.elementHandle();
  await expect(native).toHaveAttribute("type", "application/pdf");
  await page.getByLabel("TKDN jasa (%)", { exact: true }).fill("31.5");
  expect(await original!.evaluate(e => e.isConnected)).toBe(true);
  await page.getByRole("tab").nth(0).focus(); await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab").nth(0).click();
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31.5");
  const sourceBytes = await page.evaluate(async () => { const embed = document.querySelector("embed")!; return new TextDecoder().decode((await (await fetch(embed.getAttribute("src")!)).arrayBuffer()).slice(0, 5)); });
  expect(sourceBytes).toBe("%PDF-");
  // A bounded observation delay lets Chrome paint its separate native PDF process.
  await page.waitForTimeout(1000);
  await page.screenshot({ path: info.outputPath("batch-review.png"), fullPage: false });
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Review belum selesai" })).toBeVisible();
  await page.getByRole("button", { name: "Kembali memeriksa", exact: true }).click();
  for (let n = 0; n < 5; n++) await confirm(page);
  await expect(page.getByRole("tab").filter({ hasText: "Terkonfirmasi" })).toHaveCount(5);
  expect(calls).toHaveLength(5);
  await page.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(procurement + "\\?tab=ringkasan"));
  await expect(page.locator(".procurement-vendor-card")).toHaveCount(5);
  await page.getByRole("link", { name: "PT Vendor 1 · Buka dokumen", exact: true }).click();
  await page.getByRole("link", { name: "Buka Form A5", exact: true }).click();
  await drawer(page); await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31.5");
  await expect(page.locator("embed.review-pdf-preview")).toHaveAttribute("src", /^blob:/);
  expect(errors).toEqual([]);
});

test("conflicts require a choice, replacing an A5 preserves the vendor offer, retry is independent", async ({ page }, info) => {
  const calls = await backend(page, { "New-Nusa.pdf": "PT Nusa Teknik Mandiri", "Other-Nusa.pdf": "PT Nusa Teknik Mandiri", "Retry-2.pdf": "PT Vendor 2" }, "Retry-2.pdf");
  await page.goto("/pengadaan/proc-showcase?tab=ringkasan");
  await selectPdfs(page, await pdfs(["New-Nusa.pdf", "Other-Nusa.pdf", "Retry-2.pdf"]));
  const conflict = page.getByRole("dialog", { name: "Pilih Form A5 yang digunakan" });
  await expect(conflict).toBeVisible();
  await expect(conflict.getByRole("button", { name: "Gunakan pilihan" })).toBeDisabled();
  await conflict.getByText("New-Nusa.pdf", { exact: true }).click();
  await page.screenshot({ path: info.outputPath("conflict-selection.png"), fullPage: false });
  await conflict.getByRole("button", { name: "Gunakan pilihan" }).click();
  await drawer(page);
  await expect(page.getByText(/Mengganti Form-A5-Nusa.pdf/)).toBeVisible();
  await page.getByRole("tab").filter({ hasText: "Gagal" }).click();
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.getByLabel("Nama vendor", { exact: true })).toHaveValue("PT Vendor 2");
  await confirm(page);
  await page.getByRole("tab").filter({ hasText: "PT Nusa Teknik Mandiri" }).filter({ hasText: "Perlu diperiksa" }).click();
  await confirm(page);
  await page.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(page.locator(".procurement-vendor-card")).toHaveCount(3);
  await page.getByRole("link", { name: "PT Nusa Teknik Mandiri · Buka dokumen", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Pilih Dokumen" }).getByText("New-Nusa.pdf", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Pilih Dokumen" }).getByText("Penawaran-Nusa.xlsx", { exact: true })).toBeVisible();
  expect(calls.filter(name => name === "New-Nusa.pdf")).toHaveLength(1);
  expect(calls.filter(name => name === "Retry-2.pdf")).toHaveLength(2);
});

test("drag overlay accepts the full panel and refresh discards temporary batches", async ({ page }) => {
  await backend(page);
  await newProcurement(page);
  await page.getByRole("button", { name: "Tambah vendor", exact: true }).click();
  await page.getByRole("button", { name: "Isi nama vendor secara manual", exact: true }).click();
  await page.getByLabel("Nama badan usaha").fill("PT Manual");
  await page.getByRole("dialog", { name: "Tambah vendor", exact: true }).getByRole("button", { name: "Tambah vendor", exact: true }).click();
  const file = (await pdfs(["Drag-1.pdf"]))[0];
  const transfer = await page.evaluateHandle(({ name, bytes }) => { const data = new DataTransfer(); data.items.add(new File([new Uint8Array(bytes)], name, { type: "application/pdf" })); return data; }, { name: file.name, bytes: [...file.buffer] });
  const panel = page.getByRole("region", { name: "Identitas dan vendor", exact: true });
  await panel.dispatchEvent("dragenter", { dataTransfer: transfer });
  await expect(page.getByText("Lepas Form A5 untuk menambahkan vendor", { exact: true })).toBeVisible();
  await page.locator(".procurement-vendor-card").dispatchEvent("drop", { dataTransfer: transfer });
  await expect(page.getByRole("tab")).toHaveCount(1);
  await page.reload();
  await expect(page.getByText("Unggahan sesi tidak ditemukan", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kembali ke daftar pengadaan untuk mengunggah ulang." })).toHaveAttribute("href", "/pengadaan");
});
test("identical PDFs require an explicit file choice before one extraction", async ({ page }) => {
  const calls = await backend(page);
  await newProcurement(page);
  const source = (await pdfs(["Same-1.pdf"]))[0];
  await selectPdfs(page, [source, { ...source, name: "Copy-1.pdf" }]);
  const popup = page.getByRole("dialog", { name: "Pilih Form A5 yang digunakan" });
  await expect(popup).toBeVisible(); expect(calls).toHaveLength(0);
  await popup.getByText("Copy-1.pdf", { exact: true }).click();
  await popup.getByRole("button", { name: "Gunakan pilihan", exact: true }).click();
  await expect(page.getByRole("tab").filter({ hasText: "Perlu diperiksa" })).toHaveCount(1);
  expect(calls).toEqual(["Copy-1.pdf"]);
  await expect(page.getByRole("tab").filter({ hasText: "Dilewati" })).toHaveCount(1);
});
