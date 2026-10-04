import type { DocumentRecord } from "../../modules/documents/domain/models";
import type { LocalDocumentRecord } from "./state";
// Preserve field order for legacy snapshot serialization while isolating adapter metadata.
export function toDocument(record: LocalDocumentRecord): DocumentRecord {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key === "fixtureId" ? "sourceId" : key, value])) as unknown as DocumentRecord;
}
export function toLocalDocument(record: DocumentRecord): LocalDocumentRecord {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key === "sourceId" ? "fixtureId" : key, value])) as unknown as LocalDocumentRecord;
}
