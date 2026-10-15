import type { A5ExtractionPort } from "../../modules/documents/application/intake-ports";
import { LocalStore } from "./store";
import { initializeSession } from "./seed";
import { createLocalServices } from "./services";
import type { LocalServices } from "./services";
import { toDocument } from "./document-mapping";
import type { LocalState } from "./state";
import type { ReadStore } from "../../shared/kernel/read-store";
import type { ProcurementData } from "../../modules/procurement/application/queries";
import type { DocumentsData } from "../../modules/documents/application/queries";
import type { HEAData } from "../../modules/hea/application/queries";
import type { PriceDeviationData } from "../../modules/price-deviation/application/queries";
import type { HistoricalPricesData } from "../../modules/historical-prices/application/queries";
import type { EvaluationsData } from "../../modules/evaluations/application/queries";
export { createBrowserPreferencesStorage } from "../browser/workspace-preferences";

function projection<T>(source: { getState(): LocalState; subscribe(listener: () => void): () => void }, select: (state: LocalState) => T): ReadStore<T> {
  let parent: LocalState | undefined;
  let snapshot: T;
  let fingerprint: string;
  return {
    subscribe: source.subscribe,
    getSnapshot: () => {
      const state = source.getState();
      if (state !== parent) {
        const next = select(state);
        const encoded = JSON.stringify(next);
        if (encoded !== fingerprint) { snapshot = Object.freeze(next); fingerprint = encoded; }
        parent = state;
      }
      return snapshot;
    },
  };
}
export function createLocalRuntime(seed = true, prepared = false, extraction?: A5ExtractionPort,
  configure?: (services: LocalServices, store: LocalStore) => LocalServices) {
  const store = new LocalStore();
  initializeSession(store, seed, prepared);
  const defaults = createLocalServices(store, extraction);
  const services = configure ? configure(defaults, store) : defaults;
  const { ownerEstimate, offerSpreadsheet, processing, intake, procurementGateway, documentsGateway, heaGateway, priceDeviationGateway, historicalPricesGateway, evaluationsGateway } = services;
  const source = { getState: store.getState, subscribe: store.subscribe };
  return {
    ownerEstimate, offerSpreadsheet, processing, intake, reviewWorkflow: services.reviewWorkflow,
    delay: (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
    procurement: { gateway: procurementGateway, queries: projection<ProcurementData>(source, (state) => ({ procurements: state.procurements, vendors: state.vendors, documents: Object.freeze(state.documents.filter(document => !document.supersededBy && !document.removedAt).map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], snapshots: state.snapshots, events: state.events })) },
    documents: { gateway: documentsGateway, queries: projection<DocumentsData>(source, (state) => ({ documents: Object.freeze(state.documents.map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], procurements: state.procurements, vendors: state.vendors })) },
    hea: { gateway: heaGateway, queries: projection<HEAData>(source, (state) => ({ documents: Object.freeze(state.documents.map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], vendors: state.vendors, snapshots: state.snapshots })) },
    priceDeviation: { gateway: priceDeviationGateway, queries: projection<PriceDeviationData>(source, (state) => ({ vendors: state.vendors, documents: Object.freeze(state.documents.filter(document => !document.supersededBy && !document.removedAt).map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], snapshots: state.snapshots })) },
    historicalPrices: { gateway: historicalPricesGateway, queries: projection<HistoricalPricesData>(source, (state) => ({ historicalItems: state.historicalItems, estimates: state.estimates, procurements: state.procurements, documents: Object.freeze(state.documents.map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"] })) },
    evaluations: { gateway: evaluationsGateway, queries: projection<EvaluationsData>(source, (state) => ({ snapshots: state.snapshots, events: state.events, procurements: state.procurements })) },
  };
}
