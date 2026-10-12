import type { ReadStore } from "../../../shared/kernel/read-store";
import type { DocumentRecord } from "../domain/models";
import type { Procurement } from "../../procurement/domain/models";
import type { Vendor } from "../../procurement/domain/models";

export interface DocumentsData {
  documents: DocumentRecord[];
  procurements: Procurement[];
  vendors: Vendor[];
}
export type DocumentsQueries = ReadStore<DocumentsData>;

export function currentOwnerEstimate(documents: readonly DocumentRecord[], procurementId: string) {
  return documents.find(document => document.procurementId === procurementId && document.kind === "OE" && !document.supersededBy && !document.removedAt);
}
