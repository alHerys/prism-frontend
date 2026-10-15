import type { OfferSpreadsheetPort } from "../../modules/documents/application/offer-spreadsheet-ports";
import type { DocumentSource } from "../../modules/documents/application/ports";
import type { SpreadsheetSheet } from "../../modules/documents/domain/spreadsheet";
import { applySpreadsheetEdits, identifySpreadsheet, spreadsheetIssues } from "../../modules/documents/domain/spreadsheet";
import { ensureCurrentDocument } from "../../modules/documents/domain/replacement";
import { copy, DomainError } from "../../shared/kernel/validation";
import type { LocalStore } from "./store";
import { toDocument } from "./document-mapping";
import { makeDocument } from "./documents";
import registry from "./fixtures/file-registry.json";
import type { SpreadsheetLifecycle } from "./spreadsheet-lifecycle";

export function createOfferSpreadsheetAdapter(store: LocalStore, lifecycle: SpreadsheetLifecycle = {}): OfferSpreadsheetPort & { sources(): DocumentSource[] } {
  let sequence = 0;
  const pending = new Map<string, { name: string; bytes: ArrayBuffer; sha256: string; sheets: SpreadsheetSheet[] }>();
  const sources = new Map<string, DocumentSource>();
  return {
    sources: () => [...sources.values()].map(copy),
    prepare: async (file, progress) => {
      if (!file.name.toLowerCase().endsWith(".xlsx") || file.size <= 0 || file.size > 10 * 1024 * 1024)
        throw new Error("Pilih XLSX penawaran dengan ukuran maksimal 10 MiB.");
      progress("Membaca tabel penawaran");
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength !== file.size) throw new Error("Ukuran berkas penawaran tidak sesuai.");
      const { parseOfferSpreadsheet } = await import("../spreadsheet/offer-parser");
      const sheets = await parseOfferSpreadsheet(bytes);
      const sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join("");
      const id = `offer-source-${++sequence}`;
      pending.set(id, { name: file.name, bytes, sha256, sheets });
      return { id, name: file.name, sheets: sheets.map(s => ({ id: s.id, name: s.name, rows: s.rows.length })) };
    },
    release: id => { pending.delete(id); },
    publish: async input => store.transaction(() => {
      store.proc(input.procurementId);
      if (!store.state.vendors.some(v => v.id === input.vendorId && v.procurementId === input.procurementId))
        throw new DomainError("VENDOR_REQUIRED", "Pilih vendor pemilik penawaran.");
      const original = pending.get(input.pendingId);
      const sheet = original?.sheets.find(s => s.id === input.sheetId);
      if (!original || !sheet) throw new DomainError("NOT_FOUND", "Pembacaan penawaran tidak ditemukan. Unggah kembali.");
      const fixture = registry.find(file => file.kind === "OFFER" && file.sha256 === original.sha256);
      const path = fixture?.path ?? URL.createObjectURL(new Blob([original.bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const d = makeDocument(store, { procurementId: input.procurementId, vendorId: input.vendorId, kind: "OFFER", fixtureId: fixture?.id ?? input.pendingId, name: original.name });
      d.sha256 = original.sha256;
      d.offerSpreadsheet = { candidate: identifySpreadsheet(sheet, d.id), status: "REVIEW_REQUIRED", acknowledged: false };
      if (!fixture) {
        d.groups = []; d.pairs = []; d.priceItems = undefined;
        sources.set(input.pendingId, { id: input.pendingId, name: original.name, path, kind: "OFFER" });
      }
      store.state.documents.unshift(d);
      lifecycle.published?.(d.id);
      store.event({ procurementId: d.procurementId, module: "PRICE_DEVIATION", type: "UPLOADED", summary: `${d.name} selesai dibaca; menunggu pemeriksaan dokumen` });
      pending.delete(input.pendingId);
      store.emit();
      return toDocument(copy(d));
    }),
    saveAndConfirm: async input => store.transaction(() => {
      const current = store.doc(input.documentId);
      ensureCurrentDocument(current);
      store.check(current.revision, input.expectedRevision);
      if (current.kind !== "OFFER" || !current.offerSpreadsheet) throw new DomainError("WRONG_KIND", "Tabel penawaran belum tersedia. Baca ulang berkas XLSX.");
      const table = current.offerSpreadsheet;
      const reviewed = applySpreadsheetEdits(table.reviewed ?? table.candidate, input.edits);
      const issues = spreadsheetIssues(reviewed);
      if (issues.length) throw new DomainError("SPREADSHEET_UNRESOLVED", issues[0].message);
      if (table.candidate.warnings.length && !input.acknowledged) throw new DomainError("WARNING_REQUIRED", "Periksa peringatan sumber sebelum konfirmasi spreadsheet.");
      if (!input.edits.length && table.status === "CONFIRMED") return toDocument(copy(current));
      // Spreadsheet confirmation never confirms or changes evaluation pairs.
      current.offerSpreadsheet = { candidate: table.candidate, reviewed, status: "CONFIRMED", acknowledged: input.acknowledged };
      current.revision++;
      store.event({ procurementId: current.procurementId, module: "PRICE_DEVIATION", type: "CONFIRMED", summary: `Spreadsheet ${current.name} disimpan dan dikonfirmasi` });
      lifecycle.saved?.(current.id);
      store.emit();
      return toDocument(copy(current));
    }),
  };
}
