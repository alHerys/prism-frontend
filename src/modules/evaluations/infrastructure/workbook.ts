import { requirePriceSnapshot } from "../../price-deviation/application/queries";
import { downloadBytes } from "../../../infrastructure/browser/download";
import type { Procurement } from "../../procurement/domain/models";
import type { Snapshot } from "../domain/models";
import { buildHEAReport } from "../application/hea-report";
import { addHEAWorksheet } from "./hea-workbook";
import { buildPriceDeviationReport } from "../application/price-deviation-report";
import { addPriceDeviationWorksheet } from "./price-workbook";
const labels: Record<string, string> = {
  vendorId: "Identitas vendor",
  vendorName: "Vendor",
  rank: "Peringkat",
  description: "Uraian",
  category: "Kategori",
  unit: "Satuan",
  offer: "Harga penawaran (Rp)",
  oe: "Harga OE (Rp)",
  deviation: "Selisih relatif terhadap OE (desimal)",
  percentageAgainstOE: "Persentase terhadap OE",
  classification: "Klasifikasi",
  hea: "HEA (Rp)",
  calculation: "Rincian perhitungan (presisi penuh)",
  source: "Sumber",
  hpb: "Harga penawaran barang (Rp)",
  hpj: "Harga penawaran jasa (Rp)",
  knb: "Komponen bukan biaya (Rp)",
  tkdn_barang: "TKDN barang",
  tkdn_jasa: "TKDN jasa",
  preferensi_barang: "Preferensi barang",
  preferensi_jasa: "Preferensi jasa",
  id: "Identitas",
  procurementId: "Identitas pengadaan",
  name: "Nama",
  kind: "Jenis dokumen",
  fixtureId: "Referensi berkas",
  uploadedAt: "Waktu unggah",
  revision: "Revisi",
  status: "Status",
  candidate: "Nilai awal",
  reviewed: "Nilai review",
  warnings: "Peringatan",
  acknowledged: "Peringatan ditinjau",
  sources: "Bukti sumber",
  field: "Komponen",
  location: "Lokasi",
  quote: "Cuplikan sumber",
  groups: "Kelompok harga tersedia",
  selectedGroup: "Kelompok harga terpilih",
  pairs: "Pasangan item",
  matched: "Pasangan sesuai",
  confirmed: "Terkonfirmasi",
  functionName: "Fungsi",
  period: "Periode",
  published: "Dipublikasikan",
  preferences: "Preferensi",
  documents: "Dokumen",
  values: "Nilai",
  oeDocument: "Dokumen OE",
  offerDocument: "Dokumen penawaran",
  min: "Minimum (Rp)",
  max: "Maksimum (Rp)",
  median: "Median (Rp)",
  statistics: "Statistik harga",
  items: "Referensi item",
  price: "Harga satuan (Rp)",
  documentName: "Dokumen sumber",
  comparable: "Sebanding",
  selected: "Terpilih",
  createdAt: "Waktu",
  referenceIds: "Identitas referensi",
  references: "Referensi historis",
};
const displayValues: Record<string, string> = {
  MATERIAL: "Material",
  SERVICE: "Jasa",
  TIMPANG: "Timpang",
  TIDAK_TIMPANG: "Tidak timpang",
  FORM_A5: "Form A5",
  OE: "OE",
  OFFER: "Penawaran",
  HISTORICAL_OE: "OE historis",
  CONFIRMED: "Terkonfirmasi",
  REVIEW_REQUIRED: "Perlu ditinjau",
  COMPLETE: "Lengkap",
  PARTIAL: "Parsial",
};
const percentageFields = new Set([
  "percentageAgainstOE",
  "tkdn_barang",
  "tkdn_jasa",
  "preferensi_barang",
  "preferensi_jasa",
]);
// A representation shift only: the ratio in the snapshot is already authoritative.
// No ratio, difference, financial or classification calculation occurs during export.
export function percentageText(value: string): string {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(value);
  if (!match || (!match[2] && !match[3])) return value;
  const fraction = (match[3] || "").padEnd(2, "0");
  const integer = ((match[2] || "0") + fraction.slice(0, 2)).replace(
    /^0+(?=\d)/,
    "",
  );
  const tail = fraction.slice(2).replace(/0+$/, "");
  return `${match[1]}${integer}${tail ? "," + tail : ""}%`;
}
// Preserve decimals exactly as supplied by the result snapshot, including full precision.
// Never turn financial strings into JS Numbers or formula cells.
function scalar(value: unknown, field = ""): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  const text = String(value);
  if (percentageFields.has(field)) return percentageText(text);
  return displayValues[text] || text;
}
function flatten(value: unknown, prefix = ""): [string, string][] {
  if (value === null || typeof value !== "object")
    return [[prefix, scalar(value)]];
  return Object.entries(value).flatMap(([key, child]) => {
    const label = Array.isArray(value)
      ? String(Number(key) + 1)
      : labels[key] || key;
    const path = prefix ? `${prefix} / ${label}` : label;
    return child !== null && typeof child === "object"
      ? flatten(child, path)
      : [[path, scalar(child, key)]];
  });
}
export async function buildSnapshotWorkbook(
  snapshot: Snapshot,
  procurement: Pick<Procurement, "name" | "number">,
) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PRISM";
  workbook.created = new Date(snapshot.createdAt);
  workbook.modified = new Date(snapshot.createdAt);
  if (snapshot.module === "PRICE_DEVIATION") {
    addPriceDeviationWorksheet(workbook, buildPriceDeviationReport(snapshot));
    return workbook;
  }
  if (snapshot.module === "HEA") addHEAWorksheet(workbook, buildHEAReport(snapshot, procurement));
  const module =
    snapshot.module === "HEA"
      ? "Harga Evaluasi Akhir"
      : "Bank Data OE";
  function sheet(name: string, headers: string[], rows: string[][]) {
    const ws = workbook.addWorksheet(name);
    ws.columns = headers.map((header, i) => ({
      header,
      key: String(i),
      width:
        headers.length === 2
          ? i === 0
            ? 48
            : 78
          : header === "Sumber" || header === "Vendor" || header === "Uraian"
            ? 42
            : 30,
    }));
    rows.forEach((row) => ws.addRow(row));
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, rows.length + 1), column: headers.length },
    };
    ws.getRow(1).height = 30;
    ws.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006CB8" },
      };
      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    ws.eachRow((row, index) => {
      if (index === 1) return;
      let height = 30;
      row.eachCell((cell) => {
        height = Math.max(
          height,
          Math.ceil(String(cell.value || "").length / 55) * 16 + 8,
        );
      });
      row.height = height;
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 11, color: { argb: "FF1E293B" } };
        cell.alignment = { vertical: "top", wrapText: true };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        if (index % 2 === 0)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF6F8FA" },
          };
      });
    });
    ws.pageSetup = {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };
    return ws;
  }
  sheet(
    "Keterangan",
    ["Informasi", "Nilai"],
    [
      ["Pengadaan", procurement.name],
      ["Nomor pengadaan", procurement.number],
      ["Modul", module],
      ["Identitas hasil", snapshot.id],
      [
        "Waktu evaluasi",
        new Intl.DateTimeFormat("id-ID", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }).format(new Date(snapshot.createdAt)),
      ],
      ["Kebijakan", snapshot.policy],
      ["Status", snapshot.status === "COMPLETE" ? "Lengkap" : "Parsial"],
      [
        "Catatan",
        "Hasil mendukung pemeriksaan evaluator; tidak menetapkan pemenang pengadaan.",
      ],
    ],
  );
  const inputs = snapshot.inputs as
    | {
      statistics?: {
        min?: string;
        median?: string;
        max?: string;
        unit?: string;
      };
    }
    | undefined;
  const statistics =
    snapshot.module === "BANK" ? inputs?.statistics : undefined;
  sheet(
    "Ringkasan",
    ["Informasi", "Nilai"],
    [
      ["Jumlah hasil", String(snapshot.rows.length)],
      ["Belum dievaluasi", String(snapshot.excluded.length)],
      ...(statistics
        ? [
          ["Minimum (Rp)", statistics.min || ""],
          ["Median (Rp)", statistics.median || ""],
          ["Maksimum (Rp)", statistics.max || ""],
          ["Satuan", statistics.unit || ""],
        ]
        : []),
      ...snapshot.excluded.map((reason, index) => [
        `Pengecualian ${index + 1}`,
        reason,
      ]),
    ],
  );
  const columns = Array.from(
    new Set(
      snapshot.rows.flatMap((row) =>
        Object.keys(row).filter((key) => key !== "deviation"),
      ),
    ),
  );
  sheet(
    "Rincian",
    columns.length ? columns.map((k) => labels[k] || k) : ["Hasil"],
    snapshot.rows.map((row) =>
      columns.map((k) => scalar(row[k as keyof typeof row], k)),
    ),
  );
  sheet(
    "Jejak Sumber",
    ["Input / sumber", "Nilai"],
    [
      ...flatten(snapshot.inputs),
      ...snapshot.rows
        .filter((row) => row.source)
        .map((row, index) => [`Sumber hasil ${index + 1}`, row.source!]),
    ],
  );
  return workbook;
}
export async function previewHEAReport(snapshot: Snapshot, procurement: Pick<Procurement, "name" | "number">) {
  const { renderHEAPdf } = await import("./hea-pdf");
  return renderHEAPdf(buildHEAReport(snapshot, procurement));
}
export async function downloadSnapshot(
  snapshot: Snapshot,
  procurement: Pick<Procurement, "name" | "number">,
) {
  const workbook = await buildSnapshotWorkbook(snapshot, procurement);
  const bytes = await workbook.xlsx.writeBuffer();
  downloadBytes(new Uint8Array(bytes), snapshotWorkbookFilename(snapshot, procurement));
}

export function snapshotWorkbookFilename(snapshot: Snapshot, procurement: Pick<Procurement, "number">) {
  const vendor = snapshot.module === "PRICE_DEVIATION" ? `-${requirePriceSnapshot(snapshot).vendorName.replace(/[^\w-]/g, "-").slice(0, 80)}` : "";
  return `PRISM-${snapshot.module}-${procurement.number.replace(/[^\w-]/g, "-")}-${snapshot.id.replace(/[^\w-]/g, "-")}${vendor}.xlsx`;
}
