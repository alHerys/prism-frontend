import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { Link } from "react-router";
import "../../shared/styles/focus.css";
import { EmptyState as Empty } from "../../shared/ui/empty-state";
import { DocumentTable } from "../../modules/documents/presentation/DocumentTable";
import { UploadPanel } from "../../modules/documents/presentation/UploadPanel";
import type { VendorDocumentsModel } from "./view-models";

export function VendorDocumentsView({ id, state, procurement, vendor, backUrl }: VendorDocumentsModel) {
  if (!procurement || !vendor) {
    return (
      <div className="page">
        <Empty title="Vendor tidak ditemukan">
          <Link to={backUrl}>Kembali ke unggah & verifikasi</Link>
        </Empty>
      </div>
    );
  }
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
      </header>
      <main className="focus-content">
        <section className="panel vendor-workspace">
          <UploadPanel procurementId={procurement.id} vendorId={vendor.id} embedded />
          <DocumentTable documents={state.documents.filter((d) => d.procurementId === id && d.vendorId === vendor.id)} embedded />
        </section>
      </main>
    </div>
  );
}
