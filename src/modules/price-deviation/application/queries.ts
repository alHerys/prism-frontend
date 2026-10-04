import type { ReadStore } from "../../../shared/kernel/read-store";
import type { DocumentRecord } from "../../documents/domain/models";

export interface PriceDeviationData { documents: DocumentRecord[]; }
export type PriceDeviationQueries = ReadStore<PriceDeviationData>;
