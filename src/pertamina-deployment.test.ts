// @vitest-environment node
import { expect, it, vi } from "vitest";
import { digest, packageAssets, remotePackage } from "../scripts/pertamina-package.mjs";
const fixture = () => {
  const ids = ["PD-001", "PD-002", "HEA-001", "HEA-002"];
  const bytes = Buffer.from("independent synthetic bytes");
  return {
    catalog: { version: 1, sources: ids.map((id, index) => ({ id, kind: index > 1 ? "FORM_A5" : index ? "OFFER" : "OE", path: `/_pertamina/source/${id}`, sha256: digest(bytes), relativePath: "raw/private-host-location" })) },
    files: ids.map(id => ({ id, base64: bytes.toString("base64") })),
  };
};
it("emits only registered sources and removes host paths without mutating the input", () => {
  const input = fixture(), before = structuredClone(input);
  const assets = packageAssets(input);
  expect(assets.size).toBe(5);
  expect(assets.get("/_pertamina/catalog.json")?.bytes.toString()).not.toContain("relativePath");
  expect(assets.get("/_pertamina/source/HEA-001")?.mime).toBe("application/pdf");
  expect(input).toEqual(before);
});
it("rejects modified source bytes, duplicate identities and arbitrary output paths", () => {
  const corrupt = fixture(); corrupt.files[0].base64 = Buffer.from("modified").toString("base64");
  expect(() => packageAssets(corrupt)).toThrow();
  const duplicate = fixture(); duplicate.catalog.sources[1] = duplicate.catalog.sources[0];
  expect(() => packageAssets(duplicate)).toThrow();
  const traversal = fixture(); traversal.catalog.sources[0].path = "/../../index.html";
  expect(() => packageAssets(traversal)).toThrow();
});
it("requires HTTPS and a pinned hash before any remote download", async () => {
  await expect(remotePackage("http://example.invalid/package", "0".repeat(64))).rejects.toThrow("HTTPS");
  await expect(remotePackage("https://example.invalid/package")).rejects.toThrow("SHA-256");
});

it("verifies downloaded package bytes and keeps signed URLs out of failures", async () => {
  const bundle = fixture(), bytes = Buffer.from(JSON.stringify(bundle));
  const fetcher = vi.fn().mockResolvedValue(new Response(bytes));
  vi.stubGlobal("fetch", fetcher);
  try {
    await expect(remotePackage("https://storage.invalid/package?token=private", digest(bytes))).resolves.toEqual(bundle);
    fetcher.mockResolvedValue(new Response(bytes));
    await expect(remotePackage("https://storage.invalid/package?token=private", "0".repeat(64))).rejects.toThrow("tidak dapat diverifikasi");
    fetcher.mockRejectedValue(new Error("token=private"));
    await expect(remotePackage("https://storage.invalid/package?token=private", digest(bytes))).rejects.not.toThrow("private");
  } finally { vi.unstubAllGlobals(); }
});
