import { Link } from "react-router";
import type { DocumentRecord } from "../domain/models";

export function OwnerEstimateArchiveNotice({ document }: { document: DocumentRecord }) {
  const removed = !!document.removedAt;
  const label = document.kind === "OE" ? "OE" : document.kind === "FORM_A5" ? "Form A5" : "Penawaran Harga";
  const uploadRoute = `/pengadaan/${document.procurementId}?tab=ringkasan${document.vendorId ? `&vendor=${encodeURIComponent(document.vendorId)}` : ""}`;
  return (
    <section className="panel">
      <h2>{label} telah {removed ? "dihapus" : "diganti"}</h2>
      <p>Dokumen ini disimpan sebagai jejak sumber dan tidak digunakan untuk evaluasi berikutnya.</p>
      <Link className="btn" to={removed ? uploadRoute : `/pengadaan/${document.procurementId}/review/${document.supersededBy}`}>
        {removed ? `Unggah ${label} baru` : `Buka ${label} terbaru`}
      </Link>
    </section>
  );
}
