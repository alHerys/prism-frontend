import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import vectors from "./fixtures/decimal-oracle.json";
import { decimalHEACalculator } from "./decimal-calculator";
import { rankLabel } from "../../evaluations/application/rank-label";

const preferences = { preferensi_barang: "0.25", preferensi_jasa: "0.075" };
const values = { hpb: "1000", hpj: "400", knb: "5", tkdn_barang: "0.5", tkdn_jasa: "0.4" };
const input = { vendorId: "a", vendorName: "Penyedia A", source: "Synthetic.pdf", values };
describe("isolated decimal HEA calculation", () => {
  it.each(vectors)("matches the independent Python Decimal oracle: $name", vector => {
    const before = JSON.stringify(vector);
    const [actual] = decimalHEACalculator.evaluate([{ ...input, values: vector.values }], vector.preferences);
    expect(new Decimal(actual.hea!).eq(vector.expected.hea)).toBe(true);
    for (const [key, expected] of Object.entries(vector.expected.calculation)) {
      expect(new Decimal(actual.calculation![key as keyof typeof actual.calculation]!).eq(expected)).toBe(true);
    }
    expect(actual.calculation?.tkdnCombined === undefined).toBe(!("tkdnCombined" in vector.expected.calculation));
    expect(JSON.stringify(vector)).toBe(before);
  });
  it("preserves the global Decimal context and ranks unrounded values, including ties", () => {
    const precision = Decimal.precision;
    const rows = decimalHEACalculator.evaluate([
      { ...input, vendorId: "expensive", values: { ...values, knb: "5.0000000001" } },
      input, { ...input, vendorId: "tie" },
    ], preferences);
    expect(rows.map(r => r.vendorId)).toEqual(["a", "tie", "expensive"]);
    expect(rows.map(r => r.rank)).toEqual([1, 1, 3]);
    expect(rankLabel(rows[0], rows)).toBe("1 · Seri");
    expect(Decimal.precision).toBe(precision);
  });
  it.each(["", "-1", "NaN", "Infinity", "1e5", "12,5"])("rejects invalid nominal %s", hpb => {
    expect(() => decimalHEACalculator.evaluate([{ ...input, values: { ...values, hpb } }], preferences)).toThrow();
  });
  it("rejects out-of-range percentages and preferences while accepting explicit zero", () => {
    expect(() => decimalHEACalculator.evaluate([{ ...input, values: { ...values, tkdn_barang: "1.01" } }], preferences)).toThrow();
    expect(() => decimalHEACalculator.evaluate([input], { ...preferences, preferensi_jasa: "1.01" })).toThrow();
    expect(decimalHEACalculator.evaluate([{ ...input, values: { ...values, hpb: "0", hpj: "0" } }], preferences)[0].hea).toBe("5");
  });
});
