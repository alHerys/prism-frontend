import type { Procurement, Vendor } from "../domain/models";

export interface ProcurementGateway {
  createProcurement(input: {
    name: string;
    number: string;
    functionName: string;
  }): Promise<Procurement>;
  addVendor(procurementId: string, name: string): Promise<Vendor>;
}
