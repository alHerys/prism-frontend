import { DataTable } from "../../../shared/ui/data-table";
import { money, pct } from "../../../shared/formatting/display";
import type { ResultRow } from "../domain/models";

export function PriceDeviationTable({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="table-wrap" role="region" aria-label="Hasil perbandingan komponen harga" tabIndex={0}>
      <DataTable rows={rows} label="Hasil perbandingan komponen harga" columns={[
        { label: "Item / kategori", value: r => r.description, filter: r => r.category === "MATERIAL" ? "Barang" : "Jasa" },
        { label: "OE", value: r => r.oe, type: "decimal", className: "numeric" },
        { label: "Penawaran", value: r => r.offer, type: "decimal", className: "numeric" },
        { label: "Terhadap OE", value: r => r.percentageAgainstOE, type: "decimal", className: "numeric" },
        { label: "Klasifikasi", value: r => r.classification === "TIMPANG" ? "Timpang" : "Tidak timpang", filter: r => r.classification === "TIMPANG" ? "Timpang" : "Tidak timpang" },
      ]}>{(r, i) => (
        <tr key={i}>
          <td>
            <strong>{r.description}</strong>
            <small>
              {r.category === "MATERIAL" ? "Barang" : "Jasa"} ·{" "}
              {r.unit}
            </small>
          </td>
          <td className="numeric">{money(r.oe)}</td>
          <td className="numeric">{money(r.offer)}</td>
          <td className="numeric">
            {r.percentageAgainstOE ? pct(r.percentageAgainstOE) : "—"}
          </td>
          <td>
            <span
              className={`badge ${r.classification === "TIMPANG" ? "warning" : "success"}`}
            >
              {r.classification === "TIMPANG"
                ? "Timpang"
                : "Tidak timpang"}
            </span>
          </td>
        </tr>
      )}</DataTable>
    </div>
  );
}
