import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import type { Procurement, Vendor } from "../../modules/procurement/domain/models";
import type { DocumentRecord } from "../../modules/documents/domain/models";
import { UploadPanel } from "../../modules/documents/presentation/UploadPanel";
import { VendorCollection } from "../../modules/procurement/presentation/VendorCollection";
import { EmptyState } from "../../shared/ui/empty-state";
import { useWorkspaceTime } from "../../shared/ui/workspace-time";

export function ProcurementWorkspace({ procurement, documents, vendors, resultCount, onAddVendor }: {
  procurement: Procurement;
  documents: DocumentRecord[];
  vendors: Vendor[];
  resultCount: number;
  onAddVendor: () => void;
}) {
  const dateTime = useWorkspaceTime();
  return (
    <div className="procurement-summary-layout">
      <section className="panel procurement-identity" aria-labelledby="procurement-identity-title">
        <h2 id="procurement-identity-title">Identitas pengadaan</h2>
        <dl>
          <div><dt>Nomor pengadaan</dt><dd>{procurement.number}</dd></div>
          <div><dt>Fungsi / unit kerja</dt><dd>{procurement.functionName}</dd></div>
          <div><dt>Dibuat</dt><dd>{dateTime(procurement.createdAt)}</dd></div>
        </dl>
        <div className="procurement-identity-summary">
          <span>{vendors.length}<small>Vendor</small></span>
          <span>{documents.length}<small>Dokumen</small></span>
          <span>{resultCount}<small>Hasil</small></span>
        </div>
      </section>
      <div className="procurement-vendor-column">
        <section className="panel stage-vendors">
          <VendorCollection vendors={vendors} documents={documents}
            heading={{ title: "Identitas & vendor", description: "Tambahkan vendor dan periksa dokumennya sebelum evaluasi." }}
            actions={<button type="button" className="btn primary" onClick={onAddVendor}><Plus size={18} aria-hidden="true" /> Tambah vendor</button>}
            empty={<EmptyState title="Belum ada vendor">Tambahkan vendor untuk mengunggah Form A5 dan penawaran harga.</EmptyState>} />
        </section>
        <UploadPanel procurementId={procurement.id} scope="procurement" />
      </div>
    </div>
  );
}
