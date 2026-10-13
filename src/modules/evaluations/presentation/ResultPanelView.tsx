import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { PriceOverview } from "./PriceOverview";
import { PriceDeviationResults } from "./PriceDeviationResults";
import { HEALeaderboard } from "./HEALeaderboard";
import { SnapshotInputs } from "./SnapshotInputs";
import { HEAReportDialog } from "./HEAReportDialog";
import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import type { ResultPanelModel } from "./view-models";

export function ResultPanelView({ s, busy, detail, setDetail, filter, setFilter, exportResult, rows }: ResultPanelModel) {

  return (
    <>
    {s.module === "PRICE_DEVIATION" && <PriceOverview rows={s.rows} />}
    <section className="panel evaluation-result">
      <div className="panel-header">
        <div>
          <h2>
            {s.module === "HEA" ? "Leaderboard HEA" : "Detail Item"}
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
          <button className="btn" aria-expanded={detail} aria-haspopup={s.module === "HEA" ? "dialog" : undefined} aria-controls={s.module === "HEA" ? undefined : `result-trace-${s.id}`} onClick={() => setDetail(!detail)}><Eye aria-hidden="true" />{detail ? "Tutup Detail" : "Lihat Detail"}</button>
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
      {detail && s.module === "HEA" && <HEAReportDialog key={s.id} snapshot={s} onClose={() => setDetail(false)} />}
      {detail && s.module !== "HEA" && (
        <div className="result-trace" id={`result-trace-${s.id}`}>
          <p>{s.policy}</p>
          <SnapshotInputs value={s.inputs} />
        </div>
      )}
    </section>
    </>
  );
}
