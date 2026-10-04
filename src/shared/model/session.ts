// Temporary migration bridge; business models belong to their modules.
import type { Procurement, Vendor } from "../../modules/procurement/domain/models";
import type { DocumentRecord } from "../../modules/documents/domain/models";
import type { HistoricalItem, Estimate } from "../../modules/historical-prices/domain/models";
import type { Snapshot, Activity } from "../../modules/evaluations/domain/models";

export type { DocumentKind, Status, A5Values, Source, DocumentRecord, UploadInput } from "../../modules/documents/domain/models";
export type { Module, ResultRow, Snapshot, Activity } from "../../modules/evaluations/domain/models";
export type { Preferences } from "../../modules/hea/domain/models";
export type { HistoricalItem, Estimate, HistoricalStatistics } from "../../modules/historical-prices/domain/models";
export type { PriceSourceItem, PricePair } from "../../modules/price-deviation/domain/models";
export type { Procurement, Vendor } from "../../modules/procurement/domain/models";

export interface DemoState {
  procurements: Procurement[];
  vendors: Vendor[];
  documents: DocumentRecord[];
  snapshots: Snapshot[];
  historicalItems: HistoricalItem[];
  events: Activity[];
  estimates: Estimate[];
}
