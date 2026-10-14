import { expect, it } from "vitest";
import type { OERow } from "../../domain/owner-estimate";
import fixture from "../../../../infrastructure/local/fixtures/oe-review.json";
import { oeRowLayout } from "./oe-row-layout";

const row = (changes: Partial<OERow> = {}): OERow => ({ ...fixture.rows[1] as OERow, ...changes });

it("merges main descriptions and preserves legacy numbering without guessing its position", () => {
  for (const number of ["I", "A", "1.2", "2.1.3.1"]) {
    expect(oeRowLayout(row({ number, numberSource: { cell: "A13", position: "NO" } }))).toEqual({
      mainNumber: number, childMarker: null, descriptionSpan: 2, descriptionAlignment: "left",
    });
    expect(oeRowLayout(row({ number, numberSource: undefined })).mainNumber).toBe(number);
  }
});

it("uses one child column at every depth, even for an alphabetic category", () => {
  for (const number of ["1.2.1", "2.1.3.1", "A"]) {
    expect(oeRowLayout(row({ number, numberSource: { cell: "B13", position: "CHILD" }, kind: "CATEGORY" }))).toEqual({
      mainNumber: "", childMarker: number, descriptionSpan: 1, descriptionAlignment: "left",
    });
  }
});

it("shows explicit bullets but leaves unmarked child descriptions unmarked", () => {
  const note = row({ number: "", numberSource: undefined, kind: "NOTE", parentId: "parent" });
  expect(oeRowLayout({ ...note, bullet: { value: "-", cell: "B13" } }).childMarker).toBe("-");
  expect(oeRowLayout(note).childMarker).toBe("");
});

it("centers merged subtotals and preserves total and full-width note geometry", () => {
  expect(oeRowLayout(row({ kind: "SUBTOTAL", number: "" }))).toMatchObject({ childMarker: null, descriptionSpan: 2, descriptionAlignment: "center" });
  expect(oeRowLayout(row({ kind: "TOTAL", scope: "COMBINED", number: "" }))).toMatchObject({ descriptionSpan: 2, descriptionAlignment: "left" });
  expect(oeRowLayout(row({ kind: "NOTE", scope: "NONE", number: "" }))).toMatchObject({ childMarker: null, descriptionSpan: 4, descriptionAlignment: "left" });
});
