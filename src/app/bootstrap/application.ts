import { createLocalRuntime } from "../../infrastructure/local/runtime";
import { createProcurementUseCases } from "../../modules/procurement/application/use-cases";
import { createDocumentsUseCases } from "../../modules/documents/application/use-cases";
import { createHEAUseCases } from "../../modules/hea/application/use-cases";
import { createPriceDeviationUseCases } from "../../modules/price-deviation/application/use-cases";
import { createHistoricalPricesUseCases } from "../../modules/historical-prices/application/use-cases";
import { createEvaluationsUseCases } from "../../modules/evaluations/application/use-cases";

export function createApplication(runtime = createLocalRuntime(true, true)) {
  return {
    procurement: { commands: createProcurementUseCases(runtime.procurement.gateway), queries: runtime.procurement.queries },
    documents: { commands: createDocumentsUseCases(runtime.documents.gateway, runtime.processing, runtime.priceDeviation.gateway), queries: runtime.documents.queries },
    hea: { commands: createHEAUseCases(runtime.hea.gateway, runtime.delay), queries: runtime.hea.queries },
    priceDeviation: { commands: createPriceDeviationUseCases(runtime.priceDeviation.gateway, runtime.delay), queries: runtime.priceDeviation.queries },
    historicalPrices: { commands: createHistoricalPricesUseCases(runtime.historicalPrices.gateway, runtime.delay), queries: runtime.historicalPrices.queries },
    evaluations: { commands: createEvaluationsUseCases(runtime.evaluations.gateway), queries: runtime.evaluations.queries },
  };
}
export type Application = ReturnType<typeof createApplication>;
