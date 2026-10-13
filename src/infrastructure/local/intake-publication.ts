import type { A5PublicationPort } from "../../modules/documents/application/intake-ports";
import { validateIntakeDraft } from "../../modules/documents/domain/intake";
import { vendorNameKey } from "../../shared/kernel/vendor-name";
import { DomainError, copy } from "../../shared/kernel/validation";
import { toLocalDocument } from "./document-mapping";
import type { LocalStore } from "./store";

export function createA5Publication(store: LocalStore): A5PublicationPort {
  return {
    existing: procurementId => store.state.vendors.filter(v => v.procurementId === procurementId).map(v => {
      const d = store.state.documents.find(d => d.procurementId === procurementId && d.vendorId === v.id && d.kind === "FORM_A5" && !d.supersededBy && !d.removedAt);
      return { id: v.id, name: v.name, document: d ? { id: d.id, name: d.name, revision: d.revision, sha256: d.sha256 } : undefined };
    }),
    publish: async (procurementId, entry) => {
      store.proc(procurementId);
      validateIntakeDraft(entry);
      if (!entry.candidate || entry.phase !== "ready" || entry.candidate.sha256 !== entry.source.sha256) throw new Error("Kandidat belum valid.");
      const existing = store.state.vendors.find(v => v.procurementId === procurementId && vendorNameKey(v.name) === vendorNameKey(entry.vendorName));
      if (existing && existing.id !== entry.target?.id) throw new DomainError("DUPLICATE", "Vendor sudah terdaftar. Pilih A5 yang digunakan.");
      if (entry.target && (!existing || entry.target.id !== existing.id)) throw new Error("Vendor tujuan telah berubah. Periksa konflik kembali.");
      const current = existing ? store.state.documents.find(d => d.vendorId === existing.id && d.procurementId === procurementId && d.kind === "FORM_A5" && !d.supersededBy && !d.removedAt) : undefined;
      if (current?.id !== entry.target?.document?.id || current?.revision !== entry.target?.document?.revision) throw new DomainError("STALE_REVISION", "A5 vendor telah berubah. Pilih kembali dokumen yang digunakan.");
      if (store.state.documents.some(d => d.procurementId === procurementId && d.sha256 === entry.source.sha256 && !d.supersededBy && !d.removedAt)) throw new Error("PDF identik sudah terdaftar.");
      const vendor = existing ?? { id: store.id("vendor"), procurementId, name: entry.vendorName.trim(), createdAt: new Date().toISOString() };
      const documentId = store.id("doc");
      const document = toLocalDocument({
        id: documentId, procurementId, vendorId: vendor.id, sourceId: entry.source.id, name: entry.source.name,
        kind: "FORM_A5", uploadedAt: new Date().toISOString(), revision: 1, status: "CONFIRMED", sha256: entry.source.sha256,
        candidateVendorName: entry.candidate.vendorName, candidate: copy(entry.candidate.values), reviewed: copy(entry.values),
        warnings: copy(entry.candidate.warnings), acknowledged: entry.acknowledged, sources: copy(entry.candidate.sources), groups: [], pairs: [], published: false,
      });
      // All checks complete before the first mutation; one notification publishes both records.
      if (!existing) store.state.vendors.push(vendor);
      if (current) current.supersededBy = documentId;
      store.state.documents.push(document);
      store.event({ procurementId, module: "PROCUREMENT", type: "CONFIRMED", summary: `${existing ? "Form A5 diganti" : "Vendor dan Form A5 ditambahkan"}: ${vendor.name}` });
      store.emit();
      return { documentId };
    },
  };
}
