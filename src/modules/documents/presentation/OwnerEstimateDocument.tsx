import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import { Link } from "react-router";
import type { DocumentRecord } from "../domain/models";
import { Status } from "../../../shared/ui/status";
import { useWorkspaceTime } from "../../../shared/ui/workspace-time";
import "./owner-estimate.css";

export function OwnerEstimateDocument({ document, busy, replacing, onReplace }: {
  document: DocumentRecord;
  busy: boolean;
  replacing: boolean;
  onReplace: () => void;
}) {
  const dateTime = useWorkspaceTime();
  return (
    <div className="owner-estimate-document">
      <div className="owner-estimate-identity">
        <span className="owner-estimate-symbol"><FileXls size={28} aria-hidden="true" /></span>
        <div>
          <strong>{document.name}</strong>
          <small>Diunggah {dateTime(document.uploadedAt)} · Revisi {document.revision}</small>
        </div>
      </div>
      <Status value={document.status} />
      <div className="owner-estimate-actions">
        <Link className="btn small" to={`/pengadaan/${document.procurementId}/review/${document.id}`}>
          {document.status === "CONFIRMED" ? "Lihat / koreksi" : "Periksa OE"}
        </Link>
        {!replacing && <button type="button" className="btn small" disabled={busy} onClick={onReplace}>Ganti OE</button>}
      </div>
    </div>
  );
}
