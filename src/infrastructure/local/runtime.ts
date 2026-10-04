import { createLocalSession } from "./service";
import { processLocalDocument } from "./process-document";
import { availableDocuments } from "./file-registry";
import type { ReadStore } from "../../shared/kernel/read-store";
import type { DemoState } from "../../shared/model/session";
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

function projection<T>(source: { getState(): DemoState; subscribe(listener: () => void): () => void }, select: (state: DemoState) => T): ReadStore<T> {
  let parent: DemoState | undefined;
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
export function createLocalRuntime(seed = true, prepared = false) {
  const session = createLocalSession(seed, prepared);
  const processing: DocumentProcessing = { process: async (file, kind, onProgress) => ({ ...await processLocalDocument(file, kind, onProgress), kind }), availableSources: () => availableDocuments().map((source) => ({ ...source, kind: source.kind as DocumentKind })) };
  const procurementGateway: ProcurementGateway = {
    createProcurement: session.createProcurement.bind(session),
    addVendor: session.addVendor.bind(session),
  };
  const documentsGateway: DocumentsGateway = {
    uploadRegisteredDocument: session.uploadRegisteredDocument.bind(session),
    reviewDocument: session.reviewDocument.bind(session),
    confirmDocument: session.confirmDocument.bind(session),
  };
  const heaGateway: HEAGateway = {
    setPreferences: session.setPreferences.bind(session),
    confirmPreferences: session.confirmPreferences.bind(session),
    evaluateHEA: session.evaluateHEA.bind(session),
  };
  const priceDeviationGateway: PriceDeviationGateway = {
    selectGroup: session.selectGroup.bind(session),
    reviewPairs: session.reviewPairs.bind(session),
    confirmPairs: session.confirmPairs.bind(session),
    evaluateDeviation: session.evaluateDeviation.bind(session),
  };
  const historicalPricesGateway: HistoricalPricesGateway = {
    setHistoricalMetadata: session.setHistoricalMetadata.bind(session),
    publishHistory: session.publishHistory.bind(session),
    setComparable: session.setComparable.bind(session),
    estimate: session.estimate.bind(session),
    getPreparedStatistics: session.getPreparedStatistics.bind(session),
    getHistoricalStatistics: session.getHistoricalStatistics.bind(session),
    createBankSnapshot: session.createBankSnapshot.bind(session),
  };
  const evaluationsGateway: EvaluationsGateway = {
    recordExport: session.recordExport.bind(session),
  };
  return {
    // Temporary migration bridge; removed with legacy consumers.
    session, processing,
    delay: (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
    procurement: { gateway: procurementGateway, queries: projection<ProcurementData>(session, (state) => ({ procurements: state.procurements, vendors: state.vendors })) },
    documents: { gateway: documentsGateway, queries: projection<DocumentsData>(session, (state) => ({ documents: state.documents })) },
    hea: { gateway: heaGateway, queries: projection<HEAData>(session, (state) => ({ procurements: state.procurements })) },
    priceDeviation: { gateway: priceDeviationGateway, queries: projection<PriceDeviationData>(session, (state) => ({ documents: state.documents })) },
    historicalPrices: { gateway: historicalPricesGateway, queries: projection<HistoricalPricesData>(session, (state) => ({ historicalItems: state.historicalItems, estimates: state.estimates })) },
    evaluations: { gateway: evaluationsGateway, queries: projection<EvaluationsData>(session, (state) => ({ snapshots: state.snapshots, events: state.events })) },
  };
}
