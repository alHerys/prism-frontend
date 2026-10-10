import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { money, pct, roundedMoney } from "../../../shared/formatting/display";
import { useWorkspaceTime } from "../../../shared/ui/workspace-time";
import { SnapshotInputs } from "./SnapshotInputs";
import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import { Status } from "../../../shared/ui/status";
import type { ResultPanelModel } from "./view-models";

export function ResultPanelView({ s, busy, detail, setDetail, filter, setFilter, exportResult, rows }: ResultPanelModel) {
  const dateTime = useWorkspaceTime();

  return (
    <section className="panel evaluation-result">
      <div className="panel-header">
        <div>
          <h2>
            {s.module === "HEA" ? "Leaderboard HEA" : "Hasil Harga Timpang"}
          </h2>
          <p>Hasil tersimpan dengan input dan jejak sumber evaluasi.</p>
        </div>
        <div className="evaluation-result-header">
          <Status value={s.status} />
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
      <div className="result-metadata">
        <span>{dateTime(s.createdAt)}</span>
        <span>Hasil <strong>{s.id}</strong></span>
        <span>{s.rows.length} {s.module === "HEA" ? "vendor dievaluasi" : "komponen dievaluasi"}</span>
      </div>
      {s.excluded.length > 0 && (
        <div className="alert">
          Hasil parsial · Belum dievaluasi: {s.excluded.join(", ")}.
        </div>
      )}
      {s.module === "HEA" ? (
        <div className="table-wrap" role="region" aria-label="Leaderboard HEA" tabIndex={0}>
          <table className="table">
            <thead>
              <tr>
                <th>Peringkat</th>
                <th>Vendor</th>
                <th className="numeric">Harga Evaluasi Akhir</th>
                <th>Sumber</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
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
              ))}
            </tbody>
          </table>
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
            <table className="table">
              <thead>
                <tr>
                  <th>Item / kategori</th>
                  <th className="numeric">OE</th>
                  <th className="numeric">Penawaran</th>
                  <th className="numeric">Terhadap OE</th>
                  <th>Klasifikasi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="result-footer">
        <button className="inline-link" aria-expanded={detail} aria-controls={`result-trace-${s.id}`} onClick={() => setDetail(!detail)}>
          {detail ? "Tutup rincian" : "Lihat input dan jejak sumber"}
          <CaretDown aria-hidden="true" />
        </button>
        <span className="muted">
          Hasil evaluasi mendukung pemeriksaan; tidak menetapkan pemenang.
        </span>
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
