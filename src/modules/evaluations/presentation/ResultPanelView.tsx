import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { PriceDeviationResults } from "./PriceDeviationResults";
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
        <PriceDeviationResults rows={rows} filter={filter} setFilter={setFilter} />
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
