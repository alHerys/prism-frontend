import type { ReadStore } from "../../../shared/kernel/read-store";
import type { Procurement } from "../../procurement/domain/models";
import type { Vendor } from "../../procurement/domain/models";
import type { DocumentRecord } from "../../documents/domain/models";
import type { Snapshot } from "../../evaluations/domain/models";
import type { Activity } from "../../evaluations/domain/models";

export interface ProcurementData {
  procurements: Procurement[];
  vendors: Vendor[];
  documents: DocumentRecord[];
  snapshots: Snapshot[];
  events: Activity[];
}
export type ProcurementQueries = ReadStore<ProcurementData>;
