import type { ReadStore } from "../../../shared/kernel/read-store";
import type { HistoricalItem } from "../domain/models";
import type { Estimate } from "../domain/models";

export interface HistoricalPricesData { historicalItems: HistoricalItem[]; estimates: Estimate[]; }
export type HistoricalPricesQueries = ReadStore<HistoricalPricesData>;
