import type {
  Preferences
} from "../../shared/model/session";
import {
  A5_FIXTURES,
  DEMO_PREFERENCES,
  HEA_RESULTS
} from "./fixtures";
import { snapshot } from "./snapshots";
import type { DemoStore } from "./store";
import { DomainError, copy, decimal, equalValues } from "./validation";
export async function setPreferences(store: DemoStore, procurementId: string, values: Preferences, expectedRevision: number) {
  const p = store.proc(procurementId);
  store.check(p.preferenceRevision, expectedRevision);
  Object.values(values).forEach((v) => decimal(v, true));
  if (p.preferences && equalValues(values, p.preferences)) return copy(p);
  p.preferences = copy(values);
  p.preferenceRevision++;
  p.preferenceConfirmed = false;
  store.event({
    procurementId,
    module: "HEA",
    type: "CORRECTED",
    summary: "Preferensi pengadaan diperbarui",
  });
  store.emit();
  return copy(p);
}
export async function confirmPreferences(store: DemoStore, procurementId: string, expectedRevision: number) {
  const p = store.proc(procurementId);
  store.check(p.preferenceRevision, expectedRevision);
  if (!p.preferences)
    throw new DomainError(
      "PREFERENCES_REQUIRED",
      "Isi preferensi barang dan jasa.",
    );
  if (p.preferenceConfirmed) return copy(p);
  p.preferenceConfirmed = true;
  store.event({
    procurementId,
    module: "HEA",
    type: "CONFIRMED",
    summary: "Preferensi pengadaan dikonfirmasi",
  });
  store.emit();
  return copy(p);
}
export async function evaluateHEA(store: DemoStore, procurementId: string, documentIds: string[]) {
  return buildHEA(store, procurementId, documentIds);
}
export function buildHEA(store: DemoStore, procurementId: string, documentIds: string[]) {
  const p = store.proc(procurementId);
  if (!p.preferenceConfirmed || !p.preferences)
    throw new DomainError(
      "PREFERENCES_REQUIRED",
      "Konfirmasi preferensi sebelum evaluasi.",
    );
  if (!equalValues(p.preferences, DEMO_PREFERENCES))
    throw new DomainError(
      "UNAVAILABLE",
      "Evaluasi belum tersedia untuk nilai preferensi ini. Periksa kembali data.",
    );
  if (!documentIds.length)
    throw new DomainError("REQUIRED", "Pilih dokumen yang akan dievaluasi.");
  const docs = [...new Set(documentIds)].map((id) => store.doc(id));
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
        !d.reviewed || !equalValues(d.reviewed, A5_FIXTURES[d.fixtureId]),
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
