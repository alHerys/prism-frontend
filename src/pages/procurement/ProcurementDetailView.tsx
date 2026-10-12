import { ResultPanel } from "../../modules/evaluations/presentation/ResultPanel";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Link } from "react-router";
import { useWorkspaceTime } from "../../shared/ui/workspace-time";
import "../../shared/styles/focus.css";
import { EmptyState as Empty } from "../../shared/ui/empty-state";
import { Modal } from "../../shared/ui/modal";
import { HEAPanel } from "../../modules/hea/presentation/HEAPanel";
import { PDPanel } from "../../modules/price-deviation/presentation/PDPanel";
import type { ProcurementDetailModel } from "./view-models";
import { ProcurementWorkspace } from "./ProcurementWorkspace";
import "./procurement.css";

export function ProcurementDetailView({ state, setParams, tab, p, vendorOpen, setVendorOpen, vendorName, setVendorName, docs, vendors, results, addVendor }: ProcurementDetailModel) {
  const dateTime = useWorkspaceTime();
  if (!p) return <div className="page"><Empty title="Pengadaan tidak ditemukan">Kembali ke <Link to="/pengadaan">daftar pengadaan</Link>.</Empty></div>;
  const confirmed = docs.filter((document) => document.status === "CONFIRMED").length;
  const stages = [
    { value: "ringkasan", label: "Identitas & vendor", detail: `${vendors.length} vendor · ${confirmed}/${docs.length} dokumen terkonfirmasi`, current: tab === "ringkasan" },
    { value: "hea", label: "Evaluasi", detail: "HEA atau Harga Timpang", current: tab === "hea" || tab === "harga" },
    { value: "riwayat", label: "Hasil & jejak sumber", detail: `${results.length} hasil tersimpan`, current: tab === "riwayat" },
  ];
  return (
    <div className="page procurement-detail-page">
      <nav className="procurement-path" aria-label="Tahap pengadaan">
        {stages.map((stage, index) => (
          <button key={stage.value} className={stage.current ? "current" : ""} aria-current={stage.current ? "step" : undefined} onClick={() => setParams({ tab: stage.value })}>
            <span>{index + 1}</span><div>{stage.label}<small>{stage.detail}</small></div>
          </button>
        ))}
      </nav>
      <div className="procurement-stage-content">
        {tab === "ringkasan" && <>
          <ProcurementWorkspace procurement={p} documents={docs} vendors={vendors} onAddVendor={() => setVendorOpen(true)} />
          <div className="stage-navigation"><button className="btn primary" onClick={() => setParams({ tab: "hea" })}>Lanjut ke evaluasi <ArrowRight /></button></div>
        </>}
        {(tab === "hea" || tab === "harga") && <>
          <div className="procurement-evaluation-heading"><div><h2>Evaluasi pengadaan</h2><p>Gunakan dokumen dan nilai yang telah diperiksa evaluator.</p></div><div className="evaluation-switch" role="group" aria-label="Pilih modul evaluasi"><button className={tab === "hea" ? "selected" : ""} aria-pressed={tab === "hea"} onClick={() => setParams({ tab: "hea" })}>HEA</button><button className={tab === "harga" ? "selected" : ""} aria-pressed={tab === "harga"} onClick={() => setParams({ tab: "harga" })}>Harga Timpang</button></div></div>
          {tab === "hea" ? <HEAPanel procurement={p} ResultView={ResultPanel} /> : <PDPanel procurement={p} ResultView={ResultPanel} />}
          <div className="stage-navigation"><button className="btn" onClick={() => setParams({ tab: "ringkasan" })}>Kembali ke identitas & vendor</button><button className="btn primary" onClick={() => setParams({ tab: "riwayat" })}>Lihat hasil & riwayat <ArrowRight /></button></div>
        </>}
        {tab === "riwayat" && <>
          <div className="procurement-history-layout">
            <section className="panel procurement-results"><div className="panel-header"><div><h2>Hasil evaluasi tersimpan</h2><p>Input dan sumber tersimpan bersama hasil evaluasi.</p></div><span className="badge">{results.length} hasil</span></div>
              {results.length ? results.map((snapshot) => <div className="procurement-snapshot-row" key={snapshot.id}><span className="procurement-result-symbol"><FileText size={22} /></span><div><strong>{snapshot.module === "HEA" ? "HEA / Leaderboard" : "Harga Timpang"}</strong><small>{dateTime(snapshot.createdAt)}</small><span className={`badge ${snapshot.status === "COMPLETE" ? "success" : "warning"}`}>{snapshot.status === "COMPLETE" ? "Lengkap" : "Parsial"}</span></div><button className="btn small" onClick={() => setParams({ tab: snapshot.module === "HEA" ? "hea" : "harga", hasil: snapshot.id })}>Buka hasil <ArrowRight size={15} /></button></div>) : <Empty title="Belum ada hasil evaluasi">Hasil muncul setelah data dikonfirmasi dan evaluasi dijalankan.</Empty>}
            </section>
            <section className="panel procurement-event-panel"><div className="panel-header"><h2>Riwayat pengadaan</h2></div><ol className="procurement-events">{state.events.filter((event) => event.procurementId === p.id).map((event) => <li key={event.id}><div><strong>{event.summary}</strong><small>{dateTime(event.createdAt)}</small></div><span className="badge">{event.type === "CONFIRMED" ? "Konfirmasi" : event.type === "EXPORTED" ? "Ekspor" : event.type === "EVALUATED" ? "Evaluasi" : "Aktivitas"}</span></li>)}</ol></section>
          </div>
          <div className="stage-navigation"><button className="btn" onClick={() => setParams({ tab: "hea" })}>Kembali ke evaluasi</button></div>
        </>}
        <Modal open={vendorOpen} onOpenChange={setVendorOpen} title="Tambah vendor">
          <form onSubmit={addVendor}><div className="field"><label htmlFor="vendorName">Nama badan usaha</label><input id="vendorName" value={vendorName} onChange={(event) => setVendorName(event.target.value)} required maxLength={256} /></div><div className="modal-actions"><button type="button" className="btn" onClick={() => setVendorOpen(false)}>Batal</button><button className="btn primary">Tambah vendor</button></div></form>
        </Modal>
      </div>
    </div>
  );
}
