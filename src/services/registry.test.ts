// @vitest-environment node
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import registry from "../fixtures/file-registry.json";
import { recognizeFile } from "./registry";
const source = registry.find((f) => f.kind === "FORM_A5")!;
describe("Pengenalan berkas lokal", () => {
  it("mengenali isi meski nama diubah dan menolak nama sama dengan isi lain", async () => {
    const bytes = await readFile(`public${source.path}`);
    expect(
      (await recognizeFile(new File([bytes], "nama-baru.pdf"), "FORM_A5")).id,
    ).toBe(source.id);
    await expect(
      recognizeFile(new File(["isi berbeda"], source.name), "FORM_A5"),
    ).rejects.toThrow("belum didukung");
  });
  it("menolak jenis, berkas kosong, dan ukuran di atas batas sebelum membaca isi", async () => {
    await expect(
      recognizeFile(new File(["x"], "dokumen.xlsx"), "FORM_A5"),
    ).rejects.toThrow(".PDF");
    await expect(
      recognizeFile(new File([], "dokumen.pdf"), "FORM_A5"),
    ).rejects.toThrow("Ukuran");
    await expect(
      recognizeFile(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "dokumen.pdf"),
        "FORM_A5",
      ),
    ).rejects.toThrow("10 MiB");
  });
  it("mengizinkan pemilihan ulang berkas yang sama", async () => {
    const bytes = await readFile(`public${source.path}`);
    const f = new File([bytes], source.name);
    expect((await recognizeFile(f, "FORM_A5")).sha256).toBe(
      (await recognizeFile(f, "FORM_A5")).sha256,
    );
  });
});
