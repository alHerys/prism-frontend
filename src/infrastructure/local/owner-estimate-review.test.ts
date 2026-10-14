import { expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import JSZip from "jszip";
import { createLocalRuntime } from "./runtime";

it("atomically saves confirmed reviewed cells without changing source, totals or financial snapshots", async () => {
  const runtime = createLocalRuntime(true, true);
  const before = runtime.documents.queries.getSnapshot();
  const original = before.documents.find(d => d.id === "doc-27")!;
  const snapshots = JSON.stringify(runtime.evaluations.queries.getSnapshot().snapshots);
  await runtime.ownerEstimate.saveAndConfirm({ documentId: original.id, expectedRevision: original.revision, acknowledged: true, edits: [{ rowId: "doc-27/Rincian OE:r14", field: "material", value: "1234567890123456.123456789" }] });
  const updated = runtime.documents.queries.getSnapshot().documents.find(d => d.id === original.id)!;
  expect(updated.status).toBe("CONFIRMED");
  expect(updated.revision).toBe(original.revision + 1);
  expect(updated.ownerEstimate!.reviewed!.rows[2].material.value).toBe("1234567890123456.123456789");
  expect(updated.ownerEstimate!.candidate).toEqual(original.ownerEstimate!.candidate);
  expect(updated.priceItems).toEqual(original.priceItems);
  expect(JSON.stringify(runtime.evaluations.queries.getSnapshot().snapshots)).toBe(snapshots);
  const stable = runtime.documents.queries.getSnapshot();
  await expect(runtime.ownerEstimate.saveAndConfirm({ documentId: original.id, expectedRevision: original.revision, acknowledged: true, edits: [] })).rejects.toMatchObject({ code: "STALE_REVISION" });
  await expect(runtime.ownerEstimate.saveAndConfirm({ documentId: updated.id, expectedRevision: updated.revision, acknowledged: true, edits: [{ rowId: "doc-27/Rincian OE:r14", field: "material", value: "-1" }] })).rejects.toMatchObject({ code: "INVALID_VALUE" });
  expect(runtime.documents.queries.getSnapshot()).toBe(stable);
});

it("reads and publishes an actual XLSX only after selecting a parsed sheet", async () => {
  vi.stubGlobal("crypto", webcrypto);
  try {
    const runtime = createLocalRuntime();
    const current = runtime.documents.queries.getSnapshot().documents.find(d => d.kind === "OE")!;
    const bytes = new Uint8Array(readFileSync("public/files/OE-Terminal.xlsx")).buffer;
    const file = { name: "Renamed OE.xlsx", size: bytes.byteLength, arrayBuffer: async () => bytes };
    const prepared = await runtime.ownerEstimate.prepare(file, vi.fn());
    expect(prepared.sheets[0].rows).toBe(14);
    expect(runtime.documents.queries.getSnapshot().documents).not.toContainEqual(expect.objectContaining({ name: file.name }));
    await expect(runtime.ownerEstimate.publish({ pendingId: prepared.id, sheetId: "wrong", procurementId: current.procurementId, replacement: { id: current.id, revision: current.revision } })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const published = await runtime.ownerEstimate.publish({ pendingId: prepared.id, sheetId: prepared.sheets[0].id, procurementId: current.procurementId, replacement: { id: current.id, revision: current.revision } });
    expect(published.status).toBe("REVIEW_REQUIRED");
    expect(published.name).toBe(file.name);
    expect(published.ownerEstimate?.candidate.rows).toHaveLength(14);
    expect(published.sha256).toHaveLength(64);
    expect(runtime.documents.queries.getSnapshot().documents.find(d => d.id === current.id)?.supersededBy).toBe(published.id);
    const confirmed = await runtime.ownerEstimate.saveAndConfirm({ documentId: published.id, expectedRevision: published.revision, edits: [], acknowledged: true });
    expect(confirmed.status).toBe("CONFIRMED");
  } finally { vi.unstubAllGlobals(); }
});

it("requires unresolved cells and source warnings to be reviewed without substituting demo prices", async () => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("URL", Object.assign(class extends URL {}, { createObjectURL: vi.fn(() => "blob:oe-source") }));
  try {
    const runtime = createLocalRuntime();
    const current = runtime.documents.queries.getSnapshot().documents.find(d => d.kind === "OE")!;
    const zip = await JSZip.loadAsync(readFileSync("public/files/OE-Terminal.xlsx"));
    const xml = await zip.file("xl/worksheets/sheet2.xml")!.async("string");
    zip.file("xl/worksheets/sheet2.xml", xml.replace(/<x:c\b[^>]*r="P14"[^>]*>[\s\S]*?<\/x:c>/, '<x:c r="P14"><x:f>[external.xlsx]Values!A1</x:f></x:c>'));
    const bytes = await zip.generateAsync({ type: "arraybuffer" });
    const prepared = await runtime.ownerEstimate.prepare({ name: "OE parsed.xlsx", size: bytes.byteLength, arrayBuffer: async () => bytes }, vi.fn());
    const document = await runtime.ownerEstimate.publish({ pendingId: prepared.id, sheetId: prepared.sheets[0].id, procurementId: current.procurementId, replacement: { id: current.id, revision: current.revision } });
    expect(document.priceItems).toBeUndefined();
    expect(document.groups).toEqual([]);
    const baseline = runtime.documents.queries.getSnapshot();
    const input = { documentId: document.id, expectedRevision: document.revision, acknowledged: true, edits: [] };
    await expect(runtime.ownerEstimate.saveAndConfirm(input)).rejects.toMatchObject({ code: "OE_UNRESOLVED" });
    const edits = [{ rowId: `${document.id}/Rincian OE:r14`, field: "material" as const, value: null }];
    await expect(runtime.ownerEstimate.saveAndConfirm({ ...input, acknowledged: false, edits })).rejects.toMatchObject({ code: "WARNING_REQUIRED" });
    await expect(runtime.ownerEstimate.saveAndConfirm({ ...input, edits: [{ ...edits[0], rowId: `${current.id}/Rincian OE:r14` }] })).rejects.toMatchObject({ code: "INVALID_CELL" });
    expect(runtime.documents.queries.getSnapshot()).toBe(baseline);
    const result = await runtime.ownerEstimate.saveAndConfirm({ ...input, edits });
    expect(result.ownerEstimate?.reviewed?.rows[2].material.state).toBe("BLANK");
    expect(result.ownerEstimate?.candidate.rows[2].material.state).toBe("UNAVAILABLE");
    await runtime.documents.gateway.removeOwnerEstimate(result.procurementId, result.id, result.revision);
    await expect(runtime.ownerEstimate.saveAndConfirm({ ...input, expectedRevision: result.revision })).rejects.toMatchObject({ code: "DOCUMENT_REMOVED" });
  } finally { vi.unstubAllGlobals(); }
});

it("rejects oversize files before reading bytes and releases unpublished imports", async () => {
  vi.stubGlobal("crypto", webcrypto);
  try {
    const runtime = createLocalRuntime();
    const arrayBuffer = vi.fn();
    await expect(runtime.ownerEstimate.prepare({ name: "large.xlsx", size: 10 * 1024 * 1024 + 1, arrayBuffer }, vi.fn())).rejects.toThrow("10 MiB");
    expect(arrayBuffer).not.toHaveBeenCalled();
    const bytes = new Uint8Array(readFileSync("public/files/OE-Terminal.xlsx")).buffer;
    const parsed = await runtime.ownerEstimate.prepare({ name: "OE.xlsx", size: bytes.byteLength, arrayBuffer: async () => bytes }, vi.fn());
    runtime.ownerEstimate.release(parsed.id);
    await expect(runtime.ownerEstimate.publish({ pendingId: parsed.id, sheetId: parsed.sheets[0].id, procurementId: "proc-terminal" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  } finally { vi.unstubAllGlobals(); }
});
