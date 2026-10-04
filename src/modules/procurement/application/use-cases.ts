import type { ProcurementGateway } from "./ports";

export function createProcurementUseCases(gateway: ProcurementGateway) {
  return {
    createProcurement: (...args: Parameters<ProcurementGateway["createProcurement"]>) => gateway.createProcurement(...args),
    addVendor: (...args: Parameters<ProcurementGateway["addVendor"]>) => gateway.addVendor(...args),
  };
}
export type ProcurementUseCases = ReturnType<typeof createProcurementUseCases>;
