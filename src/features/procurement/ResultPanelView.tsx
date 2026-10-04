import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { dateTime, money, pct, roundedMoney } from "../../shared/formatters/display";
import { SnapshotInputs } from "../../shared/snapshot/SnapshotInputs";
import "../../shared/styles/focus.css";
import { Status } from "../../shared/ui/feedback";
import type { useResultPanel } from "./useResultPanel";

export function ResultPanelView({ s, busy, detail, setDetail, filter, setFilter, exportResult, rows }: ReturnType<typeof useResultPanel>) {

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>
            {s.module === "HEA" ? "Leaderboard HEA" : "Hasil Harga Timpang"}
          </h2>
          <p>
            {dateTime(s.createdAt)} · {s.id}
          </p>
        </div>
        <div className="toolbar" style={{ margin: 0 }}>
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
      {s.excluded.length > 0 && (
        <div className="alert">
          Hasil parsial · Belum dievaluasi: {s.excluded.join(", ")}.
        </div>
      )}
      {s.module === "HEA" ? (
        <div className="table-wrap">
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
          <div className="stats category-stats">
            {(["MATERIAL", "SERVICE"] as const).map((c) => (
              <div className="stat" key={c}>
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
          <div className="toolbar">
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
          <div className="table-wrap">
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
      <div className="toolbar" style={{ marginTop: 20 }}>
        <button className="inline-link" onClick={() => setDetail(!detail)}>
          {detail ? "Tutup rincian" : "Lihat input dan jejak sumber"}
        </button>
        <span className="muted">
          Hasil evaluasi mendukung pemeriksaan; tidak menetapkan pemenang.
        </span>
      </div>
      {detail && (
        <div className="alert">
          <p>{s.policy}</p>
          <SnapshotInputs value={s.inputs} />
        </div>
      )}
    </section>
  );
}
