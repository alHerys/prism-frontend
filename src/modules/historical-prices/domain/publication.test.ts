// @vitest-environment node
import { expect, it } from "vitest";
import { reviewedMetadata, assertPublishable } from "./publication";
const document = { kind: "HISTORICAL_OE", status: "CONFIRMED", revision: 2, published: true, functionName: "Maintenance", period: "2024" };
it("keeps metadata no-ops and invalidates confirmation/publication on a correction", () => {
  expect(reviewedMetadata(document, { functionName: "Maintenance", period: "2024" })).toBeUndefined();
  expect(reviewedMetadata(document, { functionName: "Maintenance", period: "2023" })).toEqual({ functionName: "Maintenance", period: "2023", revision: 3, status: "REVIEW_REQUIRED", published: false });
  expect(document.published).toBe(true);
});
it("preserves validation order and publication preconditions", () => {
  expect(() => reviewedMetadata({ ...document, kind: "OE" }, { functionName: "", period: "invalid" })).toThrow("Fungsi wajib diisi.");
  expect(() => reviewedMetadata({ ...document, kind: "OE" }, { functionName: "Maintenance", period: "invalid" })).toThrow("Periode harus berupa tahun empat digit.");
  expect(() => assertPublishable({ ...document, status: "REVIEW_REQUIRED" })).toThrow("Lengkapi fungsi/periode dan konfirmasi dokumen.");
  expect(() => assertPublishable(document)).toThrow("Dokumen sudah dipublikasikan.");
});
