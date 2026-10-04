import type { Snapshot } from "../domain/models";

export interface EvaluationsGateway {
  recordExport(snapshotId: string): Promise<void>;
}

export interface SnapshotExporter {
  download(snapshot: Snapshot, procurement: { name: string; number: string }): Promise<void>;
}
