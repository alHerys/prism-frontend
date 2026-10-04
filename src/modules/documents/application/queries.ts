import type { ReadStore } from "../../../shared/kernel/read-store";
import type { DocumentRecord } from "../../documents/domain/models";

export interface DocumentsData { documents: DocumentRecord[]; }
export type DocumentsQueries = ReadStore<DocumentsData>;
