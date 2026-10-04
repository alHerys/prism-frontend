import type { DocumentRecord } from "../../documents/domain/models";
import type { Estimate } from "../domain/models";
import type { HistoricalStatistics } from "../domain/models";
import type { Snapshot } from "../../evaluations/domain/models";

export interface HistoricalPricesGateway {
  setHistoricalMetadata(id: string, input: {
    functionName: string;
    period: string;
  }, expectedRevision: number): Promise<DocumentRecord>;
  publishHistory(id: string, expectedRevision: number): Promise<DocumentRecord>;
  setComparable(id: string, value: boolean): Promise<void>;
  estimate(input: {
    description: string;
    unit: string;
    quantity: string;
    referenceIds: string[];
  }): Promise<Estimate>;
  getPreparedStatistics(referenceIds: string[]): HistoricalStatistics | undefined;
  getHistoricalStatistics: (referenceIds: string[]) => HistoricalStatistics | undefined;
  createBankSnapshot(referenceIds: string[]): Promise<Snapshot>;
}
