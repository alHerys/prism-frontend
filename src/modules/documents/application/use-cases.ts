import type { DocumentsGateway, DocumentProcessing, ReviewWorkflow } from "./ports";
import type { PriceDeviationGateway } from "../../price-deviation/application/ports";
import type { BinarySource } from "../../../shared/kernel/binary-source";
import type { A5Values, DocumentKind, DocumentRecord, UploadInput } from "../domain/models";
import type { PricePair } from "../../price-deviation/domain/models";
import type { OfferSpreadsheetPort } from "./offer-spreadsheet-ports";
import type { OwnerEstimatePort } from "./owner-estimate-ports";
export interface SaveReviewInput {
  document: DocumentRecord;
  values?: A5Values;
  group?: string;
  pairs: PricePair[];
}
export function createDocumentsUseCases(gateway: DocumentsGateway, processing: DocumentProcessing, prices: Pick<PriceDeviationGateway, "selectGroup" | "reviewPairs" | "confirmPairs">, ownerEstimate?: OwnerEstimatePort, offerSpreadsheet?: OfferSpreadsheetPort, reviewWorkflow: ReviewWorkflow = "SEPARATE_CONFIRMATION") {
  const oe = () => { if (!ownerEstimate) throw new Error("Pembacaan OE belum tersedia."); return ownerEstimate; };
  const offer = () => { if (!offerSpreadsheet) throw new Error("Pembacaan penawaran belum tersedia."); return offerSpreadsheet; };
  return {
    reviewWorkflow,
    prepareOfferSpreadsheet: (...args: Parameters<OfferSpreadsheetPort["prepare"]>) => offer().prepare(...args),
    publishOfferSpreadsheet: (...args: Parameters<OfferSpreadsheetPort["publish"]>) => offer().publish(...args),
    releaseOfferSpreadsheet: (id: string) => offer().release(id),
    saveAndConfirmOfferSpreadsheet: (...args: Parameters<OfferSpreadsheetPort["saveAndConfirm"]>) => offer().saveAndConfirm(...args),
    prepareOwnerEstimate: (...args: Parameters<OwnerEstimatePort["prepare"]>) => oe().prepare(...args),
    publishOwnerEstimate: (...args: Parameters<OwnerEstimatePort["publish"]>) => oe().publish(...args),
    releaseOwnerEstimate: (id: string) => oe().release(id),
    saveAndConfirmOwnerEstimate: (...args: Parameters<OwnerEstimatePort["saveAndConfirm"]>) => oe().saveAndConfirm(...args),
    removeVendorDocument: (...args: Parameters<DocumentsGateway["removeVendorDocument"]>) => gateway.removeVendorDocument(...args),
    removeOwnerEstimate: (...args: Parameters<DocumentsGateway["removeOwnerEstimate"]>) => gateway.removeOwnerEstimate(...args),
    availableSources: () => processing.availableSources(),
    upload: async (input: { file: BinarySource; kind: DocumentKind; procurementId: string; vendorId?: string; replacement?: UploadInput["replacement"] }, onProgress: (label: string) => void) => {
      const source = await processing.process(input.file, input.kind, onProgress);
      return gateway.uploadDocument({
        procurementId: input.procurementId,
        kind: input.kind,
        ...(Object.hasOwn(input, "vendorId") ? { vendorId: input.vendorId } : {}),
        sourceId: source.id,
        name: input.file.name,
        ...(input.replacement ? { replacement: input.replacement } : {}),
      });
    },
    saveReview: async ({ document, values, group, pairs }: SaveReviewInput) => {
      if (values) return gateway.reviewDocument(document.id, values, document.revision);
      let current = document;
      if (group && group !== current.selectedGroup) current = await prices.selectGroup(current.id, group, current.revision);
      if (current.kind === "OFFER") return prices.reviewPairs(current.id, pairs, current.revision);
      return current;
    },
    confirmReview: (document: DocumentRecord, acknowledged: boolean) => document.kind === "OFFER"
      ? prices.confirmPairs(document.id, document.revision, acknowledged)
      : gateway.confirmDocument(document.id, document.revision, acknowledged),
    confirmDocument: (...args: Parameters<DocumentsGateway["confirmDocument"]>) => gateway.confirmDocument(...args),
  };
}
export type DocumentsUseCases = ReturnType<typeof createDocumentsUseCases>;
