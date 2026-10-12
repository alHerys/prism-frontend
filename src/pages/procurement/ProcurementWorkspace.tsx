import { useSearchParams } from "react-router";
import { VendorDocumentDialog } from "../../modules/documents/presentation/VendorDocumentDialog";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import type { Procurement, Vendor } from "../../modules/procurement/domain/models";
import type { DocumentRecord } from "../../modules/documents/domain/models";
import { UploadPanel } from "../../modules/documents/presentation/UploadPanel";
import { VendorCollection } from "../../modules/procurement/presentation/VendorCollection";
import { EmptyState } from "../../shared/ui/empty-state";

export function ProcurementWorkspace({ procurement, documents, vendors, onAddVendor }: {
  procurement: Procurement;
  documents: DocumentRecord[];
  vendors: Vendor[];
  onAddVendor: () => void;
}) {
  const [params, setParams] = useSearchParams();
  const selectedVendor = vendors.find(vendor => vendor.id === params.get("vendor"));
  const closeDocuments = () => {
    const next = new URLSearchParams(params);
    next.delete("vendor");
    setParams(next);
  };
  return (
    <div className="procurement-summary-layout">
      {selectedVendor && <VendorDocumentDialog key={selectedVendor.id} vendor={selectedVendor} documents={documents}
        onClose={closeDocuments} />}
      <UploadPanel procurementId={procurement.id} scope="procurement" />
      <section className="panel stage-vendors">
        <VendorCollection vendors={vendors} documents={documents}
          heading={{ title: "Identitas & vendor", description: "Tambahkan vendor dan periksa dokumennya sebelum evaluasi." }}
          actions={<button type="button" className="btn primary" onClick={onAddVendor}><Plus size={18} aria-hidden="true" /> Tambah vendor</button>}
          empty={<EmptyState title="Belum ada vendor">Tambahkan vendor untuk mengunggah Form A5 dan penawaran harga.</EmptyState>} />
      </section>
    </div>
  );
}
