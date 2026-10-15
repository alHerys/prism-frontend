import type { ResultRow } from "../domain/models";

export function rankLabel(row: ResultRow, rows: readonly ResultRow[]): string {
  if (row.rank === undefined) return "—";
  return rows.filter(other => other.rank === row.rank).length > 1 ? `${row.rank} · Seri` : String(row.rank);
}
