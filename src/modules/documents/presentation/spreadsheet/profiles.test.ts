import { expect, it } from "vitest";
import { accountingAmount, oeProfile } from "./profiles";
it("formats accounting decimals without changing canonical precision or OE's display", () => {
  expect(accountingAmount("0")).toBe("-");
  expect(accountingAmount("1234567890123456.123456789")).toBe("1.234.567.890.123.456");
  expect(accountingAmount("999.995", { decimalPlaces: 2, zeroAsDash: true })).toBe("1.000,00");
  expect(accountingAmount("0.00001", { decimalPlaces: 2, zeroAsDash: true })).toBe("0,00");
  expect(accountingAmount("0", { decimalPlaces: 2, zeroAsDash: false })).toBe("0,00");
  expect(oeProfile.formatAmount("0")).toBe("Rp 0");
});
