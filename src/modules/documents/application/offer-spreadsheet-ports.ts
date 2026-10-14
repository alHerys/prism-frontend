import type { BinarySource } from "../../../shared/kernel/binary-source";
import type { DocumentRecord } from "../domain/models";
import type { SpreadsheetEdit } from "../domain/spreadsheet";
import type { PreparedSpreadsheet } from "./spreadsheet-ports";

export interface OfferSpreadsheetPort {
  prepare(file: BinarySource, progress: (label: string) => void): Promise<PreparedSpreadsheet>;
  publish(input: { pendingId: string; sheetId: string; procurementId: string; vendorId: string }): Promise<DocumentRecord>;
  release(id: string): void;
  saveAndConfirm(input: { documentId: string; expectedRevision: number; edits: SpreadsheetEdit[]; acknowledged: boolean }): Promise<DocumentRecord>;
}
