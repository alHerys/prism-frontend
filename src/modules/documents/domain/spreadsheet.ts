import { copy, decimal, DomainError, normalize } from "../../../shared/kernel/validation";

export type SpreadsheetField = "description" | "material" | "services" | "combined";
export interface SpreadsheetAppearance { background?: string; bold?: boolean; underline?: boolean; borderBottom?: "solid" | "dotted"; }
export interface SpreadsheetNumberFormat { decimalPlaces: number; zeroAsDash: boolean; }
export interface SpreadsheetAmount {
  state: "VALUE" | "BLANK" | "UNAVAILABLE";
  value: string | null;
  cell: string;
  formula?: string;
  format?: SpreadsheetNumberFormat;
  appearance?: SpreadsheetAppearance;
}
export interface SpreadsheetRow {
  id: string;
  sourceRow: number;
  parentId?: string;
  level: number;
  number: string;
  numberSource?: { cell: string; position: "NO" | "CHILD" };
  bullet?: { value: "-"; cell: string };
  numberAppearance?: SpreadsheetAppearance;
  description: string;
  descriptionCells: string[];
  descriptionUnavailable?: boolean;
  kind: "CATEGORY" | "ITEM" | "NOTE" | "SUBTOTAL" | "TOTAL" | "EMPTY";
  appearance?: SpreadsheetAppearance;
  scope: "SPLIT" | "COMBINED" | "NONE";
  material: SpreadsheetAmount;
  services: SpreadsheetAmount;
  combined?: SpreadsheetAmount;
}
export interface SpreadsheetSheet { id: string; name: string; sourceSheet?: string; rows: SpreadsheetRow[]; warnings: string[]; headerBackground?: string; }
export interface SpreadsheetReview { candidate: SpreadsheetSheet; reviewed?: SpreadsheetSheet; }
export interface SpreadsheetEdit { rowId: string; field: SpreadsheetField; value: string | null; }

/** A source row belongs to one document, even when another upload repeats it. */
export function identifySpreadsheet(sheet: SpreadsheetSheet, documentId: string): SpreadsheetSheet {
  const owned = copy(sheet);
  const ids = new Map(owned.rows.map(row => [row.id, `${documentId}/${sheet.sourceSheet ?? sheet.name}:r${row.sourceRow}`]));
  for (const row of owned.rows) {
    if (row.parentId) row.parentId = ids.get(row.parentId);
    row.id = ids.get(row.id)!;
  }
  return owned;
}

export function editableSpreadsheetFields(row: SpreadsheetRow): SpreadsheetField[] {
  if (row.kind === "EMPTY") return [];
  return row.scope === "NONE" ? ["description"] : row.scope === "COMBINED"
    ? ["description", "combined"] : ["description", "material", "services"];
}

/** Representation parsing only. Prices are never calculated in the browser. */
export function parseSpreadsheetMoney(input: string): string | null {
  const value = input.trim().replace(/^Rp\s*/i, "");
  if (!value) return null;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(value))
    throw new DomainError("INVALID_VALUE", "Gunakan angka non-negatif; titik untuk ribuan dan koma untuk desimal.");
  const canonical = value.replaceAll(".", "").replace(",", ".");
  decimal(canonical);
  return normalize(canonical);
}
export function spreadsheetInputValue(amount: SpreadsheetAmount): string {
  return amount.value?.replace(".", ",") ?? "";
}
/** The draft and publication paths use the same permitted-cell validation. */
export function validateSpreadsheetCell(row: SpreadsheetRow, field: SpreadsheetField, value: string | null): string | null {
  if (!editableSpreadsheetFields(row).includes(field)) throw new DomainError("INVALID_CELL", "Sel tidak sesuai struktur spreadsheet.");
  if (field === "description") {
    if (typeof value !== "string" || !value.trim() || value.length > 5000)
      throw new DomainError("INVALID_VALUE", "Uraian wajib diisi dan maksimal 5.000 karakter.");
    return value;
  }
  if (value !== null) decimal(value);
  return value === null ? null : normalize(value);
}
export function applySpreadsheetEdits(sheet: SpreadsheetSheet, edits: readonly SpreadsheetEdit[]): SpreadsheetSheet {
  const next = copy(sheet);
  const rows = new Map(next.rows.map(row => [row.id, row]));
  const seen = new Set<string>();
  for (const edit of edits) {
    const row = rows.get(edit.rowId);
    const key = `${edit.rowId}/${edit.field}`;
    if (!row || seen.has(key))
      throw new DomainError("INVALID_CELL", "Sel tidak sesuai struktur spreadsheet.");
    seen.add(key);
    const value = validateSpreadsheetCell(row, edit.field, edit.value);
    if (edit.field === "description") {
      row.description = value as string;
      row.descriptionUnavailable = false;
    } else {
      row[edit.field] = { ...row[edit.field]!, state: value === null ? "BLANK" : "VALUE", value };
    }
  }
  return next;
}
export function spreadsheetIssues(sheet: SpreadsheetSheet): { rowId: string; field: SpreadsheetField; message: string }[] {
  return sheet.rows.flatMap(row => editableSpreadsheetFields(row).flatMap<{ rowId: string; field: SpreadsheetField; message: string }>(field => {
    if (field === "description") return row.descriptionUnavailable || !row.description.trim()
      ? [{ rowId: row.id, field, message: "Uraian belum tersedia. Periksa sumber dan isi uraian." }] : [];
    return row[field]?.state === "UNAVAILABLE"
      ? [{ rowId: row.id, field, message: "Nilai belum tersedia. Isi angka atau tandai kosong setelah memeriksa sumber." }] : [];
  }));
}
