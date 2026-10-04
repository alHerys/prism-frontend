import type { Procurement, Vendor } from "../../modules/procurement/domain/models";
import type { DocumentRecord } from "../../modules/documents/domain/models";
import type { HistoricalItem, Estimate } from "../../modules/historical-prices/domain/models";
import type { Snapshot, Activity } from "../../modules/evaluations/domain/models";


export interface LocalState {
  procurements: Procurement[];
  vendors: Vendor[];
  documents: DocumentRecord[];
  snapshots: Snapshot[];
  historicalItems: HistoricalItem[];
  events: Activity[];
  estimates: Estimate[];
}
