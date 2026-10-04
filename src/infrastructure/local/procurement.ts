import type { Procurement } from "../../modules/procurement/domain/models";
import type { LocalStore } from "./store";
import { DomainError, copy, requireText } from "./validation";
export async function createProcurement(store: LocalStore, input: {
  name: string;
  number: string;
  functionName: string;
}) {
  requireText(input.name, "Nama pengadaan");
  requireText(input.number, "Nomor pengadaan");
  requireText(input.functionName, "Fungsi");
  if (store.state.procurements.some((p) => p.number === input.number.trim()))
    throw new DomainError("DUPLICATE", "Nomor pengadaan sudah digunakan.");
  const p: Procurement = {
    ...input,
    id: store.id("proc"),
    createdAt: new Date().toISOString(),
    preferenceRevision: 0,
    preferenceConfirmed: false,
  };
  store.state.procurements.unshift(p);
  store.event({
    procurementId: p.id,
    module: "PROCUREMENT",
    type: "CREATED",
    summary: `Pengadaan ${p.name} dibuat`,
  });
  store.emit();
  return copy(p);
}
export async function addVendor(store: LocalStore, procurementId: string, name: string) {
  store.proc(procurementId);
  requireText(name, "Nama vendor");
  if (
    store.state.vendors.some(
      (v) =>
        v.procurementId === procurementId &&
        v.name.toLowerCase() === name.trim().toLowerCase(),
    )
  )
    throw new DomainError("DUPLICATE", "Vendor sudah terdaftar.");
  const v = { id: store.id("vendor"), procurementId, name: name.trim() };
  store.state.vendors.push(v);
  store.event({
    procurementId,
    module: "PROCUREMENT",
    type: "VENDOR_ADDED",
    summary: `Vendor ${name} ditambahkan`,
  });
  store.emit();
  return copy(v);
}
