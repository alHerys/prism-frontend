import { createA5IntakeUseCases } from "../../modules/documents/application/intake-use-cases";
import type { SnapshotExporter } from "../../modules/evaluations/application/ports";
import { createLocalRuntime } from "../../infrastructure/local/runtime";
import { createProcurementUseCases } from "../../modules/procurement/application/use-cases";
import { createDocumentsUseCases } from "../../modules/documents/application/use-cases";
import { createHEAUseCases } from "../../modules/hea/application/use-cases";
import { createPriceDeviationUseCases } from "../../modules/price-deviation/application/use-cases";
import { createHistoricalPricesUseCases } from "../../modules/historical-prices/application/use-cases";
import { createEvaluationsUseCases } from "../../modules/evaluations/application/use-cases";

export function createApplication(runtime = createLocalRuntime(true, true), exporter: SnapshotExporter = {
  previewHEA: async (snapshot, procurement) => {
    const { previewHEAReport } = await import("../../modules/evaluations/infrastructure/workbook");
    return previewHEAReport(snapshot, procurement);
  },
  download: async (snapshot, procurement) => {
    const { downloadSnapshot } = await import("../../modules/evaluations/infrastructure/workbook");
    await downloadSnapshot(snapshot, procurement);
  },
}) {
  const documents = createDocumentsUseCases(runtime.documents.gateway, runtime.processing, runtime.priceDeviation.gateway, runtime.ownerEstimate, runtime.offerSpreadsheet);
  const evaluations = createEvaluationsUseCases(runtime.evaluations.gateway, runtime.procurement.queries, exporter);
  return {
    procurement: { commands: createProcurementUseCases(runtime.procurement.gateway), queries: runtime.procurement.queries },
    intake: { commands: createA5IntakeUseCases(runtime.intake.store, runtime.intake.assets, runtime.intake.extraction, runtime.intake.publication), queries: runtime.intake.store },
    documents: { commands: documents, queries: runtime.documents.queries },
    hea: { commands: createHEAUseCases(runtime.hea.gateway, runtime.delay), queries: runtime.hea.queries },
    priceDeviation: { commands: createPriceDeviationUseCases(runtime.priceDeviation.gateway, runtime.delay), queries: runtime.priceDeviation.queries },
    historicalPrices: { commands: createHistoricalPricesUseCases(runtime.historicalPrices.gateway, runtime.delay, documents, evaluations), queries: runtime.historicalPrices.queries },
    evaluations: { commands: evaluations, queries: runtime.evaluations.queries },
  };
}
export type Application = ReturnType<typeof createApplication>;
