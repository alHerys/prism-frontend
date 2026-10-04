import type { ReadStore } from "../../../shared/kernel/read-store";
import type { Procurement } from "../domain/models";
import type { Vendor } from "../domain/models";

export interface ProcurementData { procurements: Procurement[]; vendors: Vendor[]; }
export type ProcurementQueries = ReadStore<ProcurementData>;
