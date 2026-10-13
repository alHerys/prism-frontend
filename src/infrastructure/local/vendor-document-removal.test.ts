// @vitest-environment node
import { expect, it } from "vitest";
import { createLocalRuntime } from "./runtime";

it.each(["FORM_A5", "OFFER"])("removes %s from active use, preserving vendor, counterpart, evidence and snapshots", async kind => {
  const runtime = createLocalRuntime(true, true);
  const before = runtime.documents.queries.getSnapshot();
  const document = before.documents.find(d => d.procurementId === "proc-showcase" && d.kind === kind)!;
  const counterpart = before.documents.find(d => d.vendorId === document.vendorId && d.kind !== kind)!;
  const snapshots = runtime.evaluations.queries.getSnapshot().snapshots;
  await runtime.documents.gateway.removeVendorDocument(document.procurementId, document.id, document.revision);
  const archived = runtime.documents.queries.getSnapshot().documents.find(d => d.id === document.id)!;
  expect(archived).toEqual({ ...document, removedAt: expect.any(String) });
  expect(runtime.documents.queries.getSnapshot().documents.find(d => d.id === counterpart.id)).toEqual(counterpart);
  expect(runtime.procurement.queries.getSnapshot().vendors).toEqual(before.vendors);
  expect(runtime.procurement.queries.getSnapshot().documents.some(d => d.id === document.id)).toBe(false);
  expect(runtime.evaluations.queries.getSnapshot().snapshots).toEqual(snapshots);
  expect(runtime.processing.availableSources().some(source => source.id === document.sourceId)).toBe(true);
  await expect(runtime.documents.gateway.confirmDocument(document.id, document.revision, true)).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
  await expect(runtime.documents.gateway.removeVendorDocument(document.procurementId, document.id, document.revision)).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
  if (kind === "FORM_A5") await expect(runtime.hea.gateway.evaluateHEA(document.procurementId, [document.id])).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
  else {
    const oe = before.documents.find(d => d.procurementId === document.procurementId && d.kind === "OE")!;
    await expect(runtime.priceDeviation.gateway.evaluateDeviation(document.procurementId, oe.id, document.id)).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
  }
});

it("rejects stale revisions, wrong procurement and non-vendor kinds without mutations", async () => {
  const runtime = createLocalRuntime(true, true);
  const before = runtime.documents.queries.getSnapshot();
  const a5 = before.documents.find(d => d.procurementId === "proc-showcase" && d.kind === "FORM_A5")!;
  const oe = before.documents.find(d => d.procurementId === a5.procurementId && d.kind === "OE")!;
  for (const [procurementId, id, revision, code] of [
    [a5.procurementId, a5.id, a5.revision + 1, "STALE_REVISION"],
    ["proc-terminal", a5.id, a5.revision, "WRONG_SCOPE"],
    [oe.procurementId, oe.id, oe.revision, "WRONG_SCOPE"],
  ] as const) {
    await expect(runtime.documents.gateway.removeVendorDocument(procurementId, id, revision)).rejects.toMatchObject({ code });
    expect(runtime.documents.queries.getSnapshot()).toBe(before);
  }
});
