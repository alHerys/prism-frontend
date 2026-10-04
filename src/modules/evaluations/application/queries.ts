import type { ReadStore } from "../../../shared/kernel/read-store";
import type { Snapshot } from "../domain/models";
import type { Activity } from "../domain/models";

export interface EvaluationsData { snapshots: Snapshot[]; events: Activity[]; }
export type EvaluationsQueries = ReadStore<EvaluationsData>;
