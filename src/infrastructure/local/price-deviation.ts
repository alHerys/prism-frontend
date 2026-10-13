import { toDocument, toLocalDocument } from "./document-mapping";
import { ensureCurrentDocument } from "../../modules/documents/domain/replacement";
import { selectedGroup, reviewedPairs, confirmedPairs } from "../../modules/price-deviation/domain/review";
import registry from "./fixtures/file-registry.json";
import type { PricePair } from "../../modules/price-deviation/domain/models";
import {
  PAIR_FIXTURES
} from "./fixtures";
import { snapshot } from "./snapshots";
import type { LocalStore } from "./store";
import { DomainError, copy, equalValues } from "../../shared/kernel/validation";
export async function selectGroup(store: LocalStore, id: string, group: string, expectedRevision: number) {
  const d = store.doc(id);
  ensureCurrentDocument(d);
  store.check(d.revision, expectedRevision);
  const selected = selectedGroup(toDocument(d), group);
  if (!selected) return copy(d);
  Object.assign(d, toLocalDocument(selected));
  store.emit();
  return copy(d);
}
export async function reviewPairs(store: LocalStore, id: string, pairs: PricePair[], expectedRevision: number) {
  const d = store.doc(id);
  ensureCurrentDocument(d);
  store.check(d.revision, expectedRevision);
  const reviewed = reviewedPairs(toDocument(d), pairs, PAIR_FIXTURES.map((pair) => pair.id));
  if (!reviewed) return copy(d);
  Object.assign(d, toLocalDocument(reviewed));
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
  ensureCurrentDocument(d);
  store.check(d.revision, expectedRevision);
  const confirmed = confirmedPairs(toDocument(d), acknowledged, "Harga satuan material dan jasa");
  if (!confirmed) return copy(d);
  Object.assign(d, toLocalDocument(confirmed));
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
  ensureCurrentDocument(oe);
  ensureCurrentDocument(offer);
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
