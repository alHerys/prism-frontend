export type ReportFormat = "money" | "money2" | "percent" | "percent1" | "percent2";

/** Decimal ROUND_HALF_UP for display only; no financial calculations. */
function fixed(value: string, places: number, shift = 0): string {
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(value);
  if (!match || (!match[2] && !match[3])) throw new Error("Nilai desimal laporan tidak valid.");
  const fraction = match[3] ?? "";
  let digits = BigInt((match[2] || "0") + fraction);
  const difference = fraction.length - places - shift;
  if (difference > 0) {
    const divisor = 10n ** BigInt(difference);
    digits = digits / divisor + (digits % divisor * 2n >= divisor ? 1n : 0n);
  } else digits *= 10n ** BigInt(-difference);
  const text = digits.toString().padStart(places + 1, "0");
  return `${match[1] && digits !== 0n ? "-" : ""}${places ? `${text.slice(0, -places)}.${text.slice(-places)}` : text}`;
}

export function reportValue(value: string | undefined, format?: ReportFormat) {
  if (value === undefined) return { text: "-" };
  if (!format) return { text: value };
  const percent = format.startsWith("percent");
  const places = format.endsWith("2") ? 2 : format.endsWith("1") ? 1 : 0;
  const display = fixed(value, places, percent ? 2 : 0);
  const [whole, fraction] = display.split(".");
  const text = `${percent ? whole : whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${fraction ? `,${fraction}` : ""}${percent ? "%" : ""}`;
  const numeric = fixed(value, places + (percent ? 2 : 0));
  // Excel's display cells are rounded representations. Exact strings remain in audit sheets.
  const significantDigits = numeric.replace(/[-.]/g, "").replace(/^0+/, "").length;
  return { text, numeric: significantDigits <= 15 ? Number(numeric) : undefined,
    numFmt: percent ? `0${places ? `.${"0".repeat(places)}` : ""}%` : `#,##0${places ? `.${"0".repeat(places)}` : ""}` };
}
