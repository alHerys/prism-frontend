import type { Vendor } from "../../procurement/domain/models";
import type { ReadStore } from "../../../shared/kernel/read-store";
import type { DocumentRecord } from "../../documents/domain/models";
import type { Snapshot } from "../../evaluations/domain/models";

export interface PriceDeviationData {
  documents: DocumentRecord[];
  vendors: Vendor[];
  snapshots: Snapshot[];
}
export type PriceDeviationQueries = ReadStore<PriceDeviationData>;

export { resolvePriceSnapshotScope, requirePriceSnapshot, currentPriceSources } from "../domain/snapshot-scope";
