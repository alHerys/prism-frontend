import type { ReactNode } from "react";
import type { Application } from "../bootstrap/application";
import { ProcurementProvider } from "../../modules/procurement/presentation/binding";
import { DocumentsProvider } from "../../modules/documents/presentation/binding";
import { HEAProvider } from "../../modules/hea/presentation/binding";
import { PriceDeviationProvider } from "../../modules/price-deviation/presentation/binding";
import { HistoricalPricesProvider } from "../../modules/historical-prices/presentation/binding";
import { EvaluationsProvider } from "../../modules/evaluations/presentation/binding";
export function ApplicationProviders({ application, children }: { application: Application; children: ReactNode }) {
  return (
    <ProcurementProvider value={application.procurement}>
    <DocumentsProvider value={application.documents}>
    <HEAProvider value={application.hea}>
    <PriceDeviationProvider value={application.priceDeviation}>
    <HistoricalPricesProvider value={application.historicalPrices}>
    <EvaluationsProvider value={application.evaluations}>
      {children}
    </EvaluationsProvider>
    </HistoricalPricesProvider>
    </PriceDeviationProvider>
    </HEAProvider>
    </DocumentsProvider>
    </ProcurementProvider>
  );
}
