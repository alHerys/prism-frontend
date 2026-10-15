import { createIntakeStore } from "./intake-store";
import { createIntakeAssets } from "./intake-assets";
import { createA5Publication } from "./intake-publication";
import { createA5Intelligence } from "../http/a5-intelligence";
import type { A5ExtractionPort } from "../../modules/documents/application/intake-ports";
import { toDocument, toLocalUpload } from "./document-mapping";
import type { LocalStore } from "./store";
import { createProcurement, addVendor } from "./procurement";
import { uploadRegisteredDocument, reviewDocument, confirmDocument, removeOwnerEstimate, removeVendorDocument } from "./documents";
import { setPreferences, confirmPreferences, evaluateHEA } from "./hea";
import { selectGroup, reviewPairs, confirmPairs, evaluateDeviation } from "./price-deviation";
import { setHistoricalMetadata, publishHistory, setComparable, estimate, getPreparedStatistics, createBankSnapshot } from "./historical";
import { recordExport } from "./snapshots";
import { processLocalDocument } from "./process-document";
import { availableDocuments } from "./file-registry";
import { createOfferSpreadsheetAdapter } from "./offer-spreadsheet";
import { createOwnerEstimateAdapter } from "./owner-estimate";
import type { DocumentKind } from "../../modules/documents/domain/models";
import type { DocumentProcessing } from "../../modules/documents/application/ports";
import type { ProcurementGateway } from "../../modules/procurement/application/ports";
import type { DocumentsGateway } from "../../modules/documents/application/ports";
import type { HEAGateway } from "../../modules/hea/application/ports";
import type { PriceDeviationGateway } from "../../modules/price-deviation/application/ports";
import type { HistoricalPricesGateway } from "../../modules/historical-prices/application/ports";
import type { EvaluationsGateway } from "../../modules/evaluations/application/ports";

import type { ReviewWorkflow } from "../../modules/documents/application/ports";

export function createLocalServices(store: LocalStore, extraction?: A5ExtractionPort) {
  const assets = createIntakeAssets();
  const ownerEstimate = createOwnerEstimateAdapter(store);
  const offerSpreadsheet = createOfferSpreadsheetAdapter(store);
  const intake = { store: createIntakeStore(), assets, publication: createA5Publication(store), extraction: extraction ?? createA5Intelligence(import.meta.env.VITE_DOCUMENT_API_URL || "/api") };
  const processing: DocumentProcessing = { process: async (file, kind, onProgress) => ({ ...await processLocalDocument(file, kind, onProgress), kind }), availableSources: () => [...availableDocuments().map((source) => ({ ...source, kind: source.kind as DocumentKind })), ...assets.sources().map(source => ({ ...source, kind: "FORM_A5" as const })), ...ownerEstimate.sources(), ...offerSpreadsheet.sources()] };
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
  return { ownerEstimate, offerSpreadsheet, processing, intake, procurementGateway, documentsGateway, heaGateway, priceDeviationGateway, historicalPricesGateway, evaluationsGateway, reviewWorkflow: "SEPARATE_CONFIRMATION" as ReviewWorkflow };
}
export type LocalServices = ReturnType<typeof createLocalServices>;
