import type { OERow } from "../../domain/owner-estimate";

export interface OERowLayout {
  mainNumber: string;
  childMarker: string | null;
  descriptionSpan: number;
  descriptionAlignment: "left" | "center";
}

/** Source position is authoritative; legacy numbers keep their previous column. */
export function oeRowLayout(row: OERow): OERowLayout {
  const mainNumber = row.numberSource?.position === "CHILD" ? "" : row.number;
  const merged = { mainNumber, childMarker: null, descriptionSpan: 2, descriptionAlignment: "left" as const };
  if (row.scope === "NONE") return { ...merged, descriptionSpan: 4 };
  if (row.kind === "SUBTOTAL") return { ...merged, descriptionAlignment: "center" };
  if (row.numberSource?.position === "CHILD" || row.bullet || (!row.number && row.parentId && row.kind === "NOTE")) {
    return { mainNumber, childMarker: row.numberSource?.position === "CHILD" ? row.number : row.bullet?.value ?? "", descriptionSpan: 1, descriptionAlignment: "left" };
  }
  return merged;
}
