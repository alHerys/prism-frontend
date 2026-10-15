import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import Decimal from "decimal.js";
import { syntheticCatalog, syntheticSheets } from "./test-data";
import { createPertaminaRuntime } from "./runtime";
import { validateCatalog } from "./catalog";
import { parseOwnerEstimate } from "../owner-estimate/parser";
import { parseOfferSpreadsheet } from "../spreadsheet/offer-parser";
import { createLocalRuntime } from "../local/runtime";
import { LocalStore } from "../local/store";
import { createPreparedA5Extraction } from "./sources";
import { copy } from "../../shared/kernel/validation";

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("URL", class extends URL { static createObjectURL() { return "blob:synthetic"; } static revokeObjectURL() {} });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const complete = "proc-pertamina-complete";
const setup = () => createPertaminaRuntime(syntheticCatalog(), syntheticSheets());
type Runtime = ReturnType<typeof setup>;
const latestHEA = (r: Runtime, procurementId = complete) => r.hea.queries.getSnapshot().snapshots.find(s => s.module === "HEA" && s.procurementId === procurementId)!;
const a5 = (r: Runtime) => r.documents.queries.getSnapshot().documents.find(d => d.procurementId === complete && d.kind === "FORM_A5" && d.vendorId?.endsWith("HEA-001") && !d.removedAt && !d.supersededBy)!;

it("starts three isolated stages, calculates HEA and preserves the standard runtime", () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const r = setup();
  expect(r.procurement.queries.getSnapshot().procurements).toHaveLength(3);
  expect(r.documents.queries.getSnapshot().documents.filter(d => d.procurementId === "proc-pertamina-new")).toHaveLength(0);
  expect(r.priceDeviation.queries.getSnapshot().snapshots.filter(s => s.module === "PRICE_DEVIATION")).toHaveLength(1);
  expect(latestHEA(r).rows).toHaveLength(2);
  expect(r.reviewWorkflow).toBe("SAVE_CONFIRMS"); expect(fetch).not.toHaveBeenCalled();
  expect(createLocalRuntime(true, true).reviewWorkflow).toBe("SEPARATE_CONFIRMATION");
});

it("atomically saves edited A5 values, recalculates all vendors, and keeps the candidate and old result intact", async () => {
  const r = setup(), d = a5(r), before = copy(latestHEA(r)), original = copy(d.candidate);
  const emitted = vi.fn(); r.documents.queries.subscribe(emitted);
  const saved = await r.documents.gateway.reviewDocument(d.id, { ...d.reviewed!, hpb: "9000" }, d.revision);
  expect(saved.status).toBe("CONFIRMED"); expect(saved.reviewed?.hpb).toBe("9000"); expect(saved.candidate).toEqual(original);
  expect(emitted).toHaveBeenCalledTimes(1);
  const next = latestHEA(r);
  expect(next.id).not.toBe(before.id); expect(next.rows[0].vendorName).toBe("Penyedia B");
  expect(r.evaluations.queries.getSnapshot().snapshots.find(s => s.id === before.id)).toEqual(before);
  const count = r.evaluations.queries.getSnapshot().snapshots.length;
  await r.documents.gateway.reviewDocument(saved.id, saved.reviewed!, saved.revision);
  expect(r.evaluations.queries.getSnapshot().snapshots).toHaveLength(count);
  expect(emitted).toHaveBeenCalledTimes(1);
});

it("saves arbitrary valid preferences and rejects invalid input or stale revisions without publishing", async () => {
  const r = setup(), p = r.procurement.queries.getSnapshot().procurements.find(p => p.id === complete)!;
  const before = latestHEA(r).id;
  await r.hea.gateway.setPreferences(p.id, { preferensi_barang: "0", preferensi_jasa: "0" }, p.preferenceRevision);
  expect(latestHEA(r).id).not.toBe(before);
  expect(latestHEA(r).rows[0].hea).toBe("1405");
  const state = JSON.stringify(r.evaluations.queries.getSnapshot());
  await expect(r.hea.gateway.setPreferences(p.id, p.preferences!, p.preferenceRevision)).rejects.toThrow("berubah");
  const d = a5(r);
  await expect(r.documents.gateway.reviewDocument(d.id, { ...d.reviewed!, knb: "-1" }, d.revision)).rejects.toThrow();
  expect(JSON.stringify(r.evaluations.queries.getSnapshot())).toBe(state);
});

it("allows A5 to be saved before preferences, then calculates when preferences are saved", async () => {
  const r = setup(), id = "proc-pertamina-new", catalog = syntheticCatalog();
  const vendor = await r.procurement.gateway.addVendor(id, "Penyedia A");
  const document = await r.documents.gateway.uploadDocument({ procurementId: id, vendorId: vendor.id, kind: "FORM_A5", sourceId: "HEA-001", name: "Renamed.pdf" });
  await r.documents.gateway.reviewDocument(document.id, document.reviewed!, document.revision);
  expect(latestHEA(r, id)).toBeUndefined();
  await r.hea.gateway.setPreferences(id, catalog.preferences, 0);
  expect(latestHEA(r, id).rows).toHaveLength(1);
});

it("recalculates on A5 removal and hides current results when no A5 remains, retaining history", async () => {
  const r = setup(), d = a5(r), old = latestHEA(r);
  await r.documents.gateway.removeVendorDocument(complete, d.id, d.revision);
  expect(latestHEA(r).rows).toHaveLength(1); expect(latestHEA(r).status).toBe("PARTIAL");
  const remaining = r.documents.queries.getSnapshot().documents.find(d => d.procurementId === complete && d.kind === "FORM_A5" && !d.removedAt)!;
  await r.documents.gateway.removeVendorDocument(complete, remaining.id, remaining.revision);
  expect(latestHEA(r)).toBeUndefined();
  expect(r.evaluations.queries.getSnapshot().snapshots.some(s => s.id === old.id)).toBe(true);
});

it("keeps HEA and prepared price results unchanged when OE/offer review cells are saved", async () => {
  const r = setup(), heaId = latestHEA(r).id;
  const old = r.evaluations.queries.getSnapshot().snapshots;
  for (const kind of ["OE", "OFFER"] as const) {
    const d = r.documents.queries.getSnapshot().documents.find(d => d.procurementId === complete && d.kind === kind)!;
    const table = kind === "OE" ? d.ownerEstimate! : d.offerSpreadsheet!;
    const row = table.candidate.rows.find(row => row.kind === "ITEM" && row.scope === "SPLIT")!;
    const port = kind === "OE" ? r.ownerEstimate : r.offerSpreadsheet;
    const saved = await port.saveAndConfirm({ documentId: d.id, expectedRevision: d.revision, acknowledged: false, edits: [{ rowId: row.id, field: "material", value: "9876.5" }] });
    expect(saved.status).toBe("CONFIRMED");
  }
  expect(latestHEA(r).id).toBe(heaId); expect(r.evaluations.queries.getSnapshot().snapshots).toEqual(old);
});

it("replaces an explicitly selected A5 atomically and recalculates using the new saved review", async () => {
  const r = setup(), d = a5(r), candidate = syntheticCatalog().a5[0].candidate;
  const before = latestHEA(r).rows.find(row => row.vendorId === d.vendorId)!.hea;
  const source = { id: "replacement", name: "Another name.pdf", path: "blob:synthetic", sha256: candidate.sha256 };
  const target = r.intake.publication.existing(complete).find(v => v.id === d.vendorId)!;
  const result = await r.intake.publication.publish(complete, { id: "replacement", source, phase: "ready", candidate, vendorName: target.name, values: { ...candidate.values, knb: "100" }, acknowledged: true, target });
  expect(r.documents.queries.getSnapshot().documents.find(old => old.id === d.id)?.supersededBy).toBe(result.documentId);
  expect(latestHEA(r).rows.find(row => row.vendorId === d.vendorId)?.hea).not.toBe(before);
  const count = r.evaluations.queries.getSnapshot().snapshots.length;
  await expect(r.intake.publication.publish(complete, { id: "stale", source, phase: "ready", candidate, vendorName: target.name, values: candidate.values, acknowledged: true, target })).rejects.toThrow("berubah");
  expect(r.evaluations.queries.getSnapshot().snapshots).toHaveLength(count);
});

it("rolls back a failed state transaction, including generated identities and notifications", () => {
  const store = new LocalStore(); store.updateView();
  const before = store.getState(), emit = vi.fn(); store.subscribe(emit);
  expect(() => store.transaction(() => { store.id("test"); store.state.events.push({ id: "bad", createdAt: "now", module: "HEA", type: "TEST", summary: "Synthetic" }); store.emit(); throw Error("failure"); })).toThrow("failure");
  expect(store.getState()).toBe(before); expect(store.state.events).toHaveLength(0); expect(emit).not.toHaveBeenCalled(); expect(store.id("test")).toBe("test-21");
});

it("recognizes A5 bytes after renaming, rejects modified bytes and honors cancellation without HTTP", async () => {
  const extraction = createPreparedA5Extraction(syntheticCatalog());
  const bytes = new TextEncoder().encode("%PDF-1.7\n% Synthetic A\n%%EOF").buffer;
  const file = { name: "Renamed.pdf", size: bytes.byteLength, arrayBuffer: async () => bytes };
  const candidate = await extraction.extract(file, "ok");
  expect(candidate.vendorName).toBe("Penyedia A");
  const modified = new Uint8Array(bytes.slice(0)); modified[modified.length - 1] = 0;
  await expect(extraction.extract({ ...file, arrayBuffer: async () => modified.buffer }, "bad")).rejects.toThrow("belum didukung");
  const pending = extraction.extract(file, "cancelled"); extraction.cancel("cancelled");
  await expect(pending).rejects.toThrow("dibatalkan");
});

it("includes a newly saved manual vendor without A5 as a partial-result exclusion", async () => {
  const runtime = setup();
  await runtime.procurement.gateway.addVendor(complete, "Penyedia tanpa A5");
  expect(latestHEA(runtime).status).toBe("PARTIAL");
  expect(latestHEA(runtime).excluded).toContain("Penyedia tanpa A5");
});

if (process.env.PRISM_PERTAMINA_REFERENCE) it("locally verifies real-source HEA and spreadsheet integrity without storing original data in Git", async () => {
  const catalogPath = process.env.PRISM_PERTAMINA_REFERENCE!;
  const catalog = validateCatalog(JSON.parse(readFileSync(catalogPath, "utf8")));
  const root = path.resolve(path.dirname(catalogPath), "../..");
  const original = JSON.parse(readFileSync(catalogPath, "utf8")) as { sources: { kind: string; relativePath: string }[] };
  const buffers = ["OE", "OFFER"].map(kind => readFileSync(path.join(root, original.sources.find(s => s.kind === kind)!.relativePath)));
  const bytes = buffers.map(b => new Uint8Array(b).buffer);
  const [oe] = await parseOwnerEstimate(bytes[0]), [offer] = await parseOfferSpreadsheet(bytes[1]);
  const runtime = createPertaminaRuntime(catalog, { oe, offer });
  const verification = JSON.parse(readFileSync(path.join(root, "verification/hea-package6a/verification.json"), "utf8"));
  const expected: { calculation: { hea: string } }[] = verification.evaluation.result.leaderboard;
  latestHEA(runtime).rows.forEach((row, i) => expect(new Decimal(row.hea!).eq(expected[i].calculation.hea)).toBe(true));
  expect(oe.rows.length).toBeGreaterThan(200); expect(offer.rows.length).toBeGreaterThan(200);
  const before = copy(runtime.evaluations.queries.getSnapshot());
  const d = a5(runtime);
  await runtime.documents.gateway.reviewDocument(d.id, { ...d.reviewed!, hpb: "0" }, d.revision);
  expect(latestHEA(runtime).id).not.toBe(before.snapshots.find(s => s.module === "HEA" && s.procurementId === complete)!.id);
  expect(buffers[0].equals(readFileSync(path.join(root, original.sources.find(s => s.kind === "OE")!.relativePath)))).toBe(true);
});
