import { expect, test } from "@playwright/test";

async function openDrawer(page: import("@playwright/test").Page) {
  await expect(page.locator(".a5-review-header")).toBeVisible();
  const opener = page.getByRole("button", { name: "Periksa nilai", exact: true });
  if (await opener.count()) await opener.click();
  await expect(page.getByRole("complementary", { name: "Panel koreksi", exact: true })).toBeVisible();
}

test("native PDF and compact header retain correction, confirmation and vendor return", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = page.waitForResponse(response => response.url().endsWith("/files/Form-A5-Nusa.pdf"));
  await page.goto("/pengadaan/proc-terminal/review/doc-21");
  const file = await response;
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toContain("application/pdf");
  // Chrome exposes its plugin HTML for navigated PDFs; fetch source bytes separately.
  const bytes = await page.request.get("/files/Form-A5-Nusa.pdf");
  expect((await bytes.body()).subarray(0, 5).toString()).toBe("%PDF-");
  const pdf = page.locator("embed.review-pdf-preview");
  await expect(pdf).toHaveAttribute("type", "application/pdf");
  await expect(pdf).toHaveAttribute("src", "/files/Form-A5-Nusa.pdf");
  await expect(page.locator("header").getByRole("heading", { name: "Form_A5_Nusa.pdf", exact: true })).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: "Tutup bukti sumber", exact: true })).toBeVisible();
  await expect(page.locator(".review-document-bar, .review-document-identity, .pdf-preview-toolbar")).toHaveCount(0);
  await expect(page.getByText("PRC-2026-001 · PT Nusa Teknik Mandiri", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Terkonfirmasi", { exact: true })).toHaveCount(0);
  await openDrawer(page);
  await expect(page.getByText("Sesuaikan dengan data terlampir sebenarnya pada Form A5", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Harga Penawaran Barang", { exact: true })).toHaveValue("1.000.000.000");
  await expect(page.getByLabel("Harga Penawaran Jasa", { exact: true })).toHaveValue("300.000.000");
  await expect(page.getByLabel("Komponen Bukan Biaya", { exact: true })).toHaveValue("25.000.000");
  const sourceBounds = await pdf.boundingBox();
  const editorBounds = await page.locator(".review-editor").boundingBox();
  if (page.viewportSize()!.width >= 900) {
    expect(sourceBounds!.width).toBeGreaterThan(editorBounds!.width * 1.8);
    expect(editorBounds!.x).toBeGreaterThan(sourceBounds!.x);
  }
  expect(sourceBounds!.height).toBeGreaterThan(page.viewportSize()!.height * .65);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  // Browser plugin contents cannot be captured reliably; the source response is checked above.
  await page.screenshot({ path: info.outputPath("a5-drawer-open.png"), fullPage: false });
  await page.getByLabel("TKDN jasa (%)", { exact: true }).fill("31");
  await expect(page.getByText("Dikoreksi", { exact: true })).toBeVisible();
  const originalFrame = await pdf.elementHandle();
  await page.getByRole("button", { name: "Tutup panel koreksi", exact: true }).click();
  await expect(page.getByRole("button", { name: "Periksa nilai", exact: true })).toBeFocused();
  await expect(page.locator(".review-drawer")).toHaveAttribute("inert", "");
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toBeHidden();
  expect(await originalFrame!.evaluate(element => element.isConnected)).toBe(true);
  await page.screenshot({ path: info.outputPath("a5-drawer-closed.png"), fullPage: false });
  await openDrawer(page);
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
  await page.getByLabel("TKDN jasa (%)", { exact: true }).press("Escape");
  await expect(page.getByRole("button", { name: "Periksa nilai", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Tutup bukti sumber", exact: true }).click();
  await expect(pdf).toBeHidden();
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
  await page.getByRole("button", { name: "Tampilkan bukti sumber", exact: true }).click();
  await expect(pdf).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  const leave = page.getByRole("dialog", { name: "Perubahan belum disimpan", exact: true });
  await leave.getByRole("button", { name: "Tetap di halaman", exact: true }).click();
  await expect(leave).toHaveCount(0);
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
  await page.getByRole("button", { name: "Konfirmasi data", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Konfirmasi data dokumen", exact: true });
  await confirmation.getByRole("button", { name: "Konfirmasi data", exact: true }).click();
  await expect(page).toHaveURL(/tab=ringkasan&vendor=vendor-nusa/);
  await page.getByRole("dialog", { name: "Pilih Dokumen", exact: true }).getByRole("link", { name: "Buka Form A5", exact: true }).click();
  await openDrawer(page);
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
  await expect(page.getByRole("button", { name: "Konfirmasi data", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test("drawer motion supports interruption, keyboard and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/pengadaan/proc-terminal/review/doc-21");
  await openDrawer(page);
  expect(await page.locator(".review-drawer-content").evaluate(element => getComputedStyle(element).transitionDuration.split(",").some(value => parseFloat(value) >= .2))).toBe(true);
  await page.getByRole("button", { name: "Tutup nilai", exact: true }).click();
  await page.getByRole("button", { name: "Periksa nilai", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tutup panel koreksi", exact: true })).toBeFocused();
  await page.getByLabel("TKDN jasa (%)", { exact: true }).fill("32");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.locator(".review-drawer-content").evaluate(element => getComputedStyle(element).transitionDuration.split(",").every(value => parseFloat(value) <= .001))).toBe(true);
  await page.getByRole("button", { name: "Tutup panel koreksi", exact: true }).click();
  await openDrawer(page);
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("32");
});

test("A5 warnings still require evaluator acknowledgement", async ({ page }) => {
  await page.goto("/pengadaan/proc-terminal/review/doc-22");
  await openDrawer(page);
  await expect(page.getByRole("button", { name: "Konfirmasi data", exact: true })).toBeDisabled();
  await page.getByLabel("TKDN jasa (%)", { exact: true }).fill("35");
  await page.getByRole("checkbox", { name: /Saya telah memeriksa/ }).check();
  await expect(page.getByRole("button", { name: "Konfirmasi data", exact: true })).toBeEnabled();
});
