import type { ReadStore } from "../../../shared/kernel/read-store";
import type { Snapshot } from "../../evaluations/domain/models";
import type { Activity } from "../../evaluations/domain/models";

export interface EvaluationsData { snapshots: Snapshot[]; events: Activity[]; }
export type EvaluationsQueries = ReadStore<EvaluationsData>;
