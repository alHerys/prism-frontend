import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import type { Snapshot } from "../domain/models";
import { buildPriceDeviationReport } from "../application/price-deviation-report";
import { buildSnapshotWorkbook } from "./workbook";
import { priceReportLayout as layout } from "./price-report-layout";
import { priceReportNumber } from "./price-report-number";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const snapshot: Snapshot = {
  id: "price-report-test", procurementId: "p1", module: "PRICE_DEVIATION",
  createdAt: "2026-10-15T00:00:00Z", status: "PARTIAL", policy: "saved-policy",
  inputs: { unrelated: "Never copy live source amounts" }, excluded: ["Unconfirmed item"],
  rows: [
    { description: "Synthetic material", category: "MATERIAL", unit: "m", oe: "100000", offer: "125000", percentageAgainstOE: "1.25", deviation: "0.25", classification: "TIMPANG" },
    { description: "Synthetic service", category: "SERVICE", unit: "set", oe: "50000.125", offer: "0", percentageAgainstOE: "0", classification: "TIDAK_TIMPANG" },
    { description: "Synthetic material", category: "MATERIAL", unit: "m", oe: "1234567890123456.123456789", percentageAgainstOE: "0.1234567890123456789" },
    { description: "Unclassified component", category: "OTHER", unit: "unit", oe: "12", classification: "UNKNOWN" },
  ],
};

describe("price report number representation", () => {
  it.each([
    [undefined, null], ["", null], ["0", 0], ["0.000", 0], [".125", .125], ["00125.00", 125],
    ["999999999999999", 999999999999999], ["1000000000000000", 1e15],
    ["0.00000001", 1e-8], ["-0.125", -.125],
    ["9999999999999999", "9999999999999999"], ["1.000000000000001", "1.000000000000001"],
    ["0.1234567890123456789", "0.1234567890123456789"], ["=SUM(A1:A2)", "=SUM(A1:A2)"],
    ["1e309", "1e309"], ["not numeric", "not numeric"],
  ])("preserves %s without rounding or formulas", (input, expected) => {
    expect(priceReportNumber(input)).toBe(expected);
  });
  it("keeps overflow, underflow and subnormal decimals as text", () => {
    for (const value of ["1" + "0".repeat(309), "0." + "0".repeat(309) + "1", "0." + "0".repeat(323) + "5"])
      expect(priceReportNumber(value)).toBe(value);
  });
});

it("projects only saved results, keeping duplicate descriptions separate and missing categories empty", () => {
  const before = structuredClone(snapshot);
  const report = buildPriceDeviationReport(snapshot);
  expect(report.rows).toHaveLength(4);
  expect(report.rows[0].component).toMatchObject({ oe: "100000", ratio: "1.25", classification: "Harga Timpang" });
  expect(report.rows[2].component?.classification).toBeUndefined();
  expect(report.rows[3].component).toBeUndefined();
  expect(snapshot).toEqual(before);
  expect(() => buildPriceDeviationReport({ ...snapshot, module: "HEA" })).toThrow("hanya untuk Harga Timpang");
});

it("round-trips a single reference-shaped sheet with exact snapshot values and no calculated totals", async () => {
  const before = structuredClone(snapshot);
  const workbook = await buildSnapshotWorkbook(snapshot, { name: "Synthetic procurement", number: "TEST-001" });
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  expect(reopened.worksheets.map(sheet => sheet.name)).toEqual([layout.sheetName]);
  const sheet = reopened.worksheets[0];
  expect(sheet.getCell("B10").value).toBe("Synthetic material");
  expect(sheet.getCell("M10").value).toBe("m");
  expect(sheet.getCell("N10").value).toBe(100000);
  expect(sheet.getCell("V10").value).toBe(125000);
  expect(sheet.getCell("Z10").value).toBe(1.25);
  expect(sheet.getCell("AB10").value).toBe("Harga Timpang");
  expect(sheet.getCell("O11").value).toBe(50000.125);
  expect(sheet.getCell("W11").value).toBe(0);
  expect(sheet.getCell("AA11").value).toBe(0);
  expect(sheet.getCell("AC11").value).toBe("Harga Tidak Timpang");
  expect(sheet.getCell("N12").value).toBe(snapshot.rows[2].oe);
  expect(sheet.getCell("Z12").value).toBe(snapshot.rows[2].percentageAgainstOE);
  expect(sheet.getCell("N12").alignment.wrapText).toBe(true);
  expect(sheet.getRow(12).height).toBeGreaterThan(14.45);
  for (const address of ["A10", "C10", "L10", "O10", "P10", "Q10", "R10", "S10", "T10", "U10", "X10", "Y10", "V12", "AB12", "N13", "AB13", "Q17", "Y17"])
    expect(sheet.getCell(address).value, address).toBeNull();
  expect([...sheet.model.merges].sort()).toEqual(layout.headers.map(header => header.range).sort());
  layout.widths.forEach((width, index) => expect(sheet.getColumn(index + 1).width).toBe(width));
  for (let column = 1; column <= 29; column++) expect(sheet.getColumn(column).hidden).toBe(column >= 18 && column <= 21);
  expect(sheet.getCell("N10").numFmt).toBe(layout.formats.accounting2.replaceAll("\\", ""));
  expect(sheet.getCell("V10").numFmt).toBe(layout.formats.accounting.replaceAll("\\", ""));
  expect(sheet.getCell("Z10").numFmt).toBe("0%");
  expect(sheet.getCell("N7").fill).toMatchObject({ fgColor: { argb: "FF4EA72E" } });
  expect(sheet.getCell("V7").fill).toMatchObject({ fgColor: { argb: "FFFF0000" } });
  expect(sheet.getCell("Z8").fill).toMatchObject({ fgColor: { argb: "FFFFFF00" } });
  expect(sheet.getCell("B15").value).toBe("SUBTOTAL");
  expect(sheet.getCell("B15").alignment.horizontal).toBe("centerContinuous");
  expect(sheet.getCell("B15").fill).toMatchObject({ fgColor: { argb: "FFB4E5A2" } });
  expect(sheet.getCell("B22").value).toBe("TERBILANG:");
  expect(sheet.getCell("N10").font).toMatchObject({ name: "Arial", size: 9 });
  expect(sheet.getCell("N10").border.bottom?.style).toBe("hair");
  expect(sheet.getRow(7).height).toBe(18.95);
  expect(sheet.views[0]).toMatchObject({ state: "normal", style: "pageBreakPreview", zoomScale: 57 });
  expect(sheet.pageSetup).toMatchObject({ orientation: "portrait", paperSize: 9, scale: 20, fitToPage: false, printArea: "A5:AC22", margins: { left: .7, right: .7, top: .75, bottom: .75, header: .3, footer: .3 } });
  expect(JSON.stringify(sheet.model)).not.toContain('"formula"');
  expect(snapshot).toEqual(before);
  if (process.env.PRISM_PRICE_REPORT_QA_DIR) {
    const directory = process.env.PRISM_PRICE_REPORT_QA_DIR;
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "price-synthetic.xlsx"), new Uint8Array(await workbook.xlsx.writeBuffer()));
    const long = await buildSnapshotWorkbook({ ...snapshot, rows: Array.from({ length: 222 }, (_, index) => ({
      ...snapshot.rows[index % 2], description: `Synthetic inspection component ${index + 1} with a descriptive work specification`,
    })) }, { name: "Synthetic procurement", number: "TEST-001" });
    await writeFile(path.join(directory, "price-synthetic-long.xlsx"), new Uint8Array(await long.xlsx.writeBuffer()));
  }
});

it("keeps formula-like text literal and closes an empty report without inventing rows", async () => {
  const workbook = await buildSnapshotWorkbook({ ...snapshot, rows: [{ description: '=HYPERLINK("https://example.invalid")', category: "MATERIAL", offer: "=1+1" }] }, { name: "Test", number: "T1" });
  const sheet = workbook.worksheets[0];
  expect(sheet.getCell("B10").type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getCell("V10").type).toBe(ExcelJS.ValueType.String);
  const empty = await buildSnapshotWorkbook({ ...snapshot, rows: [] }, { name: "Test", number: "T1" });
  expect(empty.worksheets[0].getCell("B10").value).toBeNull();
  expect(empty.worksheets[0].getCell("B11").value).toBe("SUBTOTAL");
  expect(empty.worksheets[0].pageSetup.printArea).toBe("A5:AC18");
});
