// @vitest-environment node
import { expect, it } from "vitest";
import fixture from "../../../infrastructure/local/fixtures/oe-review.json";
import { applyOEEdits, parseOEMoney } from "../domain/owner-estimate";
import type { OESheet } from "../domain/owner-estimate";
import { oeCellKey, reviewOEDraft, visibleOERows } from "./oe-review-draft";
const sheet = fixture as OESheet;

it("preserves null versus zero and validates Indonesian price input without rounding", () => {
  expect(parseOEMoney("")).toBeNull();
  expect(parseOEMoney("0")).toBe("0");
  expect(parseOEMoney("Rp 1.234.567,89123456789")).toBe("1234567.89123456789");
  expect(() => parseOEMoney("1234.56")).toThrow("titik");
  expect(() => parseOEMoney("-10")).toThrow();
  expect(() => parseOEMoney("NaN")).toThrow();
});
it("keeps the candidate immutable and treats returning to the baseline as clean", () => {
  const before = JSON.stringify(sheet);
  const key = oeCellKey("Rincian OE:r14", "material");
  const changed = reviewOEDraft(sheet, { [key]: "300.000" });
  expect(changed.dirty).toBe(true);
  expect(changed.edits[0].value).toBe("300000");
  expect(reviewOEDraft(sheet, { [key]: "200.000,00" }).dirty).toBe(false);
  expect(applyOEEdits(sheet, changed.edits).rows.find(row => row.sourceRow === 24)?.combined?.value).toBe("1275000");
  expect(JSON.stringify(sheet)).toBe(before);
  expect(() => applyOEEdits(sheet, [{ rowId: "unowned", field: "material", value: "1" }])).toThrow("struktur");
});
it("retains ancestors and subtotal context during search and collapse", () => {
  const collapsed = new Set(["Rincian OE:r12"]);
  const visible = visibleOERows(sheet.rows, collapsed, "");
  expect(visible.some(row => row.sourceRow === 14)).toBe(false);
  expect(visible.some(row => row.sourceRow === 19)).toBe(true);
  const search = visibleOERows(sheet.rows, collapsed, "perlindungan");
  expect(search.map(row => row.sourceRow)).toEqual(expect.arrayContaining([12, 14, 15, 19, 23, 24]));
});
it("requires explicit resolution of unavailable prices without making an untouched sheet dirty", () => {
  const unresolved = structuredClone(sheet);
  unresolved.rows[2].material = { ...unresolved.rows[2].material, state: "UNAVAILABLE", value: null };
  expect(reviewOEDraft(unresolved, {}).dirty).toBe(false);
  expect(reviewOEDraft(unresolved, {}).issues).toHaveLength(1);
  const clear = reviewOEDraft(unresolved, { [oeCellKey(unresolved.rows[2].id, "material")]: "" });
  expect(clear.dirty).toBe(true);
  expect(clear.issues).toHaveLength(0);
  expect(clear.edits[0].value).toBeNull();
});
