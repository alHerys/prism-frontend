import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import { Link } from "react-router";
import type { DocumentRecord } from "../domain/models";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { PencilSimple } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { CalendarBlank } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { useWorkspaceTimeParts } from "../../../shared/ui/workspace-time";
import "./owner-estimate.css";

export function OwnerEstimateDocument({ document, busy, onReplace }: {
  document: DocumentRecord;
  busy: boolean;
  onReplace: () => void;
}) {
  const parts = useWorkspaceTimeParts()(document.uploadedAt);
  return (
    <div className="owner-estimate-document">
      <div className="owner-estimate-identity">
        <span className="owner-estimate-symbol"><FileXls size={28} aria-hidden="true" /></span>
        <div>
          <strong>{document.name}</strong>
          <div className="owner-estimate-uploaded" aria-label="Waktu unggah">
            <small><CalendarBlank size={14} aria-hidden="true" /><time dateTime={document.uploadedAt} aria-label={`Tanggal unggah ${parts.date}`}>{parts.date}</time></small>
            <small><Clock size={14} aria-hidden="true" /><time dateTime={document.uploadedAt} aria-label={`Jam unggah ${parts.time}`}>{parts.time}</time></small>
          </div>
        </div>
      </div>
      <div className="owner-estimate-actions">
        <Link className="btn small" aria-disabled={busy || undefined} onClick={event => { if (busy) event.preventDefault(); }} to={`/pengadaan/${document.procurementId}/review/${document.id}`}>
          <Eye size={17} aria-hidden="true" /> Lihat
        </Link>
        <button type="button" className="btn small" disabled={busy} onClick={onReplace}><PencilSimple size={17} aria-hidden="true" /> Ganti OE</button>
      </div>
    </div>
  );
}
