import type { EvaluationsUseCases } from "../../evaluations/application/use-cases";
import type { DocumentsUseCases } from "../../documents/application/use-cases";
import type { HistoricalPricesGateway } from "./ports";
import type { Delay } from "../../../shared/kernel/binary-source";

export function createHistoricalPricesUseCases(gateway: HistoricalPricesGateway, delay: Delay, documents: DocumentsUseCases, evaluations: EvaluationsUseCases) {
  return {
    exportReferences: async (ids: string[]) => {
      const snapshot = await gateway.createBankSnapshot(ids);
      await evaluations.exportSnapshot(snapshot);
      return snapshot;
    },
    upload: documents.upload,
    confirmDocument: documents.confirmDocument,
    setHistoricalMetadata: (...args: Parameters<HistoricalPricesGateway["setHistoricalMetadata"]>) => gateway.setHistoricalMetadata(...args),
    publishHistory: (...args: Parameters<HistoricalPricesGateway["publishHistory"]>) => gateway.publishHistory(...args),
    setComparable: (...args: Parameters<HistoricalPricesGateway["setComparable"]>) => gateway.setComparable(...args),
    estimate: async (...args: Parameters<HistoricalPricesGateway["estimate"]>) => { await delay(800); return gateway.estimate(...args); },
    getPreparedStatistics: (...args: Parameters<HistoricalPricesGateway["getPreparedStatistics"]>) => gateway.getPreparedStatistics(...args),
    getHistoricalStatistics: (...args: Parameters<HistoricalPricesGateway["getHistoricalStatistics"]>) => gateway.getHistoricalStatistics(...args),
    createBankSnapshot: (...args: Parameters<HistoricalPricesGateway["createBankSnapshot"]>) => gateway.createBankSnapshot(...args),
  };
}
export type HistoricalPricesUseCases = ReturnType<typeof createHistoricalPricesUseCases>;
