import type { ReadStore } from "../../../shared/kernel/read-store";
import type { Snapshot } from "../domain/models";
import type { Activity } from "../domain/models";
import type { Procurement } from "../../procurement/domain/models";

export interface EvaluationsData {
  snapshots: Snapshot[];
  events: Activity[];
  procurements: Procurement[];
}
export type EvaluationsQueries = ReadStore<EvaluationsData>;
