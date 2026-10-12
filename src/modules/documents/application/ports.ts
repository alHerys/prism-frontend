import type { DocumentKind } from "../domain/models";
import type { A5Values } from "../domain/models";
import type { DocumentRecord } from "../domain/models";
import type { UploadInput } from "../domain/models";
import type { BinarySource } from "../../../shared/kernel/binary-source";

export interface DocumentsGateway {
  removeOwnerEstimate(procurementId: string, documentId: string, expectedRevision: number): Promise<void>;
  uploadDocument(input: UploadInput): Promise<DocumentRecord>;
  reviewDocument(id: string, values: A5Values, expectedRevision: number): Promise<DocumentRecord>;
  confirmDocument(id: string, expectedRevision: number, acknowledged?: boolean): Promise<DocumentRecord>;
}

export interface DocumentSource { id: string; name: string; path: string; kind: DocumentKind; }
export interface DocumentProcessing {
  process(file: BinarySource, kind: DocumentKind, onProgress: (label: string) => void): Promise<DocumentSource>;
  availableSources(): DocumentSource[];
}
