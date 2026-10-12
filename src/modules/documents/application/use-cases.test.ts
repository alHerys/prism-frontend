// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createDocumentsUseCases } from "./use-cases";
import type { DocumentsGateway, DocumentProcessing } from "./ports";
import type { PriceDeviationGateway } from "../../price-deviation/application/ports";
import type { DocumentRecord } from "../domain/models";
const document: DocumentRecord = { id: "doc", procurementId: "proc", sourceId: "source", name: "Offer", kind: "OFFER", uploadedAt: "", revision: 3, status: "REVIEW_REQUIRED", warnings: [], acknowledged: false, sources: [], groups: [], pairs: [], published: false };
function fake() {
  const gateway: DocumentsGateway = { removeOwnerEstimate: vi.fn(async () => {}), uploadDocument: vi.fn(async () => document), reviewDocument: vi.fn(async () => document), confirmDocument: vi.fn(async () => document) };
  const processing: DocumentProcessing = { process: vi.fn(async () => ({ id: "source", name: "Source", path: "/source", kind: "OFFER" as const })), availableSources: () => [] };
  const prices: Pick<PriceDeviationGateway, "selectGroup" | "reviewPairs" | "confirmPairs"> = { selectGroup: vi.fn(async () => ({ ...document, revision: 4 })), reviewPairs: vi.fn(async () => document), confirmPairs: vi.fn(async () => document) };
  return { gateway, processing, prices, commands: createDocumentsUseCases(gateway, processing, prices) };
}
it("uses the revision returned by group selection before saving pairs", async () => {
  const f = fake();
  await f.commands.saveReview({ document, group: "Selected", pairs: [] });
  expect(f.prices.selectGroup).toHaveBeenCalledWith("doc", "Selected", 3);
  expect(f.prices.reviewPairs).toHaveBeenCalledWith("doc", [], 4);
});
it("does not save pairs after a rejected group revision", async () => {
  const f = fake();
  const error = Object.assign(new Error("Stale"), { code: "STALE_REVISION" });
  vi.mocked(f.prices.selectGroup).mockRejectedValue(error);
  await expect(f.commands.saveReview({ document, group: "Selected", pairs: [] })).rejects.toBe(error);
  expect(f.prices.reviewPairs).not.toHaveBeenCalled();
});
it("uploads only after processing succeeds, using source identity and the original file name", async () => {
  const f = fake();
  const file = { name: "renamed.xlsx", size: 2, arrayBuffer: async () => new ArrayBuffer(2) };
  await f.commands.upload({ file, procurementId: "proc", kind: "OFFER", vendorId: "vendor" }, vi.fn());
  expect(f.gateway.uploadDocument).toHaveBeenCalledWith({ procurementId: "proc", vendorId: "vendor", kind: "OFFER", sourceId: "source", name: "renamed.xlsx" });
  vi.mocked(f.processing.process).mockRejectedValue(new Error("Unsupported"));
  await expect(f.commands.upload({ file, procurementId: "proc", kind: "OFFER" }, vi.fn())).rejects.toThrow("Unsupported");
  expect(f.gateway.uploadDocument).toHaveBeenCalledTimes(1);
});
