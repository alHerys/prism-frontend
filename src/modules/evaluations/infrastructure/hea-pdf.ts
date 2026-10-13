import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import type { HEAReport } from "../application/hea-report";
import { reportValue } from "../application/report-format";

function wrap(text: string, width: number, font: PDFFont, size: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) > width) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
  }
  return lines;
}
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export async function renderHEAPdf(report: HEAReport): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(report.title); document.setCreator("PRISM");
  const normal = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const widths = report.columns.map(width => (width * 7 + 5) * .75);
  const pageWidth = sum(widths) + 36, pageHeight = 595;
  const colors = { header: rgb(205 / 255, 219 / 255, 236 / 255), yellow: rgb(1, 1, 0), gray: rgb(242 / 255, 242 / 255, 242 / 255) };
  let start = 0;
  do {
    let end = start, height = 0;
    while (end < report.rowHeights.length && height + report.rowHeights[end] <= pageHeight - 54) { height += report.rowHeights[end]; end++; }
    // Never split a merged header across pages.
    for (const cell of report.cells) if (cell.row < end && cell.row + (cell.rowSpan ?? 1) > end) end = Math.min(end, cell.row);
    if (end <= start) throw new Error("Baris laporan terlalu tinggi untuk PDF.");
    const page = document.addPage([pageWidth, pageHeight]);
    for (const cell of report.cells.filter(cell => cell.row >= start && cell.row < end)) {
      const x = 18 + sum(widths.slice(0, cell.column));
      const width = sum(widths.slice(cell.column, cell.column + (cell.columnSpan ?? 1)));
      const cellHeight = sum(report.rowHeights.slice(cell.row, cell.row + (cell.rowSpan ?? 1)));
      const y = pageHeight - 18 - sum(report.rowHeights.slice(start, cell.row)) - cellHeight;
      page.drawRectangle({ x, y, width, height: cellHeight, color: cell.fill ? colors[cell.fill] : rgb(1, 1, 1), borderWidth: cell.border ? .5 : 0, borderColor: rgb(0, 0, 0) });
      const font = cell.bold ? bold : normal;
      const value = reportValue(cell.value, cell.format).text;
      const lines = wrap(value, width - 6, font, 11);
      if (lines.some(line => font.widthOfTextAtSize(line, 11) > width - 6) || lines.length * 12 > cellHeight + 2) throw new Error("Teks laporan terlalu panjang. Periksa nama vendor atau nilai sumber.");
      lines.forEach((line, index) => {
        const textWidth = font.widthOfTextAtSize(line, 11);
        const offset = cell.align === "left" ? 3 : cell.align === "right" ? width - textWidth - 3 : (width - textWidth) / 2;
        page.drawText(line, { x: x + offset, y: y + (cellHeight + lines.length * 12) / 2 - 10 - index * 12, font, size: 11, color: rgb(0, 0, 0) });
      });
    }
    start = end;
  } while (start < report.rowHeights.length);
  return document.save();
}
