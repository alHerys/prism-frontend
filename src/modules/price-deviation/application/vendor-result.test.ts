import { expect, it } from "vitest";
import { vendorPriceResult } from "./vendor-result";
import type { PriceDeviationData } from "./queries";
import type { DocumentRecord } from "../../documents/domain/models";
import type { Snapshot } from "../../evaluations/domain/models";
const document = (id: string, kind: "OE" | "OFFER", vendorId?: string): DocumentRecord => ({ id, name: id + ".xlsx", procurementId: "p", kind, vendorId, sourceId: id, uploadedAt: "", revision: 1, status: "CONFIRMED", published: false, warnings: [], sources: [], groups: [], pairs: [], acknowledged: true });
function data(): PriceDeviationData {
  const oe = document("oe", "OE"), a = document("a-offer", "OFFER", "a"), b = document("b-offer", "OFFER", "b");
  const snapshot = (offer: DocumentRecord, classification: string): Snapshot => ({ id: `result-${offer.vendorId}`, procurementId: "p", module: "PRICE_DEVIATION", status: "COMPLETE", policy: "", excluded: [], createdAt: "2026-01-01", inputs: { oe, offer }, rows: [{ category: "MATERIAL", classification }] });
  return { vendors: [{ id: "a", name: "Supplier A", procurementId: "p" }, { id: "b", name: "Supplier B", procurementId: "p" }], documents: [oe, a, b], snapshots: [snapshot(a, "TIMPANG"), snapshot(b, "TIDAK_TIMPANG")] };
}
it("requires explicit selection and never falls back to a different vendor", () => {
  const state = data();
  expect(vendorPriceResult(state, "p")).toEqual({ kind: "empty", reason: "choose-vendor" });
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ kind: "ready", snapshot: { vendorId: "a", rows: [{ classification: "TIMPANG" }] } });
  expect(vendorPriceResult(state, "p", "b")).toMatchObject({ kind: "ready", snapshot: { vendorId: "b", rows: [{ classification: "TIDAK_TIMPANG" }] } });
  state.snapshots.pop();
  expect(vendorPriceResult(state, "p", "b")).toEqual({ kind: "empty", reason: "no-result" });
  expect(vendorPriceResult(state, "other", "a")).toEqual({ kind: "empty", reason: "no-vendors" });
});
it("distinguishes missing and unsaved sources", () => {
  const state = data(); state.documents[0].status = "REVIEW_REQUIRED";
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ reason: "oe-review" });
  state.documents[0].removedAt = "now";
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ reason: "no-oe" });
  delete state.documents[0].removedAt; state.documents[0].status = "CONFIRMED";
  state.documents[1].status = "REVIEW_REQUIRED";
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ reason: "offer-review" });
  state.documents[1].supersededBy = "new";
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ reason: "no-offer" });
});
it("rejects obsolete and ambiguous results while retaining other vendor results", () => {
  const state = data(); const original = structuredClone(state.snapshots);
  state.documents.push({ ...document("new-offer", "OFFER", "a"), uploadedAt: "2026-01-02" });
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ reason: "no-result" });
  expect(vendorPriceResult(state, "p", "b")).toMatchObject({ kind: "ready" });
  state.snapshots[1].vendorId = "a";
  expect(vendorPriceResult(state, "p", "b")).toMatchObject({ reason: "no-result" });
  state.snapshots = original; state.documents.push({ ...document("new-oe", "OE"), uploadedAt: "2026-01-02" });
  for (const id of ["a", "b"]) expect(vendorPriceResult(state, "p", id)).toMatchObject({ reason: "no-result" });
  expect(state.snapshots).toEqual(original);
});
it("uses the newest eligible owner snapshot and rejects a changed source hash", () => {
  const state = data(), previous = structuredClone(state.snapshots[0]);
  state.snapshots.push({ ...previous, id: "newer-a", createdAt: "2026-01-02" });
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ snapshot: { id: "newer-a" } });
  state.documents[1].sha256 = "a".repeat(64);
  state.snapshots.forEach(s => { if (s.id !== "result-b") (s.inputs as { offer: DocumentRecord }).offer = { ...state.documents[1], sha256: "b".repeat(64) }; });
  expect(vendorPriceResult(state, "p", "a")).toMatchObject({ reason: "no-result" });
  expect(vendorPriceResult(state, "p", "b")).toMatchObject({ kind: "ready" });
});
