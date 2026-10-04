import type { PriceDeviationGateway } from "./ports";
import type { Delay } from "../../../shared/kernel/binary-source";

export function createPriceDeviationUseCases(gateway: PriceDeviationGateway, delay: Delay) {
  return {
    selectGroup: (...args: Parameters<PriceDeviationGateway["selectGroup"]>) => gateway.selectGroup(...args),
    reviewPairs: (...args: Parameters<PriceDeviationGateway["reviewPairs"]>) => gateway.reviewPairs(...args),
    confirmPairs: (...args: Parameters<PriceDeviationGateway["confirmPairs"]>) => gateway.confirmPairs(...args),
    evaluateDeviation: async (...args: Parameters<PriceDeviationGateway["evaluateDeviation"]>) => { await delay(450); return gateway.evaluateDeviation(...args); },
  };
}
export type PriceDeviationUseCases = ReturnType<typeof createPriceDeviationUseCases>;
