import type { DocumentsGateway } from "./ports";

export function createDocumentsUseCases(gateway: DocumentsGateway) {
  return {
    uploadRegisteredDocument: (...args: Parameters<DocumentsGateway["uploadRegisteredDocument"]>) => gateway.uploadRegisteredDocument(...args),
    reviewDocument: (...args: Parameters<DocumentsGateway["reviewDocument"]>) => gateway.reviewDocument(...args),
    confirmDocument: (...args: Parameters<DocumentsGateway["confirmDocument"]>) => gateway.confirmDocument(...args),
  };
}
export type DocumentsUseCases = ReturnType<typeof createDocumentsUseCases>;
