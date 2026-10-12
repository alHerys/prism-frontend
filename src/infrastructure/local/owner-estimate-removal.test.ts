// @vitest-environment node
import { expect, it } from "vitest";
import { createLocalRuntime } from "./runtime";
import { currentOwnerEstimate } from "../../modules/documents/application/queries";

it("removes the active OE without deleting source evidence or changing existing results", async () => {
  const runtime = createLocalRuntime(true, true);
  const oe = currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, "proc-showcase")!;
  const snapshots = runtime.evaluations.queries.getSnapshot().snapshots;
  const offer = runtime.documents.queries.getSnapshot().documents.find(document => document.procurementId === oe.procurementId && document.kind === "OFFER")!;
  await runtime.documents.gateway.removeOwnerEstimate(oe.procurementId, oe.id, oe.revision);
  const source = runtime.documents.queries.getSnapshot().documents.find(document => document.id === oe.id)!;
  expect(source).toMatchObject({ ...oe, removedAt: expect.any(String) });
  expect(currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, oe.procurementId)).toBeUndefined();
  expect(runtime.procurement.queries.getSnapshot().documents.some(document => document.id === oe.id)).toBe(false);
  expect(runtime.priceDeviation.queries.getSnapshot().documents.some(document => document.id === oe.id)).toBe(false);
  expect(runtime.evaluations.queries.getSnapshot().snapshots).toEqual(snapshots);
  await expect(runtime.documents.gateway.confirmDocument(oe.id, oe.revision)).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
  await expect(runtime.priceDeviation.gateway.evaluateDeviation(oe.procurementId, oe.id, offer.id)).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
  const fresh = await runtime.documents.gateway.uploadDocument({ procurementId: oe.procurementId, kind: "OE", sourceId: oe.sourceId, name: "OE Baru.xlsx" });
  expect(fresh.status).toBe("REVIEW_REQUIRED");
  expect(currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, oe.procurementId)?.id).toBe(fresh.id);
});

it("rejects stale, foreign and non-OE deletion commands without changing state", async () => {
  const runtime = createLocalRuntime(true, true);
  const state = runtime.documents.queries.getSnapshot();
  const oe = currentOwnerEstimate(state.documents, "proc-showcase")!;
  const a5 = state.documents.find(document => document.procurementId === oe.procurementId && document.kind === "FORM_A5")!;
  for (const [procurementId, documentId, revision, code] of [
    [oe.procurementId, oe.id, oe.revision + 1, "STALE_REVISION"],
    ["proc-terminal", oe.id, oe.revision, "WRONG_SCOPE"],
    [oe.procurementId, a5.id, a5.revision, "WRONG_SCOPE"],
  ] as const) {
    await expect(runtime.documents.gateway.removeOwnerEstimate(procurementId, documentId, revision)).rejects.toMatchObject({ code });
    expect(runtime.documents.queries.getSnapshot()).toBe(state);
  }
});

it("does not revive an older OE or delete a replacement through an outdated dialog target", async () => {
  const runtime = createLocalRuntime(true, true);
  const oe = currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, "proc-showcase")!;
  const fresh = await runtime.documents.gateway.uploadDocument({ procurementId: oe.procurementId, kind: "OE", sourceId: oe.sourceId, name: "OE Baru.xlsx", replacement: { id: oe.id, revision: oe.revision } });
  await expect(runtime.documents.gateway.removeOwnerEstimate(oe.procurementId, oe.id, oe.revision)).rejects.toMatchObject({ code: "DOCUMENT_REPLACED" });
  expect(currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, oe.procurementId)?.id).toBe(fresh.id);
  await runtime.documents.gateway.removeOwnerEstimate(fresh.procurementId, fresh.id, fresh.revision);
  expect(currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, oe.procurementId)).toBeUndefined();
});
