import type { PertaminaCatalog } from "./catalog";
import type { LocalStore } from "../local/store";
import type { EvaluationCoordinator } from "./evaluations";
import type { SpreadsheetSheet } from "../../modules/documents/domain/spreadsheet";
import { identifySpreadsheet } from "../../modules/documents/domain/spreadsheet";
import { copy } from "../../shared/kernel/validation";
import type { LocalDocumentRecord } from "../local/state";

function seedDocument(store: LocalStore, catalog: PertaminaCatalog, procurementId: string, sourceId: string, vendorId?: string, sheet?: SpreadsheetSheet) {
  const source = catalog.sources.find(s => s.id === sourceId)!;
  const candidate = catalog.a5.find(a => a.sourceId === sourceId)?.candidate;
  const id = store.id("doc");
  const table = sheet ? identifySpreadsheet(sheet, id) : undefined;
  const document: LocalDocumentRecord = {
    id, procurementId, vendorId, fixtureId: source.id, kind: source.kind, name: source.name, sha256: source.sha256,
    revision: 1, uploadedAt: new Date().toISOString(), status: "CONFIRMED", acknowledged: true,
    warnings: copy(candidate?.warnings ?? sheet?.warnings ?? []), sources: copy(candidate?.sources ?? []), groups: [], pairs: [], published: false,
    ...(candidate ? { candidate: copy(candidate.values), reviewed: copy(candidate.values), candidateVendorName: candidate.vendorName } : {}),
    ...(source.kind === "OE" && table ? { ownerEstimate: { candidate: table, reviewed: copy(table) } } : {}),
    ...(source.kind === "OFFER" && table ? { offerSpreadsheet: { candidate: table, reviewed: copy(table), status: "CONFIRMED", acknowledged: true } } : {}),
  };
  store.state.documents.push(document);
}

export function seedPertamina(store: LocalStore, catalog: PertaminaCatalog, sheets: { oe: SpreadsheetSheet; offer: SpreadsheetSheet }, evaluations: EvaluationCoordinator) {
  store.transaction(() => {
    for (const [index, stage] of ["new", "partial", "complete"].entries()) {
      const id = `proc-pertamina-${stage}`;
      store.state.procurements.push({ id, name: catalog.procurementName, number: `PGD-${String(index + 1).padStart(3, "0")}`, functionName: catalog.functionName,
        createdAt: new Date().toISOString(), preferenceRevision: stage === "new" ? 0 : 1, preferenceConfirmed: stage !== "new", ...(stage === "new" ? {} : { preferences: copy(catalog.preferences) }) });
      if (stage !== "new") {
        for (const a5 of catalog.a5) {
          const vendorId = `${id}-${a5.sourceId}`;
          store.state.vendors.push({ id: vendorId, procurementId: id, name: a5.candidate.vendorName });
          seedDocument(store, catalog, id, a5.sourceId, vendorId);
        }
        seedDocument(store, catalog, id, "PD-001", undefined, sheets.oe);
        if (stage === "complete") seedDocument(store, catalog, id, "PD-002", `${id}-HEA-001`, sheets.offer);
        evaluations.refreshHEA(id); evaluations.refreshPrice(id);
      }
      store.event({ procurementId: id, module: "PROCUREMENT", type: "CREATED", summary: "Pengadaan dibuat" });
    }
    store.emit();
  });
}
