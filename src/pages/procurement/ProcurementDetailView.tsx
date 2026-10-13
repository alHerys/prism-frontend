import { ResultPanel } from "../../modules/evaluations/presentation/ResultPanel";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { Link } from "react-router";
import "../../shared/styles/focus.css";
import { EmptyState as Empty } from "../../shared/ui/empty-state";
import { Modal } from "../../shared/ui/modal";
import { HEAPanel } from "../../modules/hea/presentation/HEAPanel";
import { PDPanel } from "../../modules/price-deviation/presentation/PDPanel";
import type { ProcurementDetailModel } from "./view-models";
import { ProcurementWorkspace } from "./ProcurementWorkspace";
import "./procurement.css";

export function ProcurementDetailView({ setParams, tab, p, vendorOpen, setVendorOpen, vendorName, setVendorName, docs, vendors, addVendor }: ProcurementDetailModel) {
  if (!p) return <div className="page"><Empty title="Pengadaan tidak ditemukan">Kembali ke <Link to="/pengadaan">daftar pengadaan</Link>.</Empty></div>;
  const stages = [
    { value: "ringkasan", label: "Identitas & vendor", detail: `${vendors.length} vendor`, current: tab === "ringkasan" },
    { value: "hea", label: "Evaluasi", detail: "HEA atau Harga Timpang", current: tab === "hea" || tab === "harga" },
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
          <div className="procurement-evaluation-heading"><div className="evaluation-switch" role="group" aria-label="Pilih modul evaluasi"><button className={tab === "hea" ? "selected" : ""} aria-pressed={tab === "hea"} onClick={() => setParams({ tab: "hea" })}>HEA</button><button className={tab === "harga" ? "selected" : ""} aria-pressed={tab === "harga"} onClick={() => setParams({ tab: "harga" })}>Harga Timpang</button></div></div>
          {tab === "hea" ? <HEAPanel procurement={p} ResultView={ResultPanel} /> : <PDPanel procurement={p} ResultView={ResultPanel} />}
          <div className="stage-navigation"><button className="btn" onClick={() => setParams({ tab: "ringkasan" })}>Kembali ke identitas & vendor</button></div>
        </>}
        <Modal open={vendorOpen} onOpenChange={setVendorOpen} title="Tambah vendor">
          <form onSubmit={addVendor}><div className="field"><label htmlFor="vendorName">Nama badan usaha</label><input id="vendorName" value={vendorName} onChange={(event) => setVendorName(event.target.value)} required maxLength={256} /></div><div className="modal-actions"><button type="button" className="btn" onClick={() => setVendorOpen(false)}>Batal</button><button className="btn primary">Tambah vendor</button></div></form>
        </Modal>
      </div>
    </div>
  );
}
