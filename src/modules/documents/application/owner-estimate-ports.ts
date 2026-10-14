import type { BinarySource } from "../../../shared/kernel/binary-source";
import type { DocumentRecord, UploadInput } from "../domain/models";
import type { OEEdit } from "../domain/owner-estimate";

export type { PreparedSpreadsheet as PreparedOE } from "./spreadsheet-ports";
import type { PreparedSpreadsheet as PreparedOE } from "./spreadsheet-ports";
export interface OwnerEstimatePort {
  prepare(file: BinarySource, progress: (label: string) => void): Promise<PreparedOE>;
  publish(input: { pendingId: string; sheetId: string; procurementId: string; replacement?: UploadInput["replacement"] }): Promise<DocumentRecord>;
  release(pendingId: string): void;
  saveAndConfirm(input: { documentId: string; expectedRevision: number; edits: OEEdit[]; acknowledged: boolean }): Promise<DocumentRecord>;
}
