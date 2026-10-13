import type { ResultRow } from "../domain/models";

/** Counts classifications already saved in the result; never recalculates prices. */
export function priceSummary(rows: ResultRow[]) {
  const categories = (["MATERIAL", "SERVICE"] as const).map(category => {
    const items = rows.filter(row => row.category === category);
    return {
      category,
      label: category === "MATERIAL" ? "Barang" : "Jasa",
      total: items.length,
      unequal: items.filter(row => row.classification === "TIMPANG").length,
      equal: items.filter(row => row.classification === "TIDAK_TIMPANG").length,
    };
  });
  return { total: rows.length, categories };
}
