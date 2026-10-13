import { DataTable } from "../../../shared/ui/data-table";
import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { money, pct, roundedMoney } from "../../../shared/formatting/display";
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
        </div>
      </div>
      {s.excluded.length > 0 && (
        <div className="alert">
          Hasil parsial · Belum dievaluasi: {s.excluded.join(", ")}.
        </div>
      )}
      {s.module === "HEA" ? (
        <div className="table-wrap" role="region" aria-label="Leaderboard HEA" tabIndex={0}>
          <DataTable rows={rows} label="Leaderboard HEA" columns={[
  { label: "Peringkat", value: r => r.rank },
  { label: "Vendor", value: r => r.vendorName },
  { label: "Harga Evaluasi Akhir", value: r => r.hea, type: "decimal", className: "numeric" },
  { label: "Sumber", value: r => r.source },
]}>{(r, i) => (
                <tr key={i}>
                  <td>
                    <span className="result-rank">{r.rank}</span>
                  </td>
                  <td>
                    <strong>{r.vendorName}</strong>
                  </td>
                  <td className="numeric" title={r.hea}>
                    {roundedMoney(r.hea)}
                    <small>Urutan berdasarkan nilai berpresisi penuh</small>
                  </td>
                  <td>{r.source}</td>
                </tr>
              )}</DataTable>
        </div>
      ) : (
        <>
          <div className="result-category-summary">
            {(["MATERIAL", "SERVICE"] as const).map((c) => (
              <div key={c}>
                <span>{c === "MATERIAL" ? "Material" : "Jasa"}</span>
                <strong>
                  {
                    s.rows.filter(
                      (r) => r.category === c && r.classification === "TIMPANG",
                    ).length
                  }
                </strong>
                <small>
                  komponen timpang dari{" "}
                  {s.rows.filter((r) => r.category === c).length} terverifikasi
                </small>
              </div>
            ))}
          </div>
          <div className="result-filter-toolbar">
            <select
              aria-label="Filter kategori hasil"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Material & jasa</option>
              <option value="MATERIAL">Material</option>
              <option value="SERVICE">Jasa</option>
            </select>
            <span className="muted">
              {rows.length} komponen ·{" "}
              {rows.filter((r) => r.classification === "TIMPANG").length}{" "}
              timpang
            </span>
          </div>
          <div className="table-wrap" role="region" aria-label="Hasil perbandingan komponen harga" tabIndex={0}>
            <DataTable rows={rows} label="Hasil perbandingan komponen harga" columns={[
  { label: "Item / kategori", value: r => r.description, filter: r => r.category === "MATERIAL" ? "Material" : "Jasa" },
  { label: "OE", value: r => r.oe, type: "decimal", className: "numeric" },
  { label: "Penawaran", value: r => r.offer, type: "decimal", className: "numeric" },
  { label: "Terhadap OE", value: r => r.percentageAgainstOE, type: "decimal", className: "numeric" },
  { label: "Klasifikasi", value: r => r.classification === "TIMPANG" ? "Timpang" : "Tidak timpang", filter: r => r.classification === "TIMPANG" ? "Timpang" : "Tidak timpang" },
]}>{(r, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{r.description}</strong>
                      <small>
                        {r.category === "MATERIAL" ? "Material" : "Jasa"} ·{" "}
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
      <div className="result-footer">
        <button className="inline-link" aria-expanded={detail} aria-controls={`result-trace-${s.id}`} onClick={() => setDetail(!detail)}>
          {detail ? "Tutup rincian" : "Lihat input dan jejak sumber"}
          <CaretDown aria-hidden="true" />
        </button>
      </div>
      {detail && (
        <div className="result-trace" id={`result-trace-${s.id}`}>
          <p>{s.policy}</p>
          <SnapshotInputs value={s.inputs} />
        </div>
      )}
    </section>
  );
}
