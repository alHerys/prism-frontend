import { DomainError, requireText } from "../../../shared/kernel/validation";

interface HistoricalDocumentState {
  kind: string;
  status: string;
  revision: number;
  published: boolean;
  functionName?: string;
  period?: string;
}
export function reviewedMetadata(document: HistoricalDocumentState, input: { functionName: string; period: string }) {
  requireText(input.functionName, "Fungsi");
  if (!/^\d{4}$/.test(input.period))
    throw new DomainError("INVALID_PERIOD", "Periode harus berupa tahun empat digit.");
  if (document.kind !== "HISTORICAL_OE")
    throw new DomainError("WRONG_KIND", "Pilih dokumen historis.");
  if (document.functionName === input.functionName && document.period === input.period) return undefined;
  return { ...input, revision: document.revision + 1, status: "REVIEW_REQUIRED" as const, published: false };
}
export function assertPublishable(document: HistoricalDocumentState): asserts document is HistoricalDocumentState & { functionName: string; period: string } {
  if (document.kind !== "HISTORICAL_OE" || document.status !== "CONFIRMED" || !document.functionName || !document.period)
    throw new DomainError("CONFIRMATION_REQUIRED", "Lengkapi fungsi/periode dan konfirmasi dokumen.");
  if (document.published) throw new DomainError("DUPLICATE", "Dokumen sudah dipublikasikan.");
}
