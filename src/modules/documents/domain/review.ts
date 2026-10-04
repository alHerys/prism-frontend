import type { A5Values, DocumentRecord } from "./models";
import { copy, decimal, DomainError, equalValues } from "../../../shared/kernel/validation";
export function reviewedDocument(current: DocumentRecord, values: A5Values): DocumentRecord | undefined {
  if (!current.candidate) throw new DomainError("WRONG_KIND", "Dokumen ini bukan Form A5.");
  Object.entries(values).forEach(([key, value]) => decimal(value, key.startsWith("tkdn")));
  if (current.reviewed && equalValues(values, current.reviewed)) return undefined;
  return { ...copy(current), reviewed: copy(values), revision: current.revision + 1, status: "REVIEW_REQUIRED", acknowledged: false };
}
export function confirmedDocument(current: DocumentRecord, acknowledged: boolean): DocumentRecord | undefined {
  if (current.status === "CONFIRMED") return undefined;
  if (current.warnings.length && !acknowledged) throw new DomainError("WARNING_REQUIRED", "Verifikasi seluruh peringatan sebelum konfirmasi.");
  return { ...copy(current), status: "CONFIRMED", acknowledged };
}
