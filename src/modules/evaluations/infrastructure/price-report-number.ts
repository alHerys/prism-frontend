function canonicalDecimal(value: string): string | undefined {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(value);
  if (!match || (!match[2] && !match[3])) return;
  const digits = (match[2] || "") + (match[3] || "");
  const point = match[2].length + Number(match[4] || 0);
  const whole = (point <= 0 ? "0" : digits.slice(0, point).padEnd(point, "0")).replace(/^0+(?=\d)/, "");
  const fraction = (point < 0 ? "0".repeat(-point) + digits : digits.slice(point)).replace(/0+$/, "");
  const absolute = `${whole || "0"}${fraction ? `.${fraction}` : ""}`;
  return `${match[1] === "-" && absolute !== "0" ? "-" : ""}${absolute}`;
}

/** Excel representation only. Never round the stored decimal to make it fit. */
export function priceReportNumber(value: string | undefined): number | string | null {
  if (value === undefined || value === "") return null;
  // Snapshot contracts use plain decimals; scientific notation is only expanded
  // for the round-trip comparison with JavaScript's number serialization.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return value;
  const canonical = canonicalDecimal(value)!;
  const significant = canonical.replace(/[-.]/g, "").replace(/^0+/, "").replace(/0+$/, "");
  if (significant.length > 15) return value;
  const numeric = Number(canonical);
  if (!Number.isFinite(numeric) || (numeric !== 0 && Math.abs(numeric) < 2.2250738585072014e-308)) return value;
  return canonicalDecimal(String(numeric)) === canonical ? numeric : value;
}
