import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Link } from "react-router";
import { useWorkspaceTime } from "../../shared/ui/workspace-time";
import { EmptyState as Empty } from "../../shared/ui/empty-state";
import { ActivityIcon } from "../../shared/ui/activity-icon";
import type { DashboardModel } from "./view-models";
import "./dashboard.css";

export function DashboardView({ state, pending }: DashboardModel) {
  const dateTime = useWorkspaceTime();
  const metrics = [
    { label: "Pengadaan aktif", value: state.procurements.length, description: "Pengadaan di ruang kerja", to: "/pengadaan" },
    { label: "Perlu ditinjau", value: pending.length, description: "Dokumen menunggu konfirmasi", to: "/pengadaan" },
    { label: "Evaluasi tersimpan", value: state.snapshots.length, description: "Hasil evaluasi tersimpan", to: "/riwayat" },
  ];
  return (
    <div className="page dashboard-page">
      <dl className="dashboard-overview" aria-label="Ringkasan ruang kerja">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={`dashboard-metric${index === 0 ? " dashboard-metric-featured" : ""}`}>
            <dt>{metric.label}</dt>
            {metric.to && <Link className="dashboard-metric-open" to={metric.to} aria-label={`Lihat ${metric.label.toLocaleLowerCase("id")}`}><ArrowUpRight size={20} aria-hidden="true" /></Link>}
            <dd>{metric.value}</dd>
            <p>{metric.description}</p>
          </div>
        ))}
      </dl>
      <div className="dashboard-grid">
        <section className="panel dashboard-activity" aria-labelledby="dashboard-activity-title">
          <div className="panel-header"><h2 id="dashboard-activity-title">Aktivitas terbaru</h2><ClockCounterClockwise size={21} className="muted" /></div>
          {state.events.length ? (
            <ol>{state.events.slice(0, 4).map((event) => (
              <li key={event.id}>
                <span className="dashboard-activity-icon"><ActivityIcon event={event} size={20} /></span>
                <div><Link to={event.procurementId ? `/pengadaan/${event.procurementId}?tab=riwayat` : "/riwayat"}>{event.summary}</Link><time dateTime={event.createdAt}>{dateTime(event.createdAt)}</time></div>
              </li>
            ))}</ol>
          ) : <Empty title="Belum ada aktivitas">Aktivitas dicatat setelah Anda mulai bekerja.</Empty>}
          <Link className="dashboard-more" to="/riwayat">Lihat riwayat <ArrowRight size={15} /></Link>
        </section>
        <section className="panel dashboard-continue" aria-labelledby="dashboard-continue-title">
          <div className="panel-header"><h2 id="dashboard-continue-title">Lanjutkan pengadaan</h2><Link className="dashboard-circle-link" to="/pengadaan?baru=1" aria-label="Tambah pengadaan"><Plus size={18} /></Link></div>
          {state.procurements.length ? (
            <ul className="dashboard-procurement-list">
              {state.procurements.slice(0, 3).map((procurement) => (
                <li key={procurement.id}><Link to={`/pengadaan/${procurement.id}`} aria-label={`Lanjutkan ${procurement.name}`}>
                  <span className="dashboard-procurement-icon"><Folder size={20} aria-hidden="true" /></span>
                  <div><strong>{procurement.name}</strong><small>{procurement.number}</small></div>
                </Link></li>
              ))}
            </ul>
          ) : <Empty title="Belum ada pengadaan">Tambahkan pengadaan untuk mulai bekerja.</Empty>}
          <Link className="dashboard-more" to="/pengadaan">Semua pengadaan <ArrowRight size={15} /></Link>
        </section>

      </div>
    </div>
  );
}
