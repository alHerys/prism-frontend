import { expect, it } from "vitest";
import type { Snapshot } from "../../evaluations/domain/models";
import { requirePriceSnapshot, resolvePriceSnapshotScope } from "./snapshot-scope";
const legacy = (): Snapshot => ({ id: "s", procurementId: "p", module: "PRICE_DEVIATION", status: "COMPLETE", createdAt: "", policy: "", rows: [], excluded: [],
  inputs: { oe: { id: "oe", name: "shared.xlsx", kind: "OE", procurementId: "p" }, offer: { id: "offer", name: "arbitrary.xlsx", kind: "OFFER", procurementId: "p", vendorId: "a" } } });
const vendors = [{ id: "a", name: "Supplier A", procurementId: "p" }, { id: "b", name: "Supplier B", procurementId: "p" }];
it("resolves legacy ownership from the saved offer without mutating its snapshot", () => {
  const snapshot = legacy(), before = structuredClone(snapshot);
  expect(requirePriceSnapshot(snapshot, vendors)).toMatchObject({ vendorId: "a", vendorName: "Supplier A" });
  expect(snapshot).toEqual(before);
  expect(() => requirePriceSnapshot(snapshot)).toThrow("Identitas vendor");
});
it("rejects conflicting metadata, row owners and vendors outside the procurement", () => {
  for (const snapshot of [{ ...legacy(), vendorId: "b" }, { ...legacy(), vendorName: "Supplier B" }, { ...legacy(), vendorName: " " }, { ...legacy(), rows: [{ vendorId: "b" }] }, { ...legacy(), rows: [{ vendorName: "Supplier B" }] }]) {
    expect(resolvePriceSnapshotScope(snapshot, vendors)).toBeUndefined();
    expect(() => requirePriceSnapshot(snapshot, vendors)).toThrow();
  }
  expect(resolvePriceSnapshotScope(legacy(), [{ ...vendors[0], procurementId: "other" }])).toBeUndefined();
});
it("rejects ambiguous inputs rather than guessing a vendor", () => {
  const original = legacy().inputs as { oe: object; offer: object };
  for (const inputs of [{}, null, { ...original, offer: { ...original.offer, vendorId: undefined } }, { ...original, offer: { ...original.offer, procurementId: "other" } }, { ...original, offer: { ...original.offer, sha256: "invalid" } }, { ...original, oe: { ...original.oe, kind: "OFFER" } }])
    expect(resolvePriceSnapshotScope({ ...legacy(), inputs }, vendors)).toBeUndefined();
});
