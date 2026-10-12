import { toDocument, toLocalDocument } from "./document-mapping";
import { reviewedDocument, confirmedDocument } from "../../modules/documents/domain/review";
import { ensureCurrentDocument, validateOwnerEstimateReplacement } from "../../modules/documents/domain/replacement";
import registry from "./fixtures/file-registry.json";
import type { A5Values } from "../../modules/documents/domain/models";
import type { LocalDocumentRecord as DocumentRecord, LocalUploadInput as UploadInput } from "./state";
import {
  A5_FIXTURES,
  PAIR_FIXTURES
} from "./fixtures";
import type { LocalStore } from "./store";
import { DomainError, copy } from "../../shared/kernel/validation";
export function makeDocument(store: LocalStore, input: UploadInput): DocumentRecord {
  const metadata = { ...input };
  delete metadata.replacement;
  const candidate = A5_FIXTURES[input.fixtureId];
  const file = registry.find((f) => f.id === input.fixtureId);
  const id = store.id("doc");
  return {
    ...metadata,
    id,
    priceItems: ["OE", "OFFER"].includes(input.kind)
      ? file?.rows?.map((row) => ({
        id: row.id,
        description: row.description,
        category:
          row.category === "MATERIAL"
            ? ("MATERIAL" as const)
            : ("SERVICE" as const),
        unit: row.unit,
        oe: row.oe,
        offer: row.offer,
        source: row.source,
      }))
      : undefined,
    period: input.period ?? file?.period,
    historicalItems:
      input.kind === "HISTORICAL_OE"
        ? file?.rows?.map((row, index) => ({
          id: `${id}-item-${index}`,
          documentName: input.name,
          description: row.description,
          functionName: input.functionName ?? "",
          period: file.period ?? "",
          unit: row.unit,
          price: row.oe,
          source: row.source,
          comparable: false,
        }))
        : undefined,
    uploadedAt: new Date().toISOString(),
    revision: 1,
    status: "REVIEW_REQUIRED",
    candidate: candidate
      ? {
        ...copy(candidate),
        ...(input.fixtureId === "a5-borneo" ? { tkdn_jasa: "0.3" } : {}),
      }
      : undefined,
    reviewed: candidate
      ? {
        ...copy(candidate),
        ...(input.fixtureId === "a5-borneo" ? { tkdn_jasa: "0.3" } : {}),
      }
      : undefined,
    warnings: file?.warnings ?? [],
    acknowledged: false,
    sources: copy(file?.sources ?? []),
    groups: candidate
      ? []
      : ["Harga satuan material dan jasa", "Ringkasan total"],
    pairs:
      input.kind === "OFFER"
        ? copy(PAIR_FIXTURES).map((pair) => ({
          ...pair,
          source:
            file?.rows?.find((row) => row.id === pair.id)?.source ??
            pair.source,
        }))
        : [],
    published: false,
  };
}
export async function uploadRegisteredDocument(store: LocalStore, input: UploadInput) {
  store.proc(input.procurementId);
  const expected = input.fixtureId.startsWith("a5-")
    ? "FORM_A5"
    : input.fixtureId === "oe-terminal"
      ? "OE"
      : input.fixtureId.startsWith("bid-")
        ? "OFFER"
        : /^history-202[456]$/.test(input.fixtureId)
          ? "HISTORICAL_OE"
          : undefined;
  if (
    expected !== input.kind ||
    !registry.some(
      (file) => file.id === input.fixtureId && file.kind === input.kind,
    )
  )
    throw new DomainError(
      "UNSUPPORTED",
      "Format dokumen ini belum didukung.",
    );
  if (
    ["FORM_A5", "OFFER"].includes(input.kind) &&
    !store.state.vendors.some(
      (v) =>
        v.id === input.vendorId && v.procurementId === input.procurementId,
    )
  )
    throw new DomainError("VENDOR_REQUIRED", "Pilih vendor pemilik dokumen.");
  const currentOE = input.kind === "OE"
    ? store.state.documents.find(document => document.procurementId === input.procurementId && document.kind === "OE" && !document.supersededBy && !document.removedAt)
    : undefined;
  if (input.kind === "OE") validateOwnerEstimateReplacement(currentOE, input.replacement);
  else if (input.replacement) throw new DomainError("WRONG_KIND", "Penggantian ini hanya berlaku untuk OE pengadaan.");
  const d = makeDocument(store, input);
  if (currentOE) currentOE.supersededBy = d.id;
  store.state.documents.unshift(d);
  store.event({
    procurementId: input.procurementId,
    module:
      input.kind === "FORM_A5"
        ? "HEA"
        : input.kind === "HISTORICAL_OE"
          ? "BANK"
          : "PRICE_DEVIATION",
    type: "UPLOADED",
    summary: currentOE ? `${input.name} menggantikan ${currentOE.name}; menunggu pemeriksaan` : `${input.name} selesai dibaca`,
  });
  store.emit();
  return copy(d);
}
export async function reviewDocument(store: LocalStore, id: string, values: A5Values, expectedRevision: number) {
  const d = store.doc(id);
  ensureCurrentDocument(d);
  store.check(d.revision, expectedRevision);
  const reviewed = reviewedDocument(toDocument(d), values);
  if (!reviewed) return copy(d);
  Object.assign(d, toLocalDocument(reviewed));
  store.event({
    procurementId: d.procurementId,
    module: "HEA",
    type: "CORRECTED",
    summary: `Nilai ${d.name} diperbarui`,
  });
  store.emit();
  return copy(d);
}

export async function removeOwnerEstimate(store: LocalStore, procurementId: string, documentId: string, expectedRevision: number) {
  store.proc(procurementId);
  const document = store.doc(documentId);
  if (document.procurementId !== procurementId || document.kind !== "OE") {
    throw new DomainError("WRONG_SCOPE", "Pilih dokumen OE milik pengadaan ini.");
  }
  ensureCurrentDocument(document);
  store.check(document.revision, expectedRevision);
  document.removedAt = new Date().toISOString();
  store.event({ procurementId, module: "PRICE_DEVIATION", type: "REMOVED", summary: `${document.name} dihapus dari pengadaan` });
  store.emit();
}
export async function confirmDocument(store: LocalStore, id: string, expectedRevision: number, acknowledged = false) {
  const d = store.doc(id);
  ensureCurrentDocument(d);
  store.check(d.revision, expectedRevision);
  const confirmed = confirmedDocument(toDocument(d), acknowledged);
  if (!confirmed) return copy(d);
  Object.assign(d, toLocalDocument(confirmed));
  store.event({
    procurementId: d.procurementId,
    module:
      d.kind === "FORM_A5"
        ? "HEA"
        : d.kind === "HISTORICAL_OE"
          ? "BANK"
          : "PRICE_DEVIATION",
    type: "CONFIRMED",
    summary: `${d.name} dikonfirmasi`,
  });
  store.emit();
  return copy(d);
}
