import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import registry from "./file-registry.json";
describe("registered source files", () => {
  it("matches every downloadable file to its SHA-256 registry entry", () => {
    expect(registry).toHaveLength(8);
    expect(new Set(registry.map((d) => d.id)).size).toBe(8);
    for (const file of registry) {
      const bytes = readFileSync(
        new URL("../../../../public" + file.path, import.meta.url),
      );
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        file.sha256,
      );
      expect(bytes.byteLength).toBeGreaterThan(500);
      expect(file.sources.length).toBeGreaterThan(0);
    }
  });
  it("uses contract decimal strings and individually identified historical periods", () => {
    expect(registry.find((d) => d.id === "a5-nusa")!.values!.hpb).toBe(
      "1000000000",
    );
    expect(registry.find((d) => d.id === "a5-borneo")!.values!.tkdn_jasa).toBe(
      ".35",
    );
    expect(
      registry.filter((d) => d.kind === "HISTORICAL_OE").map((d) => d.period),
    ).toEqual(["2024", "2025", "2026"]);
  });
});
