import type { ResultRow } from "../domain/models";

export function priceComposition(rows: ResultRow[]) {
  const unequal = rows.filter(row => row.classification === "TIMPANG").length;
  const equal = rows.filter(row => row.classification === "TIDAK_TIMPANG").length;
  const classified = unequal + equal;
  return {
    unequal, equal, classified,
    unclassified: rows.length - classified,
    unequalPercent: classified ? unequal / classified * 100 : 0,
    equalPercent: classified ? equal / classified * 100 : 0,
  };
}
