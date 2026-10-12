import { Link } from "react-router";
import type { DocumentRecord } from "../domain/models";

export function OwnerEstimateArchiveNotice({ document }: { document: DocumentRecord }) {
  const removed = !!document.removedAt;
  return (
    <section className="panel">
      <h2>{removed ? "OE telah dihapus" : "OE telah diganti"}</h2>
      <p>Dokumen ini disimpan sebagai jejak sumber dan tidak digunakan untuk evaluasi berikutnya.</p>
      <Link className="btn" to={removed ? `/pengadaan/${document.procurementId}?tab=dokumen` : `/pengadaan/${document.procurementId}/review/${document.supersededBy}`}>
        {removed ? "Unggah OE baru" : "Buka OE terbaru"}
      </Link>
    </section>
  );
}
