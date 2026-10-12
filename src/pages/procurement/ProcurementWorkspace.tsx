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
  return (
    <div className="procurement-summary-layout">
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
