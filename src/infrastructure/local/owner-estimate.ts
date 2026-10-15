import type { OwnerEstimatePort } from "../../modules/documents/application/owner-estimate-ports";
import type { OESheet } from "../../modules/documents/domain/owner-estimate";
import { applyOEEdits, identifyOESheet, oeIssues } from "../../modules/documents/domain/owner-estimate";
import { ensureCurrentDocument, validateOwnerEstimateReplacement } from "../../modules/documents/domain/replacement";
import { copy, DomainError } from "../../shared/kernel/validation";
import type { LocalStore } from "./store";
import { toDocument } from "./document-mapping";
import type { DocumentSource } from "../../modules/documents/application/ports";
import registry from "./fixtures/file-registry.json";
import { makeDocument } from "./documents";
import type { SpreadsheetLifecycle } from "./spreadsheet-lifecycle";

export function createOwnerEstimateAdapter(store: LocalStore, lifecycle: SpreadsheetLifecycle = {}): OwnerEstimatePort & { sources(): DocumentSource[] } {
  let sequence = 0;
  const pending = new Map<string, { name: string; bytes: ArrayBuffer; sha256: string; sheets: OESheet[] }>();
  const sources = new Map<string, DocumentSource>();
  return {
    sources: () => [...sources.values()].map(copy),
    prepare: async (file, progress) => {
      if (!file.name.toLowerCase().endsWith(".xlsx") || file.size <= 0 || file.size > 10 * 1024 * 1024)
        throw new Error("Pilih XLSX OE dengan ukuran maksimal 10 MiB.");
      progress("Membaca tabel OE");
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength !== file.size) throw new Error("Ukuran berkas OE tidak sesuai.");
      const { parseOwnerEstimate } = await import("../owner-estimate/parser");
      const sheets = await parseOwnerEstimate(bytes);
      const sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join("");
      const id = `oe-source-${++sequence}`;
      pending.set(id, { name: file.name, bytes, sha256, sheets });
      return { id, name: file.name, sheets: sheets.map(s => ({ id: s.id, name: s.name, rows: s.rows.length })) };
    },
    release: id => { pending.delete(id); },
    publish: async input => store.transaction(() => {
      store.proc(input.procurementId);
      const original = pending.get(input.pendingId);
      const sheet = original?.sheets.find(s => s.id === input.sheetId);
      if (!original || !sheet) throw new DomainError("NOT_FOUND", "Pembacaan OE tidak ditemukan. Unggah kembali.");
      const current = store.state.documents.find(d => d.procurementId === input.procurementId && d.kind === "OE" && !d.removedAt && !d.supersededBy);
      validateOwnerEstimateReplacement(current, input.replacement);
      const fixture = registry.find(file => file.kind === "OE" && file.sha256 === original.sha256);
      const path = fixture?.path ?? URL.createObjectURL(new Blob([original.bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const d = makeDocument(store, { procurementId: input.procurementId, kind: "OE", fixtureId: fixture?.id ?? input.pendingId, name: original.name });
      d.fixtureId = fixture?.id ?? input.pendingId;
      d.sha256 = original.sha256;
      d.ownerEstimate = { candidate: identifyOESheet(sheet, d.id) };
      d.warnings = copy(sheet.warnings);
      if (current) current.supersededBy = d.id;
      if (!fixture) { d.groups = []; sources.set(input.pendingId, { id: input.pendingId, name: original.name, path, kind: "OE" }); }
      store.state.documents.unshift(d);
      lifecycle.published?.(d.id);
      store.event({ procurementId: d.procurementId, module: "PRICE_DEVIATION", type: "UPLOADED", summary: `${d.name} selesai dibaca; menunggu pemeriksaan` });
      pending.delete(input.pendingId);
      store.emit();
      return toDocument(copy(d));
    }),
    saveAndConfirm: async input => store.transaction(() => {
      const current = store.doc(input.documentId);
      ensureCurrentDocument(current);
      store.check(current.revision, input.expectedRevision);
      if (current.kind !== "OE" || !current.ownerEstimate) throw new DomainError("WRONG_KIND", "Data tabel OE belum tersedia. Unggah ulang berkas OE.");
      const baseline = current.ownerEstimate.reviewed ?? current.ownerEstimate.candidate;
      const reviewed = applyOEEdits(baseline, input.edits);
      const issues = oeIssues(reviewed);
      if (issues.length) throw new DomainError("OE_UNRESOLVED", issues[0].message);
      if (current.warnings.length && !input.acknowledged) throw new DomainError("WARNING_REQUIRED", "Periksa peringatan sumber sebelum konfirmasi OE.");
      if (!input.edits.length && current.status === "CONFIRMED") return toDocument(copy(current));
      // All checks complete before a single publication. Original extraction stays intact.
      current.ownerEstimate = { candidate: current.ownerEstimate.candidate, reviewed };
      current.status = "CONFIRMED";
      current.acknowledged = input.acknowledged;
      current.revision++;
      store.event({ procurementId: current.procurementId, module: "PRICE_DEVIATION", type: "CONFIRMED", summary: `${current.name} disimpan dan dikonfirmasi` });
      lifecycle.saved?.(current.id);
      store.emit();
      return toDocument(copy(current));
    }),
  };
}
