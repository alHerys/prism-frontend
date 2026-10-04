import type { ReadStore } from "../../../shared/kernel/read-store";
import type { HistoricalItem } from "../../historical-prices/domain/models";
import type { Estimate } from "../../historical-prices/domain/models";
import type { Procurement } from "../../procurement/domain/models";
import type { DocumentRecord } from "../../documents/domain/models";

export interface HistoricalPricesData {
  historicalItems: HistoricalItem[];
  estimates: Estimate[];
  procurements: Procurement[];
  documents: DocumentRecord[];
}
export type HistoricalPricesQueries = ReadStore<HistoricalPricesData>;
