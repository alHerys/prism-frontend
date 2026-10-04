import type { ReadStore } from "../../../shared/kernel/read-store";
import type { Procurement } from "../../procurement/domain/models";

export interface HEAData { procurements: Procurement[]; }
export type HEAQueries = ReadStore<HEAData>;
