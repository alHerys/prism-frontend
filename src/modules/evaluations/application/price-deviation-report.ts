import { requirePriceSnapshot } from "../../price-deviation/application/queries";
import type { Snapshot } from "../domain/models";

export interface PriceDeviationReportRow {
  description?: string;
  unit?: string;
  component?: { category: "MATERIAL" | "SERVICE"; oe?: string; offer?: string; ratio?: string; classification?: string };
}
export interface PriceDeviationReport { vendor: { id: string; name: string }; rows: PriceDeviationReportRow[]; }

const classifications = new Map([
  ["TIMPANG", "Harga Timpang"],
  ["TIDAK_TIMPANG", "Harga Tidak Timpang"],
]);

/** Project saved components without matching, merging or recalculating their values. */
export function buildPriceDeviationReport(snapshot: Snapshot): PriceDeviationReport {
  if (snapshot.module !== "PRICE_DEVIATION") throw new Error("Laporan ini hanya untuk Harga Timpang.");
  const owned = requirePriceSnapshot(snapshot);
  return {
    vendor: { id: owned.vendorId, name: owned.vendorName },
    rows: snapshot.rows.map(row => ({
      description: row.description,
      unit: row.unit,
      component: row.category === "MATERIAL" || row.category === "SERVICE" ? {
        category: row.category, oe: row.oe, offer: row.offer,
        ratio: row.percentageAgainstOE,
        classification: row.classification ? classifications.get(row.classification) : undefined,
      } : undefined,
    })),
  };
}
