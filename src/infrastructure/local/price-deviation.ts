import registry from "./fixtures/file-registry.json";
import type {
  PricePair
} from "../../shared/model/session";
import {
  PAIR_FIXTURES
} from "./fixtures";
import { snapshot } from "./snapshots";
import type { LocalStore } from "./store";
import { DomainError, copy, decimal, equalValues, normalize } from "./validation";
export async function selectGroup(store: LocalStore, id: string, group: string, expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  if (!d.groups.includes(group))
    throw new DomainError(
      "INVALID_GROUP",
      "Pilih kelompok harga yang tersedia.",
    );
  if (d.selectedGroup === group) return copy(d);
  d.selectedGroup = group;
  d.revision++;
  d.status = "REVIEW_REQUIRED";
  d.pairs.forEach((p) => (p.confirmed = false));
  store.emit();
  return copy(d);
}
export async function reviewPairs(store: LocalStore, id: string, pairs: PricePair[], expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  if (d.kind !== "OFFER")
    throw new DomainError("WRONG_KIND", "Pilih dokumen penawaran.");
  if (
    pairs.length !== PAIR_FIXTURES.length ||
    new Set(pairs.map((p) => p.id)).size !== pairs.length ||
    pairs.some((p) => !PAIR_FIXTURES.some((f) => f.id === p.id))
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
    return copy(d);
  d.pairs = pairs.map((p) => ({
    ...copy(p),
    confirmed: false,
    revision: p.revision + 1,
  }));
  d.revision++;
  d.status = "REVIEW_REQUIRED";
  store.event({
    procurementId: d.procurementId,
    module: "PRICE_DEVIATION",
    type: "CORRECTED",
    summary: `Pasangan ${d.name} diperbarui`,
  });
  store.emit();
  return copy(d);
}
export async function confirmPairs(store: LocalStore, id: string, expectedRevision: number, acknowledged = false) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  if (d.selectedGroup !== "Harga satuan material dan jasa")
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
  if (d.status === "CONFIRMED") return copy(d);
  d.acknowledged = acknowledged;
  d.pairs.forEach((p) => (p.confirmed = p.matched));
  d.status = "CONFIRMED";
  store.event({
    procurementId: d.procurementId,
    module: "PRICE_DEVIATION",
    type: "CONFIRMED",
    summary: `Pasangan ${d.name} dikonfirmasi`,
  });
  store.emit();
  return copy(d);
}
export async function evaluateDeviation(store: LocalStore, procurementId: string, oeId: string, offerId: string) {
  return buildDeviation(store, procurementId, oeId, offerId);
}
export function buildDeviation(store: LocalStore, procurementId: string, oeId: string, offerId: string) {
  store.proc(procurementId);
  const oe = store.doc(oeId),
    offer = store.doc(offerId);
  if (
    oe.procurementId !== procurementId ||
    offer.procurementId !== procurementId ||
    oe.kind !== "OE" ||
    offer.kind !== "OFFER"
  )
    throw new DomainError(
      "WRONG_SCOPE",
      "Pilih OE dan penawaran dalam pengadaan ini.",
    );
  if (
    oe.status !== "CONFIRMED" ||
    offer.status !== "CONFIRMED" ||
    oe.selectedGroup !== "Harga satuan material dan jasa" ||
    offer.selectedGroup !== "Harga satuan material dan jasa"
  )
    throw new DomainError(
      "CONFIRMATION_REQUIRED",
      "Pilih kelompok dan konfirmasi kedua sumber.",
    );
  const oeSource = registry.find(
    (file) => file.id === oe.fixtureId && file.kind === "OE",
  );
  const offerSource = registry.find(
    (file) => file.id === offer.fixtureId && file.kind === "OFFER",
  );
  if (!oeSource || !offerSource)
    throw new DomainError("UNAVAILABLE", "Sumber evaluasi belum tersedia.");
  const selected = offer.pairs.filter((p) => p.confirmed && p.matched);
  if (!selected.length)
    throw new DomainError(
      "PAIR_REQUIRED",
      "Tidak ada pasangan terkonfirmasi.",
    );
  if (
    selected.some((p) => {
      const oeRow = oeSource.rows?.find((row) => row.id === p.id),
        offerRow = offerSource.rows?.find((row) => row.id === p.id);
      return (
        !oeRow ||
        !offerRow ||
        p.description !== oeRow.description ||
        p.description !== offerRow.description ||
        p.category !== oeRow.category ||
        p.category !== offerRow.category ||
        p.unit !== oeRow.unit ||
        p.unit !== offerRow.unit ||
        !equalValues(
          { oe: p.oe, offer: p.offer },
          { oe: oeRow.oe, offer: offerRow.offer },
        )
      );
    })
  )
    throw new DomainError(
      "UNAVAILABLE",
      "Evaluasi belum tersedia untuk koreksi ini. Periksa kembali data.",
    );
  const rows = selected.map((p) => ({
    description: p.description,
    category: p.category,
    unit: p.unit,
    oe: p.oe,
    offer: p.offer,
    source: `${oe.name} · ${oeSource.rows?.find((row) => row.id === p.id)?.source} / ${offer.name} · ${offerSource.rows?.find((row) => row.id === p.id)?.source}`,
    percentageAgainstOE:
      p.id === "pipe" ? "1.25" : p.id === "install" ? "1.10" : "0.80",
    deviation:
      p.id === "pipe" ? "0.25" : p.id === "install" ? "0.10" : "-0.20",
    classification: p.id === "pipe" ? "TIMPANG" : "TIDAK_TIMPANG",
  }));
  const excluded = offer.pairs
    .filter((p) => !p.confirmed)
    .map((p) => p.description);
  return snapshot(store, {
    procurementId,
    module: "PRICE_DEVIATION",
    rows,
    excluded,
    status: excluded.length ? "PARTIAL" : "COMPLETE",
    inputs: { oe: copy(oe), offer: copy(offer) },
    policy:
      "Harga penawaran > 110% OE diklasifikasikan timpang. Material dan jasa ditinjau terpisah.",
  });
}
