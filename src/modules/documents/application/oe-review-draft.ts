import { applyOEEdits, editableOEFields, oeInputValue, oeIssues, parseOEMoney } from "../domain/owner-estimate";
import type { OEEdit, OEField, OERow, OESheet } from "../domain/owner-estimate";
import { normalize } from "../../../shared/kernel/validation";

export const oeCellKey = (rowId: string, field: OEField) => `${rowId}/${field}`;
export const oeCellInput = (row: OERow, field: OEField) => field === "description" ? row.description : oeInputValue(row[field]!);
export type OEDraft = Record<string, string>;

export function reviewOEDraft(sheet: OESheet, draft: OEDraft) {
  const edits: OEEdit[] = [];
  const issues: { rowId: string; field: OEField; message: string }[] = [];
  for (const row of sheet.rows) for (const field of editableOEFields(row)) {
    const raw = draft[oeCellKey(row.id, field)];
    if (raw === undefined) continue;
    try {
      if (field === "description") {
        if (!raw.trim() || raw.length > 5000) throw new Error("Uraian wajib diisi dan maksimal 5.000 karakter.");
        if (raw !== row.description || row.descriptionUnavailable) edits.push({ rowId: row.id, field, value: raw });
      } else {
        const value = parseOEMoney(raw);
        const baseline = row[field]!;
        if (baseline.state === "UNAVAILABLE" || (value === null ? baseline.value !== null : baseline.value === null || normalize(value) !== normalize(baseline.value))) edits.push({ rowId: row.id, field, value });
      }
    } catch (error) { issues.push({ rowId: row.id, field, message: error instanceof Error ? error.message : "Nilai tidak valid." }); }
  }
  const unresolved = oeIssues(applyOEEdits(sheet, edits));
  const allIssues = [...issues, ...unresolved.filter(issue => !issues.some(other => oeCellKey(other.rowId, other.field) === oeCellKey(issue.rowId, issue.field)))];
  return { edits, issues: allIssues, dirty: edits.length > 0 || issues.length > 0,
    changed: new Set([...edits, ...issues].map(cell => oeCellKey(cell.rowId, cell.field))) };
}

export function visibleOERows(rows: OERow[], query: string, draft: OEDraft = {}): OERow[] {
  const byId = new Map(rows.map(row => [row.id, row]));
  const ancestors = (row: OERow) => {
    const ids: string[] = [];
    let parent = row.parentId;
    while (parent && !ids.includes(parent)) { ids.push(parent); parent = byId.get(parent)?.parentId; }
    return ids;
  };
  const text = query.trim().toLocaleLowerCase("id-ID");
  if (text) {
    const found = rows.filter(row => `${row.number} ${draft[oeCellKey(row.id, "description")] ?? row.description}`.toLocaleLowerCase("id-ID").includes(text));
    if (!found.length) return [];
    const retained = new Set(found.flatMap(row => [row.id, ...ancestors(row)]));
    return rows.filter(row => retained.has(row.id) || row.kind === "TOTAL" || (row.kind === "SUBTOTAL" && row.parentId && retained.has(row.parentId)));
  }
  return rows;
}
