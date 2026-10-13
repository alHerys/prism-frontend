import { it, expect, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createIntakeAssets } from "./intake-assets";

it("bounds PDF ingress, hashes exact bytes, and revokes only released temporary sources", async () => {
  vi.stubGlobal("crypto", webcrypto);
  const create = vi.fn(() => "blob:test"), revoke = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
  try {
    const assets = createIntakeAssets();
    const bytes = new TextEncoder().encode("%PDF-1.7\n% Synthetic test\n%%EOF").buffer;
    const file = { name: "A5.pdf", size: bytes.byteLength, arrayBuffer: async () => bytes };
    const source = await assets.prepare(file);
    expect(source.sha256).toMatch(/^[a-f0-9]{64}$/); expect(assets.sources()).toHaveLength(1);
    expect(await assets.file(source.id).arrayBuffer()).toEqual(bytes);
    await expect(assets.prepare({ ...file, name: "bad.xlsx" })).rejects.toThrow("PDF");
    await expect(assets.prepare({ ...file, size: 11 * 1024 * 1024 })).rejects.toThrow("10 MiB");
    await expect(assets.prepare({ ...file, arrayBuffer: async () => new ArrayBuffer(bytes.byteLength) })).rejects.toThrow("bukan PDF");
    assets.release(source.id); expect(revoke).toHaveBeenCalledWith("blob:test"); expect(assets.sources()).toHaveLength(0);
  } finally { vi.unstubAllGlobals(); }
});
