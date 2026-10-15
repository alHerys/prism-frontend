import type ExcelJS from "exceljs";
import type { PriceDeviationReport, PriceDeviationReportRow } from "../application/price-deviation-report";
import { priceReportLayout as layout } from "./price-report-layout";
import { priceReportNumber } from "./price-report-number";

const black = { argb: "FF000000" };
const thin: ExcelJS.Border = { style: "thin", color: black };
const medium: ExcelJS.Border = { style: "medium", color: black };
const hair: ExcelJS.Border = { style: "hair", color: black };
const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

function addHeaders(sheet: ExcelJS.Worksheet) {
  for (const header of layout.headers) {
    sheet.mergeCells(header.range);
    const cell = sheet.getCell(header.range.split(":")[0]);
    const group = Number(cell.row) === 7 && Number(cell.col) >= 14;
    cell.value = header.label;
    cell.font = { name: group ? "Aptos Narrow" : "Arial", size: group ? 14 : cell.address === "Z8" || cell.address === "AB8" ? 12 : 9, bold: true, color: black };
    cell.fill = fill(layout.colors[header.color]);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: medium, bottom: thin, left: medium, right: medium };
  }
  for (let column = 14; column <= layout.columnCount; column++) {
    const cell = sheet.getCell(9, column);
    cell.value = column % 2 === 0 ? "MATERIAL" : "JASA";
    cell.font = { name: "Arial", size: 9, bold: true, color: black };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = fill(column < 18 ? layout.colors.oeDetail : column < 22 ? layout.colors.initialDetail : column < 26 ? layout.colors.offerDetail : layout.colors.comparisonDetail);
    cell.border = { left: thin, right: thin, bottom: medium };
  }
  sheet.getRow(6).height = 18.6;
  sheet.getRow(7).height = 18.95;
  sheet.getRow(8).height = 15.6;
  sheet.getRow(9).height = 15.95;
}

function styleDataRow(sheet: ExcelJS.Worksheet, row: number) {
  sheet.getRow(row).height = 14.45;
  for (let column = 1; column <= layout.columnCount; column++) {
    const cell = sheet.getCell(row, column);
    const comparison = column >= 26;
    cell.font = { name: comparison ? "Aptos Narrow" : "Arial", size: comparison ? 12 : 9, color: black };
    cell.alignment = { vertical: "middle", horizontal: column < 12 ? "left" : "right" };
    cell.border = column < 12
      ? { top: hair, bottom: hair, left: column === 1 ? medium : column === 2 ? thin : undefined }
      : { top: comparison ? undefined : hair, bottom: comparison ? undefined : hair,
        left: [14, 18, 22, 26, 27, 28, 29].includes(column) ? medium : thin,
        right: [17, 21, 23, 25, 26, 27, 28, 29].includes(column) ? medium : thin };
    if (column >= 14 && column <= 25) cell.numFmt = column <= 17 ? layout.formats.accounting2 : layout.formats.accounting;
    if (column === 26 || column === 27) cell.numFmt = layout.formats.percent;
    if (column === 12) cell.numFmt = layout.formats.accounting2;
  }
}

function addComponent(sheet: ExcelJS.Worksheet, row: number, item: PriceDeviationReportRow) {
  // Empty C:K cells allow the description to overflow, as in the reference.
  // No numbering, hierarchy or structural rows can be inferred from a result component.
  sheet.getCell(row, 2).value = item.description ?? null;
  sheet.getCell(row, 13).value = item.unit ?? null;
  sheet.getCell(row, 13).alignment = { horizontal: "left", vertical: "middle" };
  const component = item.component;
  if (!component) return;
  const side = component.category === "MATERIAL" ? 0 : 1;
  writeDecimal(sheet, row, 14 + side, component.oe);
  writeDecimal(sheet, row, 22 + side, component.offer);
  writeDecimal(sheet, row, 26 + side, component.ratio);
  sheet.getCell(row, 28 + side).value = component.classification ?? null;
  sheet.getCell(row, 28 + side).alignment = { horizontal: "left", vertical: "middle" };
}

function writeDecimal(sheet: ExcelJS.Worksheet, row: number, column: number, value: string | undefined) {
  const cell = sheet.getCell(row, column);
  const representation = priceReportNumber(value);
  cell.value = representation;
  // The exact-text fallback may exceed a normal price cell. Wrap it rather than
  // clipping digits or shrinking the template's font to disguise precision loss.
  if (typeof representation === "string") {
    cell.alignment = { ...cell.alignment, wrapText: true };
    const lines = Math.ceil(representation.length / Math.floor(layout.widths[column - 1]));
    sheet.getRow(row).height = Math.max(sheet.getRow(row).height ?? 14.45, lines * 14.45);
  }
}

function addClosingBlock(sheet: ExcelJS.Worksheet, subtotal: number) {
  for (let column = 1; column <= 25; column++) {
    const cell = sheet.getCell(subtotal, column);
    cell.fill = fill(column < 18 ? layout.colors.subtotal : column < 22 ? layout.colors.initialDetail : layout.colors.offerDetail);
    cell.font = { name: "Arial", size: 9, bold: true, color: black };
    cell.border = { top: medium, bottom: medium, left: column === 1 ? medium : column >= 12 ? thin : undefined, right: column === 25 ? medium : undefined };
    cell.alignment = { vertical: "middle", horizontal: column >= 2 && column <= 11 ? "centerContinuous" : "right" };
    cell.numFmt = column <= 17 ? layout.formats.accounting2 : layout.formats.accounting;
  }
  sheet.getCell(subtotal, 2).value = "SUBTOTAL";
  sheet.getRow(subtotal).height = 15;
  layout.footerLabels.forEach((label, index) => {
    const row = subtotal + 2 + index;
    sheet.getRow(row).height = index >= 4 ? 15 : 14.45;
    for (let column = 1; column <= 25; column++) {
      const cell = sheet.getCell(row, column);
      cell.font = { name: "Arial", size: column >= 16 ? 11 : 10, bold: true, color: black };
      cell.alignment = { vertical: "middle", horizontal: column < 16 ? "left" : "right" };
      cell.border = { top: index === 0 ? medium : thin, bottom: index === 5 ? medium : thin,
        left: column === 1 ? medium : [16, 17, 18, 22].includes(column) ? thin : undefined,
        right: [17, 21, 25].includes(column) ? thin : undefined };
      cell.numFmt = column <= 17 ? layout.formats.accounting2 : layout.formats.accounting;
    }
    sheet.getCell(row, 2).value = label;
  });
  return subtotal + 7;
}

export function addPriceDeviationWorksheet(workbook: ExcelJS.Workbook, report: PriceDeviationReport) {
  const sheet = workbook.addWorksheet(layout.sheetName, { properties: { defaultRowHeight: 14.45 } });
  sheet.columns = layout.widths.map((width, index) => ({ width, hidden: index >= 17 && index <= 20 }));
  sheet.mergeCells("B5:Y5");
  const identity = sheet.getCell("B5");
  identity.value = `Vendor: ${report.vendor.name}`;
  identity.font = { name: "Arial", size: 11, bold: true, color: black };
  identity.alignment = { vertical: "middle", wrapText: true };
  sheet.getRow(5).height = 28;
  addHeaders(sheet);
  report.rows.forEach((item, index) => {
    const row = layout.firstDataRow + index;
    styleDataRow(sheet, row);
    addComponent(sheet, row, item);
  });
  const lastRow = addClosingBlock(sheet, layout.firstDataRow + report.rows.length + 1);
  sheet.views = [{ state: "normal", style: "pageBreakPreview", zoomScale: 57 }];
  sheet.pageSetup = { orientation: "portrait", paperSize: 9, scale: 20, fitToPage: false,
    printArea: `A5:AC${lastRow}`, margins: { left: .7, right: .7, top: .75, bottom: .75, header: .3, footer: .3 } };
  return sheet;
}
