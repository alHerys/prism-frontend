import type { Procurement } from "../../modules/procurement/domain/models";
import type { LocalStore } from "./store";
import { copy } from "../../shared/kernel/validation";
import { validateProcurement, validateVendor } from "../../modules/procurement/domain/validation";
export async function createProcurement(store: LocalStore, input: {
  name: string;
  number: string;
  functionName: string;
}) {
  validateProcurement(input, store.state.procurements.map((p) => p.number));
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
  validateVendor(name, store.state.vendors.filter((v) => v.procurementId === procurementId).map((v) => v.name));
  const v = { id: store.id("vendor"), procurementId, name: name.trim(), createdAt: new Date().toISOString() };
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
