import { describe, expect, it } from "vitest";
import { buildSnapshotWorkbook, percentageText } from "./workbook";
import type { Snapshot } from "../domain/types";
const snapshot: Snapshot = {
  id: "hea-test",
  procurementId: "p1",
  module: "HEA",
  createdAt: "2026-10-01T10:00:00Z",
  status: "PARTIAL",
  rows: [
    {
      rank: 1,
      vendorName: "PT Nusa Teknik Mandiri",
      hea: "1261794759.422429302947824884",
      source: "Form-A5-Nusa.pdf · Halaman 1",
    },
  ],
  excluded: ["Dokumen vendor kedua belum dikonfirmasi"],
  inputs: {
    preferences: { preferensi_barang: ".15", preferensi_jasa: ".075" },
    values: { hpb: "1000000000" },
  },
  policy: "hea-sample-v1",
};
describe("snapshot workbook", () => {
  it("preserves result precision, source and exclusions without formulas", async () => {
    const workbook = await buildSnapshotWorkbook(snapshot, {
      name: "Pemeliharaan terminal",
      number: "PRC-001",
    });
    expect(workbook.worksheets.map((s) => s.name)).toEqual([
      "Keterangan",
      "Ringkasan",
      "Rincian",
      "Jejak Sumber",
    ]);
    expect(workbook.getWorksheet("Rincian")!.getCell("C2").value).toBe(
      snapshot.rows[0].hea,
    );
    expect(workbook.getWorksheet("Ringkasan")!.getCell("B4").value).toBe(
      snapshot.excluded[0],
    );
    const text = JSON.stringify(workbook.model);
    expect(text).toContain("Form-A5-Nusa.pdf");
    expect(text).toContain("1000000000");
    expect(text).not.toContain('"formula"');
    const bytes = await workbook.xlsx.writeBuffer();
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
  it("does not mutate saved snapshots", async () => {
    const before = JSON.stringify(snapshot);
    await buildSnapshotWorkbook(snapshot, {
      name: "Pengadaan",
      number: "PRC-001",
    });
    expect(JSON.stringify(snapshot)).toBe(before);
  });
  it("formats stored ratios as percentages without using delta as the ratio", async () => {
    const result: Snapshot = {
      ...snapshot,
      module: "PRICE_DEVIATION",
      rows: [
        {
          description: "Pipa baja 4 inci",
          category: "MATERIAL",
          unit: "m",
          oe: "100000",
          offer: "125000",
          deviation: ".25",
          percentageAgainstOE: "1.25",
          classification: "TIMPANG",
          source: "OE-Terminal.xlsx E5 / Penawaran-Nusa.xlsx E5",
        },
      ],
    };
    const workbook = await buildSnapshotWorkbook(result, {
      name: "Pemeliharaan terminal",
      number: "PRC-001",
    });
    const ws = workbook.getWorksheet("Rincian")!;
    expect(ws.getRow(1).values).toContain("Persentase terhadap OE");
    expect(ws.getRow(2).values).toContain("125%");
    expect(ws.getRow(2).values).toContain("Material");
    expect(ws.getRow(2).values).toContain("Timpang");
    expect(ws.getRow(2).values).not.toContain(".25");
    expect(percentageText("1.10")).toBe("110%");
    expect(percentageText("0.80")).toBe("80%");
    expect(percentageText(".075")).toBe("7,5%");
    expect(percentageText("0.1234567890123456789")).toBe(
      "12,34567890123456789%",
    );
    const { default: ExcelJS } = await import("exceljs");
    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
    expect(reopened.getWorksheet("Rincian")!.getRow(2).values).toContain(
      "125%",
    );
    expect(reopened.getWorksheet("Jejak Sumber")!.rowCount).toBeGreaterThan(2);
  });
  it("exports only the statistics present in the saved Bank snapshot", async () => {
    const result: Snapshot = {
      ...snapshot,
      module: "BANK",
      inputs: {
        statistics: { min: "85000", median: "90000", max: "95000", unit: "m²" },
      },
    };
    const workbook = await buildSnapshotWorkbook(result, {
      name: "Referensi pengecatan",
      number: "OE-2026",
    });
    expect(workbook.getWorksheet("Ringkasan")!.getCell("B4").value).toBe(
      "85000",
    );
    expect(workbook.getWorksheet("Ringkasan")!.getCell("B5").value).toBe(
      "90000",
    );
    expect(workbook.getWorksheet("Ringkasan")!.getCell("B6").value).toBe(
      "95000",
    );
  });
});
