import type { ReadStore } from "../../../shared/kernel/read-store";
import type { HistoricalItem } from "../../historical-prices/domain/models";
import type { Estimate } from "../../historical-prices/domain/models";

export interface HistoricalPricesData { historicalItems: HistoricalItem[]; estimates: Estimate[]; }
export type HistoricalPricesQueries = ReadStore<HistoricalPricesData>;
