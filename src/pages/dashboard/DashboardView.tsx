import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Link } from "react-router";
import { dateTime, kindLabel } from "../../shared/formatting/display";
import { EmptyState as Empty } from "../../shared/ui/empty-state";
import { HeaderAction } from "../../shared/ui/header-action";
import { ProcurementTable } from "../../modules/procurement/presentation/ProcurementTable";
import type { DashboardModel } from "./view-models";
import "./dashboard.css";

export function DashboardView({ state, pending }: DashboardModel) {
  const confirmed = state.documents.length - pending.length;
  const distribution = (["FORM_A5", "OE", "OFFER", "HISTORICAL_OE"] as const).map((kind) => {
    const documents = state.documents.filter((document) => document.kind === kind);
    return {
      kind,
      total: documents.length,
      confirmed: documents.filter((document) => document.status === "CONFIRMED").length,
      pending: documents.filter((document) => document.status !== "CONFIRMED").length,
    };
  });
  const maximum = Math.max(1, ...distribution.map((item) => item.total));
  const metrics = [
    { label: "Pengadaan aktif", value: state.procurements.length, description: "Pengadaan dalam ruang kerja", to: "/pengadaan" },
    { label: "Dokumen", value: state.documents.length, description: `${confirmed} dokumen terkonfirmasi`, to: "/pengadaan" },
    { label: "Perlu ditinjau", value: pending.length, description: "Menunggu pemeriksaan evaluator", to: "/pengadaan" },
    { label: "Evaluasi tersimpan", value: state.snapshots.length, description: "Hasil beserta input dan sumber", to: "/riwayat" },
  ];
  return (
    <div className="page dashboard-page">
      <HeaderAction>
        <Link className="btn primary" to="/pengadaan?baru=1"><Plus size={18} /> Tambah pengadaan</Link>
        <Link className="btn" to="/riwayat">Buka riwayat</Link>
      </HeaderAction>
      <dl className="dashboard-overview" aria-label="Ringkasan ruang kerja">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={`dashboard-metric${index === 0 ? " dashboard-metric-featured" : ""}`}>
            <dt>{metric.label}</dt>
            <Link className="dashboard-metric-open" to={metric.to} aria-label={`Lihat ${metric.label.toLocaleLowerCase("id")}`}><ArrowUpRight size={20} aria-hidden="true" /></Link>
            <dd>{metric.value}</dd>
            <p>{metric.description}</p>
          </div>
        ))}
      </dl>
      <div className="dashboard-grid">
        <section className="panel dashboard-distribution" aria-labelledby="dashboard-distribution-title">
          <div className="panel-header">
            <div><h2 id="dashboard-distribution-title">Status dokumen</h2><p>Dokumen menurut jenis dan hasil pemeriksaan.</p></div>
            <span className="dashboard-total">{state.documents.length}<small>dokumen</small></span>
          </div>
          <div className="dashboard-chart-legend"><span><i className="confirmed" /> Terkonfirmasi</span><span><i className="pending" /> Perlu ditinjau</span></div>
          <ul className="dashboard-document-chart" aria-label="Distribusi status dokumen">
            {distribution.map((item) => (
              <li key={item.kind}>
                <div className="dashboard-chart-label"><span>{kindLabel[item.kind]}</span><strong>{item.total}</strong></div>
                <div className="dashboard-chart-track" role="img" aria-label={`${kindLabel[item.kind]}: ${item.confirmed} terkonfirmasi, ${item.pending} perlu ditinjau`}>
                  <span className="confirmed" style={{ width: `${item.confirmed / maximum * 100}%` }} />
                  <span className="pending" style={{ width: `${item.pending / maximum * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel dashboard-review" aria-labelledby="dashboard-review-title">
          <div className="panel-header"><div><h2 id="dashboard-review-title">Perlu ditinjau</h2><p>{pending.length} dokumen menunggu keputusan.</p></div></div>
          {pending.length ? (
            <div className="dashboard-review-list">
              {pending.slice(0, 3).map((document) => (
                <Link key={document.id} className="dashboard-review-row" to={`/pengadaan/${document.procurementId}/review/${document.id}`}>
                  <span className="document-icon"><FileText size={20} aria-hidden="true" /></span>
                  <div><strong>{document.name}</strong><small>{kindLabel[document.kind]}</small></div>
                  <CaretRight size={16} aria-hidden="true" />
                </Link>
              ))}
              <Link className="btn primary dashboard-review-action" to={`/pengadaan/${pending[0].procurementId}/review/${pending[0].id}`}>Mulai pemeriksaan <ArrowRight size={17} /></Link>
            </div>
          ) : <Empty title="Semua dokumen telah ditinjau">Unggah dokumen baru untuk melanjutkan evaluasi.</Empty>}
        </section>
        <section className="panel dashboard-continue" aria-labelledby="dashboard-continue-title">
          <div className="panel-header"><h2 id="dashboard-continue-title">Lanjutkan pekerjaan</h2><Link className="dashboard-circle-link" to="/pengadaan?baru=1" aria-label="Tambah pengadaan"><Plus size={18} /></Link></div>
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
        <section className="panel dashboard-activity" aria-labelledby="dashboard-activity-title">
          <div className="panel-header"><h2 id="dashboard-activity-title">Aktivitas terbaru</h2><ClockCounterClockwise size={21} className="muted" /></div>
          {state.events.length ? (
            <ol>{state.events.slice(0, 4).map((event) => (
              <li key={event.id}><Link to={event.procurementId ? `/pengadaan/${event.procurementId}?tab=riwayat` : "/riwayat"}>{event.summary}</Link><small>{dateTime(event.createdAt)}</small></li>
            ))}</ol>
          ) : <Empty title="Belum ada aktivitas">Aktivitas dicatat setelah Anda mulai bekerja.</Empty>}
          <Link className="dashboard-more" to="/riwayat">Lihat riwayat <ArrowRight size={15} /></Link>
        </section>
        <section className="panel dashboard-procurements" aria-labelledby="dashboard-procurements-title">
          <div className="panel-header"><div><h2 id="dashboard-procurements-title">Pengadaan</h2><p>Temukan pengadaan dan lanjutkan evaluasi.</p></div><Link className="btn" to="/pengadaan?baru=1"><Plus size={17} /> Tambah pengadaan</Link></div>
          <ProcurementTable items={state.procurements} searchLabel="Cari pengadaan pada ringkasan" />
        </section>
      </div>
    </div>
  );
}
