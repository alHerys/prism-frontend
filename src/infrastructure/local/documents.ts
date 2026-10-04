import { reviewedDocument, confirmedDocument } from "../../modules/documents/domain/review";
import registry from "./fixtures/file-registry.json";
import type { A5Values, DocumentRecord, UploadInput } from "../../modules/documents/domain/models";
import {
  A5_FIXTURES,
  PAIR_FIXTURES
} from "./fixtures";
import type { LocalStore } from "./store";
import { DomainError, copy } from "./validation";
export function makeDocument(store: LocalStore, input: UploadInput): DocumentRecord {
  const candidate = A5_FIXTURES[input.fixtureId];
  const file = registry.find((f) => f.id === input.fixtureId);
  const id = store.id("doc");
  return {
    ...input,
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
  const d = makeDocument(store, input);
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
    summary: `${input.name} selesai dibaca`,
  });
  store.emit();
  return copy(d);
}
export async function reviewDocument(store: LocalStore, id: string, values: A5Values, expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  const reviewed = reviewedDocument(d, values);
  if (!reviewed) return copy(d);
  Object.assign(d, reviewed);
  store.event({
    procurementId: d.procurementId,
    module: "HEA",
    type: "CORRECTED",
    summary: `Nilai ${d.name} diperbarui`,
  });
  store.emit();
  return copy(d);
}
export async function confirmDocument(store: LocalStore, id: string, expectedRevision: number, acknowledged = false) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  const confirmed = confirmedDocument(d, acknowledged);
  if (!confirmed) return copy(d);
  Object.assign(d, confirmed);
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
