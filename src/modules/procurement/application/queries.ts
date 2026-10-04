import type { ReadStore } from "../../../shared/kernel/read-store";
import type { Procurement } from "../../procurement/domain/models";
import type { Vendor } from "../../procurement/domain/models";

export interface ProcurementData { procurements: Procurement[]; vendors: Vendor[]; }
export type ProcurementQueries = ReadStore<ProcurementData>;
