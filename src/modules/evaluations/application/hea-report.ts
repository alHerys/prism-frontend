import type { Snapshot } from "../domain/models";
import type { ReportFormat } from "./report-format";

export interface ReportCell {
  row: number; column: number; rowSpan?: number; columnSpan?: number;
  value?: string; format?: ReportFormat;
  fill?: "header" | "yellow" | "gray";
  bold?: boolean; align?: "left" | "center" | "right"; border?: boolean;
}
export interface HEAReport {
  title: string; columns: number[]; rowHeights: number[]; cells: ReportCell[];
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}
function text(value: unknown): string | undefined { return typeof value === "string" ? value : undefined; }

/** Shared document geometry/content for Excel and PDF. Uses only saved snapshot values. */
export function buildHEAReport(snapshot: Snapshot, procurement: { name: string; number: string }): HEAReport {
  if (snapshot.module !== "HEA") throw new Error("Laporan ini hanya untuk HEA.");
  const inputs = record(snapshot.inputs);
  const savedProcurement = record(inputs.procurement);
  const title = text(savedProcurement.name) ?? procurement.name;
  const documents: unknown[] = Array.isArray(inputs.documents) ? inputs.documents : [];
  const confirmedDocuments = documents.map(record).filter(document =>
    document.procurementId === snapshot.procurementId &&
    document.kind === "FORM_A5" && document.status === "CONFIRMED",
  );
  const prefs = record(savedProcurement.preferences);
  const count = snapshot.rows.length;
  const lower = 6 + count;
  const rowHeights = [22, 15, 18, 18, 18, ...snapshot.rows.map(row => (row.vendorName?.length ?? 0) > 55 ? 32 : 18), 15, 20, 34, 34, ...snapshot.rows.map(() => 18)];
  const cells: ReportCell[] = [];
  const put = (row: number, column: number, value: string | undefined, options: Omit<ReportCell, "row" | "column" | "value"> = {}) => cells.push({ row, column, value, border: true, align: "center", ...options });
  const header = (row: number, column: number, value: string, rowSpan = 1, columnSpan = 1) => put(row, column, value, { fill: "header", rowSpan, columnSpan });
  put(0, 0, title, { columnSpan: 11, fill: "yellow", bold: true, border: false });
  header(2, 0, "No", 3); header(2, 1, "Nama Perusahaan", 3, 2);
  header(2, 3, "Penawaran", 1, 3); header(3, 3, "( dalam Rupiah )", 1, 3);
  header(2, 6, "TKDN", 2, 3); header(2, 9, "Preferensi", 2, 2);
  ["Barang (*HPB)", "Jasa (*HPJ)", "Total", "Barang", "Jasa", "Gabungan", "Barang", "Jasa"].forEach((label, index) => header(4, index + 3, label));
  header(lower, 0, "No", 3); header(lower, 1, "Evaluasi Barang", 1, 2); header(lower, 3, "Evaluasi Jasa", 1, 2);
  ["HE TKDN Gabungan", "KNB (Komponen\nNon Biaya)", "HEA", "Peringkat"].forEach((label, index) => header(lower, index + 5, label, 3));
  ["Koefisien Preferensi Barang (KPb)", "HE TKDN Barang", "Koefisien Preferensi Jasa (KPj)", "HE TKDN Jasa"].forEach((label, index) => header(lower + 1, index + 1, label));
  ["(TKDN Barang * Preferensi Barang)", "HPB / (1+KPb)", "(TKDN Jasa * Preferensi Jasa)", "HPJ / (1+KPj)"].forEach((label, index) => header(lower + 2, index + 1, label));
  snapshot.rows.forEach((result, index) => {
    const source = result.vendorId ? confirmedDocuments.find(document => document.vendorId === result.vendorId) : undefined;
    const values = record(source?.reviewed);
    const calculation = result.calculation;
    const upperRow = 5 + index, lowerRow = lower + 3 + index;
    put(upperRow, 0, String(index + 1)); put(upperRow, 1, result.vendorName, { columnSpan: 2, align: "left", bold: true });

    const inputAmount = { format: "money2", fill: "yellow", align: "right" } as const;
    const inputRatio = { format: "percent2", fill: "yellow" } as const;
    put(upperRow, 3, text(values.hpb), inputAmount);
    put(upperRow, 4, text(values.hpj), inputAmount);
    put(upperRow, 5, calculation?.total, { format: "money2", bold: true, align: "right" });
    put(upperRow, 6, text(values.tkdn_barang), inputRatio);
    put(upperRow, 7, text(values.tkdn_jasa), inputRatio);
    put(upperRow, 8, calculation?.tkdnCombined, { format: "percent2", fill: "gray" });
    put(upperRow, 9, text(prefs.preferensi_barang), { format: "percent" });
    put(upperRow, 10, text(prefs.preferensi_jasa), { format: "percent1" });

    put(lowerRow, 0, String(index + 1));
    put(lowerRow, 1, calculation?.kpb, { format: "percent2", fill: "gray" });
    put(lowerRow, 2, calculation?.heGoods, { format: "money" });
    put(lowerRow, 3, calculation?.kpj, { format: "percent2" });
    put(lowerRow, 4, calculation?.heServices, { format: "money" });
    put(lowerRow, 5, calculation?.heCombined, { format: "money", fill: "gray" });
    put(lowerRow, 6, text(values.knb), { format: "money2", fill: "yellow" });
    put(lowerRow, 7, result.hea, { format: "money" });
    put(lowerRow, 8, result.rank === undefined ? undefined : String(result.rank), { fill: "yellow" });
  });
  if (cells.some(cell => cell.value === undefined)) {
    rowHeights.push(15, 18);
    put(rowHeights.length - 1, 0, "-: nilai belum tersedia pada snapshot.", { columnSpan: 11, border: false, align: "left" });
  }
  // Column widths follow B:L of the supplied template. C:D replaces the omitted offer-price column.
  return { title, columns: [5.7265625, 36.1796875, 20.81640625, 19.54296875, 20.1796875, 21.7265625, 18.7265625, 18, 11.54296875, 9.54296875, 8.54296875], rowHeights, cells };
}
