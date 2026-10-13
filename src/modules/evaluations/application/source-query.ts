import type { Snapshot, ResultRow } from "../domain/models";

export function heaSourceDocument(snapshot: Snapshot, row: ResultRow) {
  if (!row.vendorId) return undefined;
  if (!snapshot.inputs || typeof snapshot.inputs !== "object" || !("documents" in snapshot.inputs) || !Array.isArray(snapshot.inputs.documents)) return undefined;
  const document: unknown = snapshot.inputs.documents.find((value: unknown) =>
    !!value && typeof value === "object" && "vendorId" in value && value.vendorId === row.vendorId && "kind" in value && value.kind === "FORM_A5");
  if (!document || typeof document !== "object" || !("id" in document) || typeof document.id !== "string" || !("name" in document) || typeof document.name !== "string" || !("procurementId" in document) || document.procurementId !== snapshot.procurementId) return undefined;
  return { id: document.id, name: document.name, procurementId: snapshot.procurementId };
}
