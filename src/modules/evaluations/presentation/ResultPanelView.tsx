import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { PriceOverview } from "./PriceOverview";
import { HEALeaderboard } from "./HEALeaderboard";
import { HEAReportDialog } from "./HEAReportDialog";
import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import type { ResultPanelModel } from "./view-models";

export function ResultPanelView({ s, busy, detail, setDetail, exportResult }: ResultPanelModel) {
  const exportButton = (
    <button className="btn" disabled={busy} onClick={() => void exportResult()}>
      <Download />
      {busy ? "Membuat laporan…" : "Ekspor Excel"}
    </button>
  );
  if (s.module === "PRICE_DEVIATION") {
    return <PriceOverview rows={s.rows} actions={exportButton} />;
  }
  return (
    <section className="panel evaluation-result">
      <div className="panel-header">
        <div><h2>Leaderboard HEA</h2></div>
        <div className="evaluation-result-header">
          {exportButton}
          <button className="btn" aria-expanded={detail} aria-haspopup="dialog" onClick={() => setDetail(!detail)}><Eye aria-hidden="true" />{detail ? "Tutup Detail" : "Lihat Detail"}</button>
        </div>
      </div>
      {s.excluded.length > 0 && (
        <div className="alert">
          Hasil parsial · Belum dievaluasi: {s.excluded.join(", ")}.
        </div>
      )}
      <HEALeaderboard snapshot={s} />
      {detail && <HEAReportDialog key={s.id} snapshot={s} onClose={() => setDetail(false)} />}
    </section>
  );
}
