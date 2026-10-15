import { expect, it } from "vitest";
import { estimateMedian } from "./median-estimator";
it("calculates odd, even and single medians without changing the input", () => {
  const prices = ["90000", "50000", "100000", "80000", "120000"];
  const before = [...prices];
  expect(estimateMedian(prices, "17")).toMatchObject({ median: "90000", total: "1530000", min: "50000", max: "120000" });
  expect(prices).toEqual(before);
  expect(estimateMedian(["1", "2", "5", "3"], "2.5").total).toBe("6.25");
  expect(estimateMedian(["1.25"], "0").total).toBe("0");
});
it("preserves large and fractional decimal inputs without Number conversion", () => {
  expect(estimateMedian(["9007199254740993.125", "9007199254740993.375"], "0.1")).toMatchObject({ median: "9007199254740993.25", total: "900719925474099.325" });
});
it("rejects missing references, invalid quantities and malformed prices", () => {
  expect(() => estimateMedian([], "1")).toThrow("Belum ada referensi");
  for (const value of ["", "-1", "1,2", "NaN", "Infinity"]) expect(() => estimateMedian(["1"], value)).toThrow();
  expect(() => estimateMedian([""], "1")).toThrow();
});
