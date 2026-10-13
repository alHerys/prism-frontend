import { DataTable } from "../../../shared/ui/data-table";
import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { Package } from "@phosphor-icons/react/dist/csr/Package";
import { WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { money, pct } from "../../../shared/formatting/display";
import { HEALeaderboard } from "./HEALeaderboard";
import { SnapshotInputs } from "./SnapshotInputs";
import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import type { ResultPanelModel } from "./view-models";

export function ResultPanelView({ s, busy, detail, setDetail, filter, setFilter, exportResult, rows }: ResultPanelModel) {

  return (
    <section className="panel evaluation-result">
      <div className="panel-header">
        <div>
          <h2>
            {s.module === "HEA" ? "Leaderboard HEA" : "Hasil Harga Timpang"}
          </h2>
        </div>
        <div className="evaluation-result-header">
          <button
            className="btn"
            disabled={busy}
            onClick={() => void exportResult()}
          >
            <Download />
            {busy ? "Membuat laporan…" : "Ekspor Excel"}
          </button>
          <button className="btn" aria-expanded={detail} aria-controls={`result-trace-${s.id}`} onClick={() => setDetail(!detail)}><Eye aria-hidden="true" />{detail ? "Tutup Detail" : "Lihat Detail"}</button>
        </div>
      </div>
      {s.module === "HEA" && s.excluded.length > 0 && (
        <div className="alert">
          Hasil parsial · Belum dievaluasi: {s.excluded.join(", ")}.
        </div>
      )}
      {s.module === "HEA" ? (
        <HEALeaderboard snapshot={s} />
      ) : (
        <>
          <div className="result-category-summary">
            {(["MATERIAL", "SERVICE"] as const).map((c) => (
              <div key={c}>
                <span>{c === "MATERIAL" ? "Barang" : "Jasa"}</span>
                <strong>
                  {
                    s.rows.filter(
                      (r) => r.category === c && r.classification === "TIMPANG",
                    ).length
                  }
                </strong>
              </div>
            ))}
          </div>
          <div className="result-filter-toolbar">
            <select
              aria-label="Filter kategori hasil"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Barang & jasa</option>
              <option value="MATERIAL">Barang</option>
              <option value="SERVICE">Jasa</option>
            </select>
            <div className="result-counts">
              <span><Package size={18} aria-hidden="true" />{rows.length} Produk</span>
              <span><WarningCircle size={18} aria-hidden="true" />{rows.filter(r => r.classification === "TIMPANG").length} timpang</span>
            </div>
          </div>
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
        </>
      )}
      {detail && (
        <div className="result-trace" id={`result-trace-${s.id}`}>
          <p>{s.policy}</p>
          <SnapshotInputs value={s.inputs} />
        </div>
      )}
    </section>
  );
}
