import { createIntakeStore } from "./intake-store";
import { createIntakeAssets } from "./intake-assets";
import { createA5Publication } from "./intake-publication";
import { createA5Intelligence } from "../http/a5-intelligence";
import type { A5ExtractionPort } from "../../modules/documents/application/intake-ports";
import { toDocument, toLocalUpload } from "./document-mapping";
import { LocalStore } from "./store";
import { initializeSession } from "./seed";
import { createProcurement, addVendor } from "./procurement";
import { uploadRegisteredDocument, reviewDocument, confirmDocument, removeOwnerEstimate, removeVendorDocument } from "./documents";
import { setPreferences, confirmPreferences, evaluateHEA } from "./hea";
import { selectGroup, reviewPairs, confirmPairs, evaluateDeviation } from "./price-deviation";
import { setHistoricalMetadata, publishHistory, setComparable, estimate, getPreparedStatistics, createBankSnapshot } from "./historical";
import { recordExport } from "./snapshots";
import { processLocalDocument } from "./process-document";
import { availableDocuments } from "./file-registry";
import type { ReadStore } from "../../shared/kernel/read-store";
import type { LocalState } from "./state";
import type { DocumentKind } from "../../modules/documents/domain/models";
import type { DocumentProcessing } from "../../modules/documents/application/ports";
import type { ProcurementGateway } from "../../modules/procurement/application/ports";
import type { ProcurementData } from "../../modules/procurement/application/queries";
import type { DocumentsGateway } from "../../modules/documents/application/ports";
import type { DocumentsData } from "../../modules/documents/application/queries";
import type { HEAGateway } from "../../modules/hea/application/ports";
import type { HEAData } from "../../modules/hea/application/queries";
import type { PriceDeviationGateway } from "../../modules/price-deviation/application/ports";
import type { PriceDeviationData } from "../../modules/price-deviation/application/queries";
import type { HistoricalPricesGateway } from "../../modules/historical-prices/application/ports";
import type { HistoricalPricesData } from "../../modules/historical-prices/application/queries";
import type { EvaluationsGateway } from "../../modules/evaluations/application/ports";
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
export function createLocalRuntime(seed = true, prepared = false, extraction?: A5ExtractionPort) {
  const store = new LocalStore();
  initializeSession(store, seed, prepared);
  const assets = createIntakeAssets();
  const intake = { store: createIntakeStore(), assets, publication: createA5Publication(store), extraction: extraction ?? createA5Intelligence(import.meta.env.VITE_DOCUMENT_API_URL || "/api") };
  const source = { getState: store.getState, subscribe: store.subscribe };
  const processing: DocumentProcessing = { process: async (file, kind, onProgress) => ({ ...await processLocalDocument(file, kind, onProgress), kind }), availableSources: () => [...availableDocuments().map((source) => ({ ...source, kind: source.kind as DocumentKind })), ...assets.sources().map(source => ({ ...source, kind: "FORM_A5" as const }))] };
  const procurementGateway: ProcurementGateway = {
    createProcurement: (...args: Parameters<ProcurementGateway["createProcurement"]>) => createProcurement(store, ...args),
    addVendor: (...args: Parameters<ProcurementGateway["addVendor"]>) => addVendor(store, ...args),
  };
  const documentsGateway: DocumentsGateway = {
    removeOwnerEstimate: (...args) => removeOwnerEstimate(store, ...args),
    removeVendorDocument: (...args) => removeVendorDocument(store, ...args),
    uploadDocument: async (input) => toDocument(await uploadRegisteredDocument(store, toLocalUpload(input))),
    reviewDocument: async (...args: Parameters<DocumentsGateway["reviewDocument"]>) => toDocument(await reviewDocument(store, ...args)),
    confirmDocument: async (...args: Parameters<DocumentsGateway["confirmDocument"]>) => toDocument(await confirmDocument(store, ...args)),
  };
  const heaGateway: HEAGateway = {
    setPreferences: (...args: Parameters<HEAGateway["setPreferences"]>) => setPreferences(store, ...args),
    confirmPreferences: (...args: Parameters<HEAGateway["confirmPreferences"]>) => confirmPreferences(store, ...args),
    evaluateHEA: (...args: Parameters<HEAGateway["evaluateHEA"]>) => evaluateHEA(store, ...args),
  };
  const priceDeviationGateway: PriceDeviationGateway = {
    selectGroup: async (...args: Parameters<PriceDeviationGateway["selectGroup"]>) => toDocument(await selectGroup(store, ...args)),
    reviewPairs: async (...args: Parameters<PriceDeviationGateway["reviewPairs"]>) => toDocument(await reviewPairs(store, ...args)),
    confirmPairs: async (...args: Parameters<PriceDeviationGateway["confirmPairs"]>) => toDocument(await confirmPairs(store, ...args)),
    evaluateDeviation: (...args: Parameters<PriceDeviationGateway["evaluateDeviation"]>) => evaluateDeviation(store, ...args),
  };
  const historicalPricesGateway: HistoricalPricesGateway = {
    setHistoricalMetadata: async (...args: Parameters<HistoricalPricesGateway["setHistoricalMetadata"]>) => toDocument(await setHistoricalMetadata(store, ...args)),
    publishHistory: async (...args: Parameters<HistoricalPricesGateway["publishHistory"]>) => toDocument(await publishHistory(store, ...args)),
    setComparable: (...args: Parameters<HistoricalPricesGateway["setComparable"]>) => setComparable(store, ...args),
    estimate: (...args: Parameters<HistoricalPricesGateway["estimate"]>) => estimate(store, ...args),
    getHistoricalStatistics: (...args: Parameters<HistoricalPricesGateway["getHistoricalStatistics"]>) => getPreparedStatistics(store, ...args),
    createBankSnapshot: (...args: Parameters<HistoricalPricesGateway["createBankSnapshot"]>) => createBankSnapshot(store, ...args),
  };
  const evaluationsGateway: EvaluationsGateway = {
    recordExport: (...args: Parameters<EvaluationsGateway["recordExport"]>) => recordExport(store, ...args),
  };
  return {
    processing,
    intake,
    delay: (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
    procurement: { gateway: procurementGateway, queries: projection<ProcurementData>(source, (state) => ({ procurements: state.procurements, vendors: state.vendors, documents: Object.freeze(state.documents.filter(document => !document.supersededBy && !document.removedAt).map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], snapshots: state.snapshots, events: state.events })) },
    documents: { gateway: documentsGateway, queries: projection<DocumentsData>(source, (state) => ({ documents: Object.freeze(state.documents.map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], procurements: state.procurements, vendors: state.vendors })) },
    hea: { gateway: heaGateway, queries: projection<HEAData>(source, (state) => ({ documents: Object.freeze(state.documents.map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], vendors: state.vendors, snapshots: state.snapshots })) },
    priceDeviation: { gateway: priceDeviationGateway, queries: projection<PriceDeviationData>(source, (state) => ({ documents: Object.freeze(state.documents.filter(document => !document.supersededBy && !document.removedAt).map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"], snapshots: state.snapshots })) },
    historicalPrices: { gateway: historicalPricesGateway, queries: projection<HistoricalPricesData>(source, (state) => ({ historicalItems: state.historicalItems, estimates: state.estimates, procurements: state.procurements, documents: Object.freeze(state.documents.map((document) => Object.freeze(toDocument(document)))) as unknown as DocumentsData["documents"] })) },
    evaluations: { gateway: evaluationsGateway, queries: projection<EvaluationsData>(source, (state) => ({ snapshots: state.snapshots, events: state.events, procurements: state.procurements })) },
  };
}
