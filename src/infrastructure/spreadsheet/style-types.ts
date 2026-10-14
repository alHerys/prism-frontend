import type { SpreadsheetAmount, SpreadsheetRow } from "../../modules/documents/domain/spreadsheet";

export interface CellStyle {
  appearance: NonNullable<SpreadsheetRow["appearance"]>;
  numberFormat: NonNullable<SpreadsheetAmount["format"]>;
}
