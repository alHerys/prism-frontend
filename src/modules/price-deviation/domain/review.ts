import type { DocumentRecord } from "../../documents/domain/models";
import type { PricePair } from "./models";
import { copy, decimal, DomainError, equalValues, normalize } from "../../../shared/kernel/validation";
export function selectedGroup(current: DocumentRecord, group: string): DocumentRecord | undefined {
  const d = copy(current);
  if (!d.groups.includes(group))
    throw new DomainError(
      "INVALID_GROUP",
      "Pilih kelompok harga yang tersedia.",
    );
  if (d.selectedGroup === group) return undefined;
  d.selectedGroup = group;
  d.revision++;
  d.status = "REVIEW_REQUIRED";
  d.pairs.forEach((p) => (p.confirmed = false));
  return d;
}
export function reviewedPairs(current: DocumentRecord, pairs: PricePair[], allowedPairIds: readonly string[]): DocumentRecord | undefined {
  const d = copy(current);
  if (d.kind !== "OFFER")
    throw new DomainError("WRONG_KIND", "Pilih dokumen penawaran.");
  if (
    pairs.length !== allowedPairIds.length ||
    new Set(pairs.map((p) => p.id)).size !== pairs.length ||
    pairs.some((p) => !allowedPairIds.includes(p.id))
  )
    throw new DomainError(
      "INVALID_PAIRS",
      "Daftar pasangan tidak sesuai dokumen.",
    );
  pairs.forEach((p) => {
    decimal(p.oe);
    decimal(p.offer);
  });
  if (
    pairs.every((p) => {
      const old = d.pairs.find((o) => o.id === p.id);
      return (
        old &&
        equalValues(
          { oe: p.oe, offer: p.offer },
          { oe: old.oe, offer: old.offer },
        ) &&
        old.description === p.description &&
        old.category === p.category &&
        old.unit === p.unit &&
        old.matched === p.matched &&
        old.source === p.source
      );
    })
  )
    return undefined;
  d.pairs = pairs.map((p) => ({
    ...copy(p),
    confirmed: false,
    revision: p.revision + 1,
  }));
  d.revision++;
  d.status = "REVIEW_REQUIRED";
  return d;
}
export function confirmedPairs(current: DocumentRecord, acknowledged: boolean, requiredGroup: string): DocumentRecord | undefined {
  const d = copy(current);
  if (d.selectedGroup !== requiredGroup)
    throw new DomainError(
      "GROUP_REQUIRED",
      "Pilih kelompok harga satuan material dan jasa.",
    );
  if (d.warnings.length && !acknowledged)
    throw new DomainError(
      "WARNING_REQUIRED",
      "Verifikasi seluruh peringatan sebelum konfirmasi pasangan.",
    );
  if (d.pairs.some((p) => p.matched && normalize(p.oe) === "0"))
    throw new DomainError(
      "INVALID_VALUE",
      "Harga OE harus lebih besar dari nol.",
    );
  if (!d.pairs.some((p) => p.matched))
    throw new DomainError("PAIR_REQUIRED", "Pilih setidaknya satu pasangan.");
  if (d.status === "CONFIRMED") return undefined;
  d.acknowledged = acknowledged;
  d.pairs.forEach((p) => (p.confirmed = p.matched));
  d.status = "CONFIRMED";
  return d;
}
