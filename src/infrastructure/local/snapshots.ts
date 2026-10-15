import { resolvePriceSnapshotScope } from "../../modules/price-deviation/application/queries";
import type { Snapshot } from "../../modules/evaluations/domain/models";
import type { LocalStore } from "./store";
import { DomainError, copy } from "../../shared/kernel/validation";
export function snapshot(store: LocalStore, input: Omit<Snapshot, "id" | "createdAt">) {
  if (input.module === "PRICE_DEVIATION" && (!input.vendorId || !input.vendorName || !resolvePriceSnapshotScope(input, store.state.vendors)))
    throw new DomainError("WRONG_SCOPE", "Hasil Harga Timpang memerlukan vendor dan sumber yang sesuai.");
  const s: Snapshot = {
    ...copy(input),
    id: store.id("result"),
    createdAt: new Date().toISOString(),
  };
  store.state.snapshots.unshift(s);
  store.event({
    procurementId: s.procurementId,
    module: s.module,
    type: "EVALUATED",
    summary: `Evaluasi ${s.module === "HEA" ? "HEA" : s.module === "BANK" ? "historis" : "Harga Timpang"} selesai`,
    snapshotId: s.id,
  });
  store.emit();
  return copy(s);
}
export async function recordExport(store: LocalStore, snapshotId: string) {
  const s = store.state.snapshots.find((s) => s.id === snapshotId);
  if (!s) throw new DomainError("NOT_FOUND", "Hasil tidak ditemukan.");
  store.event({
    procurementId: s.procurementId,
    module: s.module,
    type: "EXPORTED",
    summary: "Laporan Excel dibuat",
    snapshotId,
  });
  store.emit();
}
