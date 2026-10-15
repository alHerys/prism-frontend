import type { DocumentsGateway } from "../../modules/documents/application/ports";
import type { A5Values } from "../../modules/documents/domain/models";
import type { LocalStore } from "../local/store";
import { reviewedDocument } from "../../modules/documents/domain/review";
import { ensureCurrentDocument } from "../../modules/documents/domain/replacement";
import { toDocument, toLocalDocument } from "../local/document-mapping";
import type { EvaluationCoordinator } from "./evaluations";
import { copy, decimal, DomainError } from "../../shared/kernel/validation";
import { removeOwnerEstimate, removeVendorDocument } from "../local/documents";
import type { PertaminaCatalog } from "./catalog";

export function createSavingDocuments(store: LocalStore, base: DocumentsGateway, evaluations: EvaluationCoordinator, catalog: PertaminaCatalog): DocumentsGateway {
  async function save(id: string, values: A5Values, revision: number) {
    return store.transaction(() => {
      const current = store.doc(id);
      ensureCurrentDocument(current); store.check(current.revision, revision);
      for (const key of ["hpb", "hpj", "knb", "tkdn_barang", "tkdn_jasa"] as const) decimal(values[key], key.startsWith("tkdn"));
      const next = reviewedDocument(toDocument(current), values);
      if (!next && current.status === "CONFIRMED") return toDocument(copy(current));
      if (next) Object.assign(current, toLocalDocument(next));
      current.status = "CONFIRMED"; current.acknowledged = true;
      store.event({ procurementId: current.procurementId, module: "HEA", type: "CONFIRMED", summary: `${current.name} disimpan` });
      evaluations.refreshHEA(current.procurementId);
      store.emit();
      return toDocument(copy(current));
    });
  }
  return {
    ...base,
    uploadDocument: async input => store.transaction(() => {
      store.proc(input.procurementId);
      const source = catalog.sources.find(s => s.id === input.sourceId && s.kind === "FORM_A5");
      const candidate = catalog.a5.find(a => a.sourceId === source?.id)?.candidate;
      if (input.kind !== "FORM_A5" || !source || !candidate) throw new DomainError("WRONG_KIND", "Gunakan pembacaan spreadsheet untuk sumber ini.");
      if (!store.state.vendors.some(v => v.id === input.vendorId && v.procurementId === input.procurementId)) throw new DomainError("VENDOR_REQUIRED", "Pilih vendor pemilik dokumen.");
      if (store.state.documents.some(d => d.procurementId === input.procurementId && !d.removedAt && !d.supersededBy && (d.sha256 === source.sha256 || (d.kind === "FORM_A5" && d.vendorId === input.vendorId)))) throw new DomainError("DUPLICATE", "Form A5 sudah tersedia. Gunakan penggantian dokumen vendor.");
      const document = { id: store.id("doc"), procurementId: input.procurementId, vendorId: input.vendorId, fixtureId: source.id, name: input.name,
        kind: "FORM_A5" as const, sha256: source.sha256, uploadedAt: new Date().toISOString(), revision: 1, status: "REVIEW_REQUIRED" as const,
        candidate: copy(candidate.values), reviewed: copy(candidate.values), candidateVendorName: candidate.vendorName, warnings: copy(candidate.warnings), sources: copy(candidate.sources), acknowledged: false, groups: [], pairs: [], published: false };
      store.state.documents.unshift(document);
      store.event({ procurementId: input.procurementId, module: "HEA", type: "UPLOADED", summary: `${document.name} selesai dibaca` }); store.emit();
      return toDocument(copy(document));
    }),
    reviewDocument: save,
    confirmDocument: async (id, revision) => {
      const d = store.doc(id);
      if (d.kind !== "FORM_A5" || !d.reviewed) throw new DomainError("WRONG_KIND", "Gunakan penyimpanan spreadsheet untuk dokumen ini.");
      return save(id, d.reviewed, revision);
    },
    removeVendorDocument: (...args) => removeVendorDocument(store, ...args, () => { evaluations.refreshHEA(args[0]); evaluations.refreshPrice(args[0]); }),
    removeOwnerEstimate: (...args) => removeOwnerEstimate(store, ...args, () => { evaluations.refreshPrice(args[0]); }),
  };
}
