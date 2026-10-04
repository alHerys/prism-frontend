import { expect, it } from "vitest";
import { bankMoney, dateTime, exactMoney, money, pct, roundedMoney } from "./display";
it("preserves each existing money presentation without losing decimal strings", () => {
  const value = "9007199254740993.500000000001";
  expect(money(value)).toBe("Rp9.007.199.254.740.993,500000000001");
  expect(exactMoney(value)).toBe("Rp 9.007.199.254.740.993,500000000001");
  expect(bankMoney(value)).toBe("Rp 9.007.199.254.740.993");
  expect(roundedMoney(value)).toBe("Rp9.007.199.254.740.994");
  expect(roundedMoney("12.49")).toBe("Rp12");
  expect(money(undefined)).toBe("—");
  expect(money("invalid")).toBe("invalid");
});
it("preserves ratio precision and Jakarta timestamps", () => {
  expect(pct("0.075")).toBe("7,5%");
  expect(pct("0.123456789")).toBe("12,3456789%");
  expect(pct("1")).toBe("100%");
  expect(dateTime("2026-10-02T02:00:00Z")).toContain("09.00");
});
