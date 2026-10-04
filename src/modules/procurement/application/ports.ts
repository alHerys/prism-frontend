import type { Procurement } from "../domain/models";

export interface ProcurementGateway {
  createProcurement(input: {
    name: string;
    number: string;
    functionName: string;
  }): Promise<Procurement>;
  addVendor(procurementId: string, name: string): Promise<{
    id: string;
    procurementId: string;
    name: string;
  }>;
}
