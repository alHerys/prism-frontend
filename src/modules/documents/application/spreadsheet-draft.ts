import { applySpreadsheetEdits, editableSpreadsheetFields, spreadsheetInputValue, spreadsheetIssues, parseSpreadsheetMoney, validateSpreadsheetCell } from "../domain/spreadsheet";
import type { SpreadsheetEdit, SpreadsheetField, SpreadsheetRow, SpreadsheetSheet } from "../domain/spreadsheet";
import { normalize } from "../../../shared/kernel/validation";

export const spreadsheetCellKey = (rowId: string, field: SpreadsheetField) => `${rowId}/${field}`;
export const spreadsheetCellInput = (row: SpreadsheetRow, field: SpreadsheetField) => field === "description" ? row.description : spreadsheetInputValue(row[field]!);
export type SpreadsheetDraft = Record<string, string>;

export function reviewSpreadsheetDraft(sheet: SpreadsheetSheet, draft: SpreadsheetDraft) {
  const edits: SpreadsheetEdit[] = [];
  const issues: { rowId: string; field: SpreadsheetField; message: string }[] = [];
  for (const row of sheet.rows) for (const field of editableSpreadsheetFields(row)) {
    const raw = draft[spreadsheetCellKey(row.id, field)];
    if (raw === undefined) continue;
    try {
      if (field === "description") {
        validateSpreadsheetCell(row, field, raw);
        if (raw !== row.description || row.descriptionUnavailable) edits.push({ rowId: row.id, field, value: raw });
      } else {
        const value = validateSpreadsheetCell(row, field, parseSpreadsheetMoney(raw));
        const baseline = row[field]!;
        if (baseline.state === "UNAVAILABLE" || (value === null ? baseline.value !== null : baseline.value === null || normalize(value) !== normalize(baseline.value))) edits.push({ rowId: row.id, field, value });
      }
    } catch (error) { issues.push({ rowId: row.id, field, message: error instanceof Error ? error.message : "Nilai tidak valid." }); }
  }
  const unresolved = spreadsheetIssues(applySpreadsheetEdits(sheet, edits));
  const allIssues = [...issues, ...unresolved.filter(issue => !issues.some(other => spreadsheetCellKey(other.rowId, other.field) === spreadsheetCellKey(issue.rowId, issue.field)))];
  return { edits, issues: allIssues, dirty: edits.length > 0 || issues.length > 0,
    changed: new Set([...edits, ...issues].map(cell => spreadsheetCellKey(cell.rowId, cell.field))) };
}

export function visibleSpreadsheetRows(rows: SpreadsheetRow[], query: string, draft: SpreadsheetDraft = {}): SpreadsheetRow[] {
  const byId = new Map(rows.map(row => [row.id, row]));
  const ancestors = (row: SpreadsheetRow) => {
    const ids: string[] = [];
    let parent = row.parentId;
    while (parent && !ids.includes(parent)) { ids.push(parent); parent = byId.get(parent)?.parentId; }
    return ids;
  };
  const text = query.trim().toLocaleLowerCase("id-ID");
  if (text) {
    const found = rows.filter(row => `${row.number} ${draft[spreadsheetCellKey(row.id, "description")] ?? row.description}`.toLocaleLowerCase("id-ID").includes(text));
    if (!found.length) return [];
    const retained = new Set(found.flatMap(row => [row.id, ...ancestors(row)]));
    return rows.filter(row => retained.has(row.id) || row.kind === "TOTAL" || (row.kind === "SUBTOTAL" && row.parentId && retained.has(row.parentId)));
  }
  return rows;
}
