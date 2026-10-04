import type { HistoricalPricesGateway } from "./ports";
import type { Delay } from "../../../shared/kernel/binary-source";

export function createHistoricalPricesUseCases(gateway: HistoricalPricesGateway, delay: Delay) {
  return {
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
