import { reviewedPreferences, confirmedPreferences } from "../../modules/hea/domain/preferences";
import type { Preferences } from "../../modules/hea/domain/models";
import {
  A5_FIXTURES,
  FIXTURE_PREFERENCES,
  HEA_RESULTS,
  HEA_CALCULATIONS
} from "./fixtures";
import { snapshot } from "./snapshots";
import type { LocalStore } from "./store";
import { ensureCurrentDocument } from "../../modules/documents/domain/replacement";
import { DomainError, copy, equalValues } from "../../shared/kernel/validation";
export async function setPreferences(store: LocalStore, procurementId: string, values: Preferences, expectedRevision: number) {
  const p = store.proc(procurementId);
  store.check(p.preferenceRevision, expectedRevision);
  const reviewed = reviewedPreferences(p, values);
  if (!reviewed) return copy(p);
  Object.assign(p, reviewed);
  store.event({
    procurementId,
    module: "HEA",
    type: "CORRECTED",
    summary: "Preferensi pengadaan diperbarui",
  });
  store.emit();
  return copy(p);
}
export async function confirmPreferences(store: LocalStore, procurementId: string, expectedRevision: number) {
  const p = store.proc(procurementId);
  store.check(p.preferenceRevision, expectedRevision);
  const confirmed = confirmedPreferences(p);
  if (!confirmed) return copy(p);
  Object.assign(p, confirmed);
  store.event({
    procurementId,
    module: "HEA",
    type: "CONFIRMED",
    summary: "Preferensi pengadaan dikonfirmasi",
  });
  store.emit();
  return copy(p);
}
export async function evaluateHEA(store: LocalStore, procurementId: string, documentIds: string[]) {
  return buildHEA(store, procurementId, documentIds);
}
export function buildHEA(store: LocalStore, procurementId: string, documentIds: string[]) {
  const p = store.proc(procurementId);
  if (!p.preferenceConfirmed || !p.preferences)
    throw new DomainError(
      "PREFERENCES_REQUIRED",
      "Konfirmasi preferensi sebelum evaluasi.",
    );
  if (!equalValues(p.preferences, FIXTURE_PREFERENCES))
    throw new DomainError(
      "UNAVAILABLE",
      "Evaluasi belum tersedia untuk nilai preferensi ini. Periksa kembali data.",
    );
  if (!documentIds.length)
    throw new DomainError("REQUIRED", "Pilih dokumen yang akan dievaluasi.");
  const docs = [...new Set(documentIds)].map((id) => store.doc(id));
  docs.forEach(ensureCurrentDocument);
  if (
    docs.some(
      (d) => d.procurementId !== procurementId || d.kind !== "FORM_A5",
    )
  )
    throw new DomainError(
      "WRONG_SCOPE",
      "Pilihan dokumen tidak sesuai pengadaan.",
    );
  if (new Set(docs.map((d) => d.vendorId)).size !== docs.length)
    throw new DomainError(
      "DUPLICATE",
      "Pilih satu Form A5 untuk setiap vendor.",
    );
  if (docs.some((d) => d.status !== "CONFIRMED"))
    throw new DomainError(
      "CONFIRMATION_REQUIRED",
      "Konfirmasi seluruh dokumen terpilih.",
    );
  if (
    docs.some(
      (d) =>
        !d.reviewed || !A5_FIXTURES[d.fixtureId] || !equalValues(d.reviewed, A5_FIXTURES[d.fixtureId]),
    )
  )
    throw new DomainError(
      "UNAVAILABLE",
      "Evaluasi belum tersedia untuk nilai ini. Periksa kembali data.",
    );
  const rows = docs
    .sort(
      (a, b) =>
        Object.keys(HEA_RESULTS).indexOf(a.fixtureId) -
        Object.keys(HEA_RESULTS).indexOf(b.fixtureId),
    )
    .map((d, index) => ({
      vendorId: d.vendorId,
      vendorName: store.state.vendors.find((v) => v.id === d.vendorId)?.name,
      rank: index + 1,
      hea: HEA_RESULTS[d.fixtureId],
      calculation: copy(HEA_CALCULATIONS[d.fixtureId]),
      source: d.name,
    }));
  const excluded = store.state.vendors
    .filter(
      (v) =>
        v.procurementId === procurementId &&
        !docs.some((d) => d.vendorId === v.id),
    )
    .map((v) => v.name);
  return snapshot(store, {
    procurementId,
    module: "HEA",
    rows,
    excluded,
    status: excluded.length ? "PARTIAL" : "COMPLETE",
    inputs: { procurement: copy(p), documents: copy(docs) },
    policy:
      "Kebijakan evaluasi provisional; TKDN barang ≥ 25%, jasa ≥ 30%; preferensi dikonfirmasi evaluator.",
  });
}
