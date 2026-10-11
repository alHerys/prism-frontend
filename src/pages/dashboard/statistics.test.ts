import { describe, expect, it } from "vitest";
import { describeMonthlyAdditions, monthlyAdditions } from "./statistics";

describe("dashboard monthly additions", () => {
  it("uses midnight WIB rather than UTC and crosses year boundaries", () => {
    expect(monthlyAdditions([
      "2025-12-31T16:59:59.999Z", // December in WIB.
      "2025-12-31T17:00:00.000Z", // January in WIB.
      "2025-11-30T17:00:00.000Z", // First instant of December.
      "2025-11-30T16:59:59.999Z", // November: outside the comparison.
    ], new Date("2026-01-01T00:00:00+07:00"))).toEqual({ current: 1, previous: 2, change: -1 });
  });

  it("ignores malformed and future entries rather than predicting additions", () => {
    expect(monthlyAdditions([
      "invalid", "", "2026-10-11T10:00:00Z",
      "2026-10-11T09:00:00Z", "2026-10-01T00:00:00+07:00",
      "2026-09-01T00:00:00+07:00",
    ], new Date("2026-10-11T09:00:00Z"))).toEqual({ current: 2, previous: 1, change: 1 });
  });

  it("handles leap-year February using actual calendar boundaries", () => {
    expect(monthlyAdditions([
      "2024-02-29T23:59:59+07:00", "2024-03-01T00:00:00+07:00",
      "2024-01-31T23:59:59+07:00",
    ], new Date("2024-03-01T00:00:00+07:00"))).toEqual({ current: 1, previous: 1, change: 0 });
  });

  it("describes recorded monthly additions separately from lifetime totals", () => {
    expect(describeMonthlyAdditions({ current: 3, previous: 1, change: 2 }, "pengadaan dibuat"))
      .toBe("3 pengadaan dibuat bulan ini · +2 dibanding bulan lalu (WIB)");
    expect(describeMonthlyAdditions({ current: 0, previous: 2, change: -2 }, "evaluasi disimpan"))
      .toBe("0 evaluasi disimpan bulan ini · -2 dibanding bulan lalu (WIB)");
  });

  it("reports empty periods without claiming a percentage growth", () => {
    expect(monthlyAdditions([], new Date("2026-01-01T00:00:00Z")))
      .toEqual({ current: 0, previous: 0, change: 0 });
  });

  it("rejects an invalid reference clock", () => {
    expect(() => monthlyAdditions([], new Date("invalid"))).toThrow(RangeError);
  });
});
