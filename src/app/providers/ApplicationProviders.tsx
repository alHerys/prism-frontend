import type { ReactNode } from "react";
import type { Application } from "../bootstrap/application";
import { ProcurementProvider } from "../../modules/procurement/presentation/binding";
import { DocumentsProvider, A5IntakeProvider } from "../../modules/documents/presentation/binding";
import { HEAProvider } from "../../modules/hea/presentation/binding";
import { PriceDeviationProvider } from "../../modules/price-deviation/presentation/binding";
import { HistoricalPricesProvider } from "../../modules/historical-prices/presentation/binding";
import { EvaluationsProvider } from "../../modules/evaluations/presentation/binding";
import { WorkspacePreferencesProvider } from "../../shared/ui/workspace-preferences";
import { HelpSearchProvider } from "../../shared/ui/help-search";
import type { WorkspacePreferencesStorage } from "../../shared/kernel/workspace-preferences";
export function ApplicationProviders({ application, preferencesStorage, children }: { application: Application; preferencesStorage?: WorkspacePreferencesStorage; children: ReactNode }) {
  return (
    <WorkspacePreferencesProvider storage={preferencesStorage}>
    <HelpSearchProvider>
    <ProcurementProvider value={application.procurement}>
    <DocumentsProvider value={application.documents}>
    <A5IntakeProvider value={application.intake}>
    <HEAProvider value={application.hea}>
    <PriceDeviationProvider value={application.priceDeviation}>
    <HistoricalPricesProvider value={application.historicalPrices}>
    <EvaluationsProvider value={application.evaluations}>
      {children}
    </EvaluationsProvider>
    </HistoricalPricesProvider>
    </PriceDeviationProvider>
    </HEAProvider>
    </A5IntakeProvider>
    </DocumentsProvider>
    </ProcurementProvider>
    </HelpSearchProvider>
    </WorkspacePreferencesProvider>
  );
}
