import { copy, decimal, DomainError, normalize } from "../../../shared/kernel/validation";

export type OEField = "description" | "material" | "services" | "combined";
export interface OEAmount {
  state: "VALUE" | "BLANK" | "UNAVAILABLE";
  value: string | null;
  cell: string;
  formula?: string;
}
export interface OERow {
  id: string;
  sourceRow: number;
  parentId?: string;
  level: number;
  number: string;
  description: string;
  descriptionCells: string[];
  descriptionUnavailable?: boolean;
  kind: "CATEGORY" | "ITEM" | "NOTE" | "SUBTOTAL" | "TOTAL";
  scope: "SPLIT" | "COMBINED" | "NONE";
  material: OEAmount;
  services: OEAmount;
  combined?: OEAmount;
}
export interface OESheet { id: string; name: string; sourceSheet?: string; rows: OERow[]; warnings: string[]; }
export interface OEReview { candidate: OESheet; reviewed?: OESheet; }
export interface OEEdit { rowId: string; field: OEField; value: string | null; }

/** A source row belongs to one document, even when another upload repeats it. */
export function identifyOESheet(sheet: OESheet, documentId: string): OESheet {
  const owned = copy(sheet);
  const ids = new Map(owned.rows.map(row => [row.id, `${documentId}/${sheet.sourceSheet ?? sheet.name}:r${row.sourceRow}`]));
  for (const row of owned.rows) {
    if (row.parentId) row.parentId = ids.get(row.parentId);
    row.id = ids.get(row.id)!;
  }
  return owned;
}

export function editableOEFields(row: OERow): OEField[] {
  return row.scope === "NONE" ? ["description"] : row.scope === "COMBINED"
    ? ["description", "combined"] : ["description", "material", "services"];
}

/** Representation parsing only. Prices are never calculated in the browser. */
export function parseOEMoney(input: string): string | null {
  const value = input.trim().replace(/^Rp\s*/i, "");
  if (!value) return null;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(value))
    throw new DomainError("INVALID_VALUE", "Gunakan angka non-negatif; titik untuk ribuan dan koma untuk desimal.");
  const canonical = value.replaceAll(".", "").replace(",", ".");
  decimal(canonical);
  return normalize(canonical);
}
export function oeInputValue(amount: OEAmount): string {
  return amount.value?.replace(".", ",") ?? "";
}
export function applyOEEdits(sheet: OESheet, edits: readonly OEEdit[]): OESheet {
  const next = copy(sheet);
  const rows = new Map(next.rows.map(row => [row.id, row]));
  const seen = new Set<string>();
  for (const edit of edits) {
    const row = rows.get(edit.rowId);
    const key = `${edit.rowId}/${edit.field}`;
    if (!row || !editableOEFields(row).includes(edit.field) || seen.has(key))
      throw new DomainError("INVALID_CELL", "Sel tidak sesuai struktur OE.");
    seen.add(key);
    if (edit.field === "description") {
      if (typeof edit.value !== "string" || !edit.value.trim() || edit.value.length > 5000)
        throw new DomainError("INVALID_VALUE", "Uraian wajib diisi dan maksimal 5.000 karakter.");
      row.description = edit.value;
      row.descriptionUnavailable = false;
    } else {
      if (edit.value !== null) decimal(edit.value);
      row[edit.field] = { ...row[edit.field]!, state: edit.value === null ? "BLANK" : "VALUE", value: edit.value === null ? null : normalize(edit.value) };
    }
  }
  return next;
}
export function oeIssues(sheet: OESheet): { rowId: string; field: OEField; message: string }[] {
  return sheet.rows.flatMap(row => editableOEFields(row).flatMap<{ rowId: string; field: OEField; message: string }>(field => {
    if (field === "description") return row.descriptionUnavailable || !row.description.trim()
      ? [{ rowId: row.id, field, message: "Uraian belum tersedia. Periksa sumber dan isi uraian." }] : [];
    return row[field]?.state === "UNAVAILABLE"
      ? [{ rowId: row.id, field, message: "Nilai belum tersedia. Isi angka atau tandai kosong setelah memeriksa sumber." }] : [];
  }));
}
