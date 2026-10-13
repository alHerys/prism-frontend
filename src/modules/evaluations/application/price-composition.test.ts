import { expect, it } from "vitest";
import { priceComposition } from "./price-composition";

it("derives pie ratios only from stored known classifications", () => {
  expect(priceComposition([{ classification: "TIMPANG" }, { classification: "TIDAK_TIMPANG" }, {}])).toEqual({ unequal: 1, equal: 1, classified: 2, unclassified: 1, unequalPercent: 50, equalPercent: 50 });
  expect(priceComposition([])).toMatchObject({ classified: 0, unequalPercent: 0, equalPercent: 0 });
  expect(priceComposition([{ classification: "TIMPANG" }])).toMatchObject({ unequalPercent: 100, equalPercent: 0 });
});
