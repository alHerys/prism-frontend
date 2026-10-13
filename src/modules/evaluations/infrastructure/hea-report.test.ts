// @vitest-environment node
import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { writeFile } from "node:fs/promises";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { buildHEAReport } from "../application/hea-report";
import { reportValue } from "../application/report-format";
import { buildSnapshotWorkbook, previewHEAReport } from "./workbook";
import type { Snapshot } from "../domain/models";

function savedResult() {
  const runtime = createLocalRuntime(true, true);
  const snapshot = runtime.evaluations.queries.getSnapshot().snapshots.find(s => s.module === "HEA")!;
  const procurement = runtime.procurement.queries.getSnapshot().procurements.find(p => p.id === snapshot.procurementId)!;
  return { snapshot, procurement };
}

it("uses one report layout and formatted values for the HEA worksheet and PDF", async () => {
  const { snapshot, procurement } = savedResult();
  const before = JSON.stringify(snapshot);
  const report = buildHEAReport(snapshot, procurement);
  expect(report.cells.some(cell => cell.value === "Harga Penawaran")).toBe(false);
  expect(report.cells.find(cell => cell.row === 5 && cell.column === 8)?.value).toBe("0.37692307692307692307692307692307692307692307692308");
  const workbook = await buildSnapshotWorkbook(snapshot, procurement);
  expect(workbook.worksheets[0].name).toBe("Perhitungan HEA");
  const sheet = workbook.worksheets[0];
  for (const cell of report.cells) {
    const formatted = reportValue(cell.value, cell.format);
    expect(sheet.getCell(cell.row + 1, cell.column + 2).value).toBe(formatted.numeric ?? formatted.text);
  }
  expect(sheet.getCell("B1").fill).toMatchObject({ fgColor: { argb: "FFFFFF00" } });
  expect(sheet.getCell("B3").fill).toMatchObject({ fgColor: { argb: "FFCDDBEC" } });
  expect(JSON.stringify(workbook.getWorksheet("Rincian")!.getSheetValues())).toContain(snapshot.rows[0].calculation!.tkdnCombined);
  expect(JSON.stringify(workbook.model)).not.toContain('"formula"');
  const bytes = await previewHEAReport(snapshot, procurement);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getTitle()).toBe(report.title);
  expect(JSON.stringify(snapshot)).toBe(before);
  if (process.env.PRISM_REPORT_QA_DIR) {
    await writeFile(`${process.env.PRISM_REPORT_QA_DIR}/hea.pdf`, bytes);
    await writeFile(`${process.env.PRISM_REPORT_QA_DIR}/hea.xlsx`, new Uint8Array(await workbook.xlsx.writeBuffer()));
  }
});

it("leaves missing intermediate values blank rather than reconstructing old results", async () => {
  const { snapshot, procurement } = savedResult();
  const old: Snapshot = { ...snapshot, inputs: {}, rows: [{ vendorName: "Vendor lama", hea: snapshot.rows[0].hea, rank: 1 }] };
  const report = buildHEAReport(old, procurement);
  expect(report.cells.find(cell => cell.row === 5 && cell.column === 3)?.value).toBeUndefined();
  expect(report.cells.find(cell => cell.row === 5 && cell.column === 8)?.value).toBeUndefined();
  expect(report.cells.at(-1)?.value).toContain("nilai belum tersedia pada snapshot");
  const workbook = await buildSnapshotWorkbook(old, procurement);
  expect(workbook.worksheets[0].getCell("J6").value).toBe("-");
  expect((await PDFDocument.load(await previewHEAReport(old, procurement))).getPageCount()).toBe(1);
});

it("reads only saved confirmed A5 values and the saved procurement title", () => {
  const { snapshot, procurement } = savedResult();
  const inputs = structuredClone(snapshot.inputs) as { procurement: { name: string }; documents: { status: string; reviewed: { hpb: string }; candidate: { hpb: string } }[] };
  inputs.procurement.name = "Judul saat evaluasi";
  inputs.documents[0].status = "REVIEW_REQUIRED";
  inputs.documents[1].candidate.hpb = "999";
  const report = buildHEAReport({ ...snapshot, inputs }, { ...procurement, name: "Judul diubah" });
  expect(report.title).toBe("Judul saat evaluasi");
  expect(report.cells.find(cell => cell.row === 5 && cell.column === 3)?.value).toBeUndefined();
  expect(report.cells.find(cell => cell.row === 6 && cell.column === 3)?.value).toBe(inputs.documents[1].reviewed.hpb);
});

it("paginates larger result sets without losing rows or splitting merged headers", async () => {
  const { snapshot, procurement } = savedResult();
  const large = { ...snapshot, rows: Array.from({ length: 40 }, (_, index) => ({ ...snapshot.rows[index % 2], rank: index + 1 })) };
  const report = buildHEAReport(large, procurement);
  const workbook = await buildSnapshotWorkbook(large, procurement);
  expect(workbook.worksheets[0].getCell(`J${report.rowHeights.length}`).value).toBe("40");
  expect((await PDFDocument.load(await previewHEAReport(large, procurement))).getPageCount()).toBeGreaterThan(1);
});

it("rounds display decimals without rounding the stored financial strings", () => {
  expect(reportValue("943396226.415094339622641509", "money").text).toBe("943.396.226");
  expect(reportValue("1261794759.5", "money").text).toBe("1.261.794.760");
  expect(reportValue("0.376923076923", "percent2").text).toBe("37,69%");
  expect(reportValue("0.075", "percent1").text).toBe("7,5%");
  expect(reportValue("0", "money2").text).toBe("0,00");
  expect(reportValue(undefined, "money2").text).toBe("-");
  expect(reportValue("9999999999999999.999", "money2")).toMatchObject({ text: "10.000.000.000.000.000,00", numeric: undefined });
});
