import type ExcelJS from "exceljs";
import type { HEAReport } from "../application/hea-report";
import { reportValue } from "../application/report-format";

export function addHEAWorksheet(workbook: ExcelJS.Workbook, report: HEAReport) {
  const sheet = workbook.addWorksheet("Perhitungan HEA");
  sheet.columns = [{ width: 1.7265625 }, ...report.columns.map(width => ({ width }))];
  report.rowHeights.forEach((height, index) => { sheet.getRow(index + 1).height = height; });
  const colors = { header: "FFCDDBEC", yellow: "FFFFFF00", gray: "FFF2F2F2" };
  for (const cell of report.cells) {
    const row = cell.row + 1, column = cell.column + 2;
    if ((cell.rowSpan ?? 1) > 1 || (cell.columnSpan ?? 1) > 1) sheet.mergeCells(row, column, row + (cell.rowSpan ?? 1) - 1, column + (cell.columnSpan ?? 1) - 1);
    const target = sheet.getCell(row, column);
    const value = reportValue(cell.value, cell.format);
    target.value = value.numeric ?? value.text;
    if (value.numFmt) target.numFmt = value.numFmt;
    target.font = { name: "Arial", size: 11, bold: cell.bold ?? false, color: { argb: "FF000000" } };
    target.alignment = { horizontal: cell.align ?? "center", vertical: "middle", wrapText: true };
    if (cell.fill) target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors[cell.fill] } };
    if (cell.border) target.border = Object.fromEntries(["top", "bottom", "left", "right"].map(side => [side, { style: "thin", color: { argb: "FF000000" } }]));
  }
  sheet.views = [{ state: "normal", zoomScale: 100, showGridLines: true }];
  sheet.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printArea: `A1:L${report.rowHeights.length}`, margins: { left: .25, right: .25, top: .25, bottom: .25, header: .1, footer: .1 } };
  return sheet;
}
