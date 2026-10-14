import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { createLocalRuntime } from "./runtime";
const get = (runtime: ReturnType<typeof createLocalRuntime>, id = "doc-28") => runtime.documents.queries.getSnapshot().documents.find(d => d.id === id)!;
const file = () => { const bytes = new Uint8Array(readFileSync("public/files/Penawaran-Nusa.xlsx")); return { name: "Penawaran.xlsx", size: bytes.byteLength, arrayBuffer: async () => bytes.buffer }; };

it("saves and confirms only the spreadsheet atomically, retaining source, pairs and snapshots", async () => {
  const runtime = createLocalRuntime(true, true);
  const before = structuredClone(get(runtime));
  const snapshots = runtime.evaluations.queries.getSnapshot();
  const row = before.offerSpreadsheet!.candidate.rows.find(r => r.sourceRow === 13)!;
  const saved = await runtime.offerSpreadsheet.saveAndConfirm({ documentId: before.id, expectedRevision: before.revision, acknowledged: false,
    edits: [{ rowId: row.id, field: "material", value: "300000.123456789" }] });
  expect(saved.revision).toBe(before.revision + 1);
  expect(saved.offerSpreadsheet?.status).toBe("CONFIRMED");
  expect(saved.offerSpreadsheet?.candidate).toEqual(before.offerSpreadsheet?.candidate);
  expect(saved.pairs).toEqual(before.pairs);
  expect(saved.priceItems).toEqual(before.priceItems);
  expect(saved.status).toBe(before.status);
  expect(saved.offerSpreadsheet?.reviewed?.rows.find(r => r.sourceRow === 13)?.material.value).toBe("300000.123456789");
  expect(saved.offerSpreadsheet?.reviewed?.rows.find(r => r.sourceRow === 26)?.combined?.value).toBe("1095000");
  expect(runtime.evaluations.queries.getSnapshot().snapshots).toEqual(snapshots.snapshots);
});

it("rejects conflicts, invalid edits, empty-row edits and archived saves without publishing", async () => {
  const runtime = createLocalRuntime(true, true);
  const before = structuredClone(get(runtime));
  const input = { documentId: before.id, expectedRevision: before.revision, acknowledged: false, edits: [] };
  await expect(runtime.offerSpreadsheet.saveAndConfirm({ ...input, expectedRevision: 99 })).rejects.toMatchObject({ code: "STALE_REVISION" });
  const row = before.offerSpreadsheet!.candidate.rows.find(r => r.sourceRow === 13)!;
  await expect(runtime.offerSpreadsheet.saveAndConfirm({ ...input, edits: [{ rowId: row.id, field: "material", value: "-1" }] })).rejects.toThrow();
  const empty = before.offerSpreadsheet!.candidate.rows.find(r => r.kind === "EMPTY")!;
  await expect(runtime.offerSpreadsheet.saveAndConfirm({ ...input, edits: [{ rowId: empty.id, field: "description", value: "changed" }] })).rejects.toMatchObject({ code: "INVALID_CELL" });
  expect(get(runtime)).toEqual(before);
  await runtime.documents.gateway.removeVendorDocument(before.procurementId, before.id, before.revision);
  await expect(runtime.offerSpreadsheet.saveAndConfirm(input)).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
});

it("validates ownership before publication and keeps spreadsheet confirmation separate on new uploads", async () => {
  const runtime = createLocalRuntime();
  const pending = await runtime.offerSpreadsheet.prepare(file(), vi.fn());
  await expect(runtime.offerSpreadsheet.publish({ pendingId: pending.id, sheetId: pending.sheets[0].id, procurementId: "proc-terminal", vendorId: "showcase-nusa" })).rejects.toMatchObject({ code: "VENDOR_REQUIRED" });
  const document = await runtime.offerSpreadsheet.publish({ pendingId: pending.id, sheetId: pending.sheets[0].id, procurementId: "proc-terminal", vendorId: "vendor-nusa" });
  const confirmed = await runtime.offerSpreadsheet.saveAndConfirm({ documentId: document.id, expectedRevision: document.revision, acknowledged: false, edits: [] });
  expect(confirmed.status).toBe("REVIEW_REQUIRED");
  expect(confirmed.offerSpreadsheet?.status).toBe("CONFIRMED");
  expect(confirmed.pairs.every(p => !p.confirmed)).toBe(true);
  await expect(runtime.offerSpreadsheet.prepare({ ...file(), size: 11 * 1024 * 1024 }, vi.fn())).rejects.toThrow("10 MiB");
});
