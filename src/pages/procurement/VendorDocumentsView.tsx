import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { BuildingOffice } from "@phosphor-icons/react/dist/csr/BuildingOffice";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Link } from "react-router";
import "../../shared/styles/focus.css";
import { EmptyState as Empty } from "../../shared/ui/empty-state";
import { DocumentTable } from "../../modules/documents/presentation/DocumentTable";
import { UploadPanel } from "../../modules/documents/presentation/UploadPanel";
import type { VendorDocumentsModel } from "./view-models";
import "./procurement.css";

export function VendorDocumentsView({ id, state, procurement, vendor, backUrl }: VendorDocumentsModel) {
  if (!procurement || !vendor) {
    return (
      <main className="page focus-recovery">
        <Empty title="Vendor tidak ditemukan" headingLevel={1}>
          <Link to={backUrl}>Kembali ke unggah & verifikasi</Link>
        </Empty>
      </main>
    );
  }
  const documents = state.documents.filter((document) => document.procurementId === id && document.vendorId === vendor.id);
  const confirmed = documents.filter((document) => document.status === "CONFIRMED").length;
  return (
    <div className="focus-shell vendor-focus-shell">
      <header className="focus-head">
        <div className="review-header-context">
          <Link className="btn quiet review-back" to={backUrl} aria-label="Kembali ke tahap Unggah & verifikasi">
            <ArrowLeft /> Kembali
          </Link>
          <div className="review-heading">
            <h1>{vendor.name}</h1>
            <p>{procurement.number} · {procurement.name}</p>
          </div>
        </div>
        <span className="vendor-focus-owner"><BuildingOffice size={18} aria-hidden="true" /> Ruang dokumen vendor</span>
      </header>
      <main className="focus-content">
        <div className="vendor-document-summary" aria-label="Ringkasan dokumen vendor">
          <p>Unggah dan periksa dokumen milik vendor ini sebelum evaluasi.</p>
          <div><span><FileText size={17} aria-hidden="true" /> {documents.length} dokumen</span><span><CheckCircle size={17} aria-hidden="true" /> {confirmed} terkonfirmasi</span></div>
        </div>
        <div className="vendor-workspace-layout">
          <section className="panel vendor-upload-workspace"><UploadPanel procurementId={procurement.id} vendorId={vendor.id} embedded /></section>
          <section className="panel vendor-document-workspace"><DocumentTable documents={documents} embedded /></section>
        </div>
      </main>
    </div>
  );
}
