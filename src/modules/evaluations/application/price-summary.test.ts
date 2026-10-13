import { expect, it } from "vitest";
import { priceSummary } from "./price-summary";

it("counts goods and services without treating unknown classifications as valid", () => {
  const result = priceSummary([
    { category: "MATERIAL", classification: "TIMPANG" },
    { category: "MATERIAL", classification: "TIDAK_TIMPANG" },
    { category: "SERVICE", classification: "TIMPANG" },
    { category: "SERVICE", classification: "UNKNOWN" },
  ]);
  expect(result.total).toBe(4);
  expect(result.categories).toMatchObject([{ total: 2, unequal: 1, equal: 1 }, { total: 2, unequal: 1, equal: 0 }]);
  expect(priceSummary([]).categories).toMatchObject([{ total: 0, unequal: 0, equal: 0 }, { total: 0, unequal: 0, equal: 0 }]);
});
