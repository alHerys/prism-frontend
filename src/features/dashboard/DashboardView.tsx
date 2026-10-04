import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Link } from "react-router";
import { dateTime, kindLabel } from "../../shared/formatters/display";
import { Empty } from "../../shared/ui/feedback";
import { ProcurementTable } from "../procurement/ProcurementTable.tsx";
import "./dashboard.css";

import type { useDashboard } from "./useDashboard";
export function DashboardView({ state, pending }: ReturnType<typeof useDashboard>) {

  return (
    <div className="page dashboard-page">
      <dl className="dashboard-overview" aria-label="Ringkasan ruang kerja">
        {[
          ["Pengadaan aktif", state.procurements.length],
          ["Dokumen", state.documents.length],
          ["Perlu ditinjau", pending.length],
          [
            "Evaluasi tersimpan",
            state.snapshots.length,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="dashboard-pair">
        <section
          className="panel dashboard-review"
          aria-labelledby="dashboard-review-title"
        >
          <div className="panel-header">
            <div>
              <h2 id="dashboard-review-title">Antrean pemeriksaan</h2>
              <p>Dokumen yang membutuhkan keputusan evaluator.</p>
            </div>
            <span className={`badge ${pending.length ? "warning" : "success"}`}>
              {pending.length} perlu ditinjau
            </span>
          </div>
          {pending.length ? (
            pending.slice(0, 3).map((d) => (
              <Link
                key={d.id}
                className="dashboard-review-row"
                to={`/pengadaan/${d.procurementId}/review/${d.id}`}
              >
                <span className="document-icon">
                  <FileText size={22} />
                </span>
                <div>
                  <strong>{d.name}</strong>
                  <small>
                    {kindLabel[d.kind]} ·{" "}
                    {
                      state.procurements.find((p) => p.id === d.procurementId)
                        ?.number
                    }
                  </small>
                </div>
                <CaretRight size={18} />
              </Link>
            ))
          ) : (
            <Empty title="Semua dokumen telah ditinjau">
              Unggah dokumen baru untuk melanjutkan evaluasi.
            </Empty>
          )}
          {pending.length > 3 && (
            <Link className="dashboard-more" to="/pengadaan">
              Lihat pengadaan untuk {pending.length - 3} dokumen lainnya{" "}
              <ArrowRight size={15} />
            </Link>
          )}
        </section>
        <section
          className="panel dashboard-activity"
          aria-labelledby="dashboard-activity-title"
        >
          <div className="panel-header">
            <div>
              <h2 id="dashboard-activity-title">Aktivitas terbaru</h2>
              <p>Jejak pekerjaan dalam ruang kerja.</p>
            </div>
            <ClockCounterClockwise size={22} className="muted" />
          </div>
          {state.events.length ? (
            <ol>
              {state.events.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <Link
                    to={
                      e.procurementId
                        ? `/pengadaan/${e.procurementId}?tab=riwayat`
                        : "/riwayat"
                    }
                  >
                    {e.summary}
                  </Link>
                  <small>{dateTime(e.createdAt)}</small>
                </li>
              ))}
            </ol>
          ) : (
            <Empty title="Belum ada aktivitas">
              Aktivitas dicatat setelah Anda mulai bekerja.
            </Empty>
          )}
          <Link className="dashboard-more" to="/riwayat">
            Lihat riwayat <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section
        className="panel dashboard-procurements"
        aria-labelledby="dashboard-procurements-title"
      >
        <div className="panel-header">
          <div>
            <h2 id="dashboard-procurements-title">Pengadaan</h2>
            <p>Lanjutkan pekerjaan dari pengadaan terkait.</p>
          </div>
          <Link className="btn primary" to="/pengadaan?baru=1">
            <Plus /> Tambah pengadaan
          </Link>
        </div>
        <ProcurementTable
          items={state.procurements}
          searchLabel="Cari pengadaan pada ringkasan"
        />
      </section>
    </div>
  );
}
