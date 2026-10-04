import registry from "../../fixtures/file-registry.json";
import type {
  A5Values,
  DocumentRecord,
  UploadInput
} from "../../shared/model/session";
import {
  A5_FIXTURES,
  PAIR_FIXTURES
} from "./fixtures";
import type { DemoStore } from "./store";
import { DomainError, copy, decimal, equalValues } from "./validation";
export function makeDocument(store: DemoStore, input: UploadInput): DocumentRecord {
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
export async function uploadRegisteredDocument(store: DemoStore, input: UploadInput) {
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
export async function reviewDocument(store: DemoStore, id: string, values: A5Values, expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  if (!d.candidate)
    throw new DomainError("WRONG_KIND", "Dokumen ini bukan Form A5.");
  Object.entries(values).forEach(([key, value]) =>
    decimal(value, key.startsWith("tkdn")),
  );
  if (d.reviewed && equalValues(values, d.reviewed)) return copy(d);
  d.reviewed = copy(values);
  d.revision++;
  d.status = "REVIEW_REQUIRED";
  d.acknowledged = false;
  store.event({
    procurementId: d.procurementId,
    module: "HEA",
    type: "CORRECTED",
    summary: `Nilai ${d.name} diperbarui`,
  });
  store.emit();
  return copy(d);
}
export async function confirmDocument(store: DemoStore, id: string, expectedRevision: number, acknowledged = false) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  if (d.status === "CONFIRMED") return copy(d);
  if (d.warnings.length && !acknowledged)
    throw new DomainError(
      "WARNING_REQUIRED",
      "Verifikasi seluruh peringatan sebelum konfirmasi.",
    );
  d.status = "CONFIRMED";
  d.acknowledged = acknowledged;
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
