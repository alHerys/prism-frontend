
export interface EvaluationsGateway {
  recordExport(snapshotId: string): Promise<void>;
}
