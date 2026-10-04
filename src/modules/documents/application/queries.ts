import type { ReadStore } from "../../../shared/kernel/read-store";
import type { DocumentRecord } from "../domain/models";

export interface DocumentsData { documents: DocumentRecord[]; }
export type DocumentsQueries = ReadStore<DocumentsData>;
