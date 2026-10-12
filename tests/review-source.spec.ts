import { expect, test } from "@playwright/test";

function twoPagePdf() {
  const content = (text: string) => `BT /F1 24 Tf 40 700 Td (${text}) Tj ET`;
  const page = (stream: number) => `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents ${stream} 0 R >>`;
  const streams = [content("FORM A5"), content("LAMPIRAN")];
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>", page(6), page(7), "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", ...streams.map(stream => `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

test("A5 gives the PDF priority and retains correction, confirmation and vendor return", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/pengadaan/proc-terminal/review/doc-21");
  await expect(page.getByRole("heading", { name: "Periksa Form A5", exact: true })).toBeVisible();
  const pdf = page.locator(".review-pdf-preview");
  await expect(pdf).toHaveAttribute("data-source-url", "/files/Form-A5-Nusa.pdf");
  await expect(pdf.locator(".pdf-preview-page")).toHaveAttribute("data-rendered", "true");
  await expect(pdf.locator(".pdf-text-layer")).toContainText("FORM A5");
  // A DOM placeholder is insufficient: ensure the actual PDF painted pixels.
  expect(await pdf.locator("canvas").evaluate(canvas => {
    const element = canvas as HTMLCanvasElement;
    const pixels = element.getContext("2d")!.getImageData(0, 0, element.width, element.height).data;
    let ink = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 240 && pixels[i + 3]) ink++;
    return ink / (element.width * element.height);
  })).toBeGreaterThan(.02);
  await expect(page.getByText("Sesuaikan dengan data terlampir sebenarnya pada Form A5", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Harga Penawaran Barang", { exact: true })).toHaveValue("1.000.000.000");
  await expect(page.getByLabel("Harga Penawaran Jasa", { exact: true })).toHaveValue("300.000.000");
  await expect(page.getByLabel("Komponen Bukan Biaya", { exact: true })).toHaveValue("25.000.000");
  const sourceBounds = await pdf.boundingBox();
  const editorBounds = await page.locator(".review-editor").boundingBox();
  if (page.viewportSize()!.width >= 900) {
    expect(sourceBounds!.width).toBeGreaterThan(editorBounds!.width * 1.8);
    expect(sourceBounds!.height).toBeGreaterThan(page.viewportSize()!.height * .65);
    expect(editorBounds!.x).toBeGreaterThan(sourceBounds!.x);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  } else expect(editorBounds!.y).toBeGreaterThan(sourceBounds!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: info.outputPath("a5-review.png"), fullPage: false });
  const initialWidth = await pdf.locator("canvas").evaluate(canvas => (canvas as HTMLCanvasElement).width);
  await pdf.getByRole("button", { name: "Perbesar PDF", exact: true }).click();
  await expect(pdf.getByRole("button", { name: "125%", exact: true })).toBeVisible();
  await expect(pdf.locator(".pdf-preview-page")).toHaveAttribute("data-rendered", "true");
  expect(await pdf.locator("canvas").evaluate(canvas => (canvas as HTMLCanvasElement).width)).toBeGreaterThan(initialWidth);
  await pdf.getByRole("button", { name: "125%", exact: true }).click();
  await page.getByLabel("TKDN jasa (%)", { exact: true }).fill("31");
  await expect(page.getByText("Dikoreksi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tutup bukti sumber", exact: true }).click();
  await expect(pdf).toHaveCount(0);
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
  await page.getByRole("button", { name: "Tampilkan bukti sumber", exact: true }).click();
  await expect(pdf).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke pengadaan", exact: true }).click();
  await page.getByRole("dialog", { name: "Perubahan belum disimpan", exact: true }).getByRole("button", { name: "Tetap di halaman", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Perubahan belum disimpan", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
  await page.getByRole("button", { name: "Konfirmasi data", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Konfirmasi data dokumen", exact: true });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Konfirmasi data", exact: true }).click();
  await expect(page).toHaveURL(/tab=ringkasan&vendor=vendor-nusa/);
  await page.getByRole("dialog", { name: "Pilih Dokumen", exact: true }).getByRole("link", { name: "Buka Form A5", exact: true }).click();
  await expect(page.locator(".review-document-identity")).toContainText("Terkonfirmasi");
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
  expect(errors).toEqual([]);
});

test("PDF loading failures offer a retry without losing the review draft", async ({ page }) => {
  let fail = true;
  await page.route("**/files/Form-A5-Nusa.pdf", route => fail ? route.abort() : route.continue());
  await page.goto("/pengadaan/proc-terminal/review/doc-21");
  await expect(page.getByRole("alert")).toContainText("PDF belum dapat ditampilkan.");
  await page.getByLabel("TKDN jasa (%)", { exact: true }).fill("31");
  fail = false;
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.locator(".pdf-preview-page")).toHaveAttribute("data-rendered", "true");
  await expect(page.getByLabel("TKDN jasa (%)", { exact: true })).toHaveValue("31");
});

test("PDF pages and classic scrollbars do not trigger a render loop", async ({ page }) => {
  await page.route("**/files/Form-A5-Nusa.pdf", route => route.fulfill({ contentType: "application/pdf", body: twoPagePdf() }));
  await page.goto("/pengadaan/proc-terminal/review/doc-21");
  const pdf = page.locator(".review-pdf-preview");
  await expect(pdf.locator(".pdf-preview-page")).toHaveAttribute("data-rendered", "true");
  // Force a scrollbar that consumes width, including in headless Chrome.
  await page.addStyleTag({ content: ".pdf-preview-viewport { scrollbar-gutter: auto !important; } .pdf-preview-viewport::-webkit-scrollbar { width: 18px; height: 18px; }" });
  await pdf.getByRole("button", { name: "Halaman berikutnya", exact: true }).click();
  await expect(pdf.locator(".pdf-text-layer")).toContainText("LAMPIRAN");
  await expect(pdf).toContainText("Halaman 2 / 2");
  await expect(pdf.getByRole("button", { name: "Halaman berikutnya", exact: true })).toBeDisabled();
  await pdf.getByRole("button", { name: "Halaman sebelumnya", exact: true }).click();
  await expect(pdf.locator(".pdf-text-layer")).toContainText("FORM A5");
  await expect(pdf.locator(".pdf-preview-page")).toHaveAttribute("data-rendered", "true");
  const transitions = await pdf.locator(".pdf-preview-page").evaluate(element => new Promise<number>(resolve => {
    let count = 0;
    const observer = new MutationObserver(records => { count += records.filter(record => record.attributeName === "data-rendered").length; });
    observer.observe(element, { attributes: true });
    setTimeout(() => { observer.disconnect(); resolve(count); }, 1200);
  }));
  expect(transitions).toBe(0);
});

test("A5 warnings still require evaluator acknowledgement", async ({ page }) => {
  await page.goto("/pengadaan/proc-terminal/review/doc-22");
  await expect(page.getByRole("button", { name: "Konfirmasi data", exact: true })).toBeDisabled();
  await page.getByLabel("TKDN jasa (%)", { exact: true }).fill("35");
  await page.getByRole("checkbox", { name: /Saya telah memeriksa/ }).check();
  await expect(page.getByRole("button", { name: "Konfirmasi data", exact: true })).toBeEnabled();
});
