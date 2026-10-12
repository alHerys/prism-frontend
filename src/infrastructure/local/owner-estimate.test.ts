// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createLocalRuntime } from "./runtime";
import { createApplication } from "../../app/bootstrap/application";
import { currentOwnerEstimate } from "../../modules/documents/application/queries";

function setup() {
  const runtime = createLocalRuntime(true, true);
  const oe = currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, "proc-showcase")!;
  const input = { procurementId: oe.procurementId, sourceId: oe.sourceId, kind: "OE" as const, name: "OE terbaru.xlsx", replacement: { id: oe.id, revision: oe.revision } };
  return { runtime, oe, input };
}

it("replaces only the active OE, retains original sources and snapshots, and requires fresh confirmation", async () => {
  const { runtime, oe, input } = setup();
  const before = runtime.evaluations.queries.getSnapshot().snapshots;
  const offer = runtime.documents.queries.getSnapshot().documents.find(document => document.procurementId === oe.procurementId && document.kind === "OFFER")!;
  const updated = await runtime.documents.gateway.uploadDocument(input);
  expect(updated).toMatchObject({ status: "REVIEW_REQUIRED", revision: 1, acknowledged: false });
  expect(updated).not.toHaveProperty("replacement");
  const documents = runtime.documents.queries.getSnapshot().documents;
  expect(documents.find(document => document.id === oe.id)).toMatchObject({ ...oe, supersededBy: updated.id });
  for (const query of [runtime.procurement.queries, runtime.priceDeviation.queries]) {
    expect(query.getSnapshot().documents.filter(document => document.procurementId === oe.procurementId && document.kind === "OE").map(document => document.id)).toEqual([updated.id]);
  }
  expect(runtime.evaluations.queries.getSnapshot().snapshots).toEqual(before);
  await expect(runtime.priceDeviation.gateway.evaluateDeviation(oe.procurementId, oe.id, offer.id)).rejects.toMatchObject({ code: "DOCUMENT_REPLACED" });
  await expect(runtime.priceDeviation.gateway.evaluateDeviation(oe.procurementId, updated.id, offer.id)).rejects.toMatchObject({ code: "CONFIRMATION_REQUIRED" });
  await expect(runtime.documents.gateway.confirmDocument(oe.id, oe.revision)).rejects.toMatchObject({ code: "DOCUMENT_REPLACED" });
  await expect(runtime.priceDeviation.gateway.selectGroup(oe.id, "Harga satuan material dan jasa", oe.revision)).rejects.toMatchObject({ code: "DOCUMENT_REPLACED" });
  const selected = await runtime.priceDeviation.gateway.selectGroup(updated.id, "Harga satuan material dan jasa", updated.revision);
  await runtime.documents.gateway.confirmDocument(selected.id, selected.revision, true);
  const result = await runtime.priceDeviation.gateway.evaluateDeviation(oe.procurementId, updated.id, offer.id);
  expect(result.inputs).toMatchObject({ oe: { id: updated.id, name: input.name } });
  expect(runtime.evaluations.queries.getSnapshot().snapshots.slice(1)).toEqual(before);
});

it("rejects duplicate, unsupported, stale and cross-procurement replacement commands without publishing changes", async () => {
  const { runtime, oe, input } = setup();
  const before = runtime.documents.queries.getSnapshot();
  const events = runtime.evaluations.queries.getSnapshot().events;
  for (const [command, code] of [
    [{ ...input, replacement: undefined }, "OWNER_ESTIMATE_EXISTS"],
    [{ ...input, sourceId: "unknown" }, "UNSUPPORTED"],
    [{ ...input, replacement: { id: oe.id, revision: 999 } }, "STALE_REVISION"],
    [{ ...input, procurementId: "proc-terminal" }, "STALE_REVISION"],
    [{ ...input, kind: "FORM_A5" as const, sourceId: "a5-nusa", procurementId: "proc-terminal", vendorId: "vendor-nusa" }, "WRONG_KIND"],
  ] as const) {
    await expect(runtime.documents.gateway.uploadDocument(command)).rejects.toMatchObject({ code });
    expect(runtime.documents.queries.getSnapshot()).toBe(before);
    expect(runtime.evaluations.queries.getSnapshot().events).toEqual(events);
  }
});

it("publishes one replacement when two uploads target the same OE revision", async () => {
  const { runtime, oe, input } = setup();
  const outcomes = await Promise.allSettled([runtime.documents.gateway.uploadDocument(input), runtime.documents.gateway.uploadDocument(input)]);
  expect(outcomes.filter(outcome => outcome.status === "fulfilled")).toHaveLength(1);
  expect(outcomes.find(outcome => outcome.status === "rejected")).toMatchObject({ reason: { code: "STALE_REVISION" } });
  expect(runtime.procurement.queries.getSnapshot().documents.filter(document => document.procurementId === oe.procurementId && document.kind === "OE")).toHaveLength(1);
});

it("keeps the current OE when file processing fails and supports the first upload for an empty procurement", async () => {
  const { runtime, oe, input } = setup();
  const application = createApplication({ ...runtime, processing: { ...runtime.processing, process: vi.fn(async () => { throw new Error("Berkas tidak didukung"); }) } });
  const before = runtime.documents.queries.getSnapshot();
  await expect(application.documents.commands.upload({ ...input, file: { name: input.name, size: 1, arrayBuffer: async () => new ArrayBuffer(1) } }, () => {})).rejects.toThrow("Berkas tidak didukung");
  expect(runtime.documents.queries.getSnapshot()).toBe(before);
  expect(currentOwnerEstimate(before.documents, oe.procurementId)).toEqual(oe);
  const first = await runtime.documents.gateway.uploadDocument({ procurementId: "proc-tank", sourceId: "oe-terminal", kind: "OE", name: "OE pertama.xlsx" });
  expect(currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, "proc-tank")?.id).toBe(first.id);
});

it("records the actual addition time for new vendors without inventing legacy timestamps", async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date("2026-10-12T10:00:00Z"));
    const runtime = createLocalRuntime();
    expect(runtime.procurement.queries.getSnapshot().vendors[0].createdAt).toBeUndefined();
    const vendor = await runtime.procurement.gateway.addVendor("proc-terminal", "Vendor Baru");
    expect(vendor.createdAt).toBe("2026-10-12T10:00:00.000Z");
  } finally { vi.useRealTimers(); }
});
