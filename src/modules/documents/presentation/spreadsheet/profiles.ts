import type { CSSProperties } from "react";
import type { SpreadsheetAmount, SpreadsheetField, SpreadsheetRow, SpreadsheetSheet } from "../../domain/spreadsheet";
import { exactMoney } from "../../../../shared/formatting/display";

export interface SpreadsheetProfile {
  title: string;
  className?: string;
  formatAmount: (value: string, format?: SpreadsheetAmount["format"]) => string;
  tableStyle: (sheet?: SpreadsheetSheet) => CSSProperties | undefined;
  cellStyle: (row: SpreadsheetRow, field: SpreadsheetField | "number") => CSSProperties | undefined;
  rowStyle: (row: SpreadsheetRow) => CSSProperties | undefined;
}

/** Display rounding only; the canonical decimal stored in the draft is untouched. */
export function accountingAmount(value: string, format: SpreadsheetAmount["format"] = { decimalPlaces: 0, zeroAsDash: true }): string {
  const [whole, fraction = ""] = value.split(".");
  if (/^0+$/.test(whole + fraction) && format.zeroAsDash) return "-";
  const places = format.decimalPlaces;
  let scaled = BigInt(whole + fraction.padEnd(places, "0").slice(0, places));
  if ((fraction[places] ?? "0") >= "5") scaled++;
  const digits = scaled.toString().padStart(places + 1, "0");
  const integer = places ? digits.slice(0, -places) : digits;
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (places ? "," + digits.slice(-places) : "");
}

export const oeProfile: SpreadsheetProfile = {
  title: "Owner Estimate", formatAmount: exactMoney, tableStyle: () => undefined, rowStyle: () => undefined, cellStyle: () => undefined,
};
export const offerProfile: SpreadsheetProfile = {
  title: "Penawaran Harga", className: "offer-review", formatAmount: accountingAmount,
  tableStyle: sheet => ({ "--oe-header-background": sheet?.headerBackground ?? "#99dff3", "--oe-header-text-transform": "uppercase" } as CSSProperties),
  cellStyle: (row, field) => {
    const appearance = field === "description" ? row.appearance : field === "number" ? row.numberAppearance : row[field]?.appearance;
    return appearance ? { "--oe-cell-background": appearance.background, fontWeight: appearance.bold ? 700 : 400,
      textDecoration: appearance.underline ? "underline" : "none" } as CSSProperties : undefined;
  },
  rowStyle: row => ({
    "--oe-row-background": row.appearance?.background ?? "white",
    "--oe-row-border-style": row.appearance?.borderBottom,
  } as CSSProperties),
};
