import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import { ErrorState } from "../../../shared/ui/error-state";
import { LoadingState } from "../../../shared/ui/loading-state";
import { UploadZone } from "../../../shared/ui/upload-zone";
import type { UploadPanelModel } from "./view-models";
import { OwnerEstimateDocument } from "./OwnerEstimateDocument";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { Modal } from "../../../shared/ui/modal";
import { OwnerEstimateRemoval } from "./OwnerEstimateRemoval";

export function UploadPanelView({ scope, embedded, kind, setKind, busy, processing, failure, upload, currentDocument, replacing, beginReplacement, cancelReplacement, removalTarget, removalFailure, requestRemoval, cancelRemoval, removeOwnerEstimate }: UploadPanelModel) {

  const title = scope === "vendor" ? "Unggah dokumen" : currentDocument ? "Owner Estimate (OE)" : "Unggah Owner Estimate (OE)";
  const uploadContent = <div className="upload-panel-content">
    <UploadZone
      ariaLabel={currentDocument ? "Pilih berkas OE terbaru" : "Pilih berkas dokumen"}
      accept={kind === "FORM_A5" ? ".pdf" : ".xlsx"}
      disabled={busy}
      onFiles={files => { if (files[0]) void upload(files[0]); }}
    >
      <p><strong>{busy ? `${processing}…` : "Tarik dokumen ke sini atau pilih berkas"}</strong></p>
      <small>Dokumen akan diperiksa sebelum digunakan untuk evaluasi.</small>
      {busy && <LoadingState label={processing} />}
    </UploadZone>
    {failure && <ErrorState message={`${failure} Pilih berkas kembali untuk mencoba ulang.`} />}
  </div>;

  return (
    <section className={`fernly-upload ${embedded ? "upload-panel-embedded" : "panel"}`} aria-busy={busy}>
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{scope === "vendor" ? "Pilih Form A5 atau penawaran untuk vendor ini." : "Owner Estimate ditautkan ke seluruh pengadaan."}</p>
        </div>
        {scope === "vendor" && <span className="badge">PDF / XLSX · maks. 10 MiB</span>}
      </div>
      {currentDocument && <OwnerEstimateDocument document={currentDocument} busy={busy} onReplace={beginReplacement} />}
      {scope === "vendor" && <div className="upload-document-options">
        <div className="field document-kind-field">
          <span className="field-label">Jenis dokumen</span>
          <div className="document-kind-actions" role="group" aria-label="Jenis dokumen">
            <button type="button" className={`btn ${kind === "FORM_A5" ? "selected" : ""}`} aria-pressed={kind === "FORM_A5"} disabled={busy} onClick={() => setKind("FORM_A5")}>Form A5 · PDF</button>
            <button type="button" className={`btn ${kind === "OFFER" ? "selected" : ""}`} aria-pressed={kind === "OFFER"} disabled={busy} onClick={() => setKind("OFFER")}>Penawaran vendor · XLSX</button>
          </div>
        </div>
      </div>}
      {!currentDocument && uploadContent}
      <Modal className="owner-estimate-edit" open={replacing} onOpenChange={open => { if (!open) cancelReplacement(); }} title="Edit Owner Estimate (OE)"
        description="Ganti berkas XLSX atau hapus OE. Berkas baru perlu dikonfirmasi.">
        {uploadContent}
        <div className="modal-actions owner-estimate-edit-actions">
          <button type="button" className="btn danger" disabled={busy} onClick={requestRemoval}><Trash size={17} aria-hidden="true" /> Hapus</button>
          <button type="button" className="btn" disabled={busy} onClick={cancelReplacement}>Tutup</button>
        </div>
      </Modal>
      <OwnerEstimateRemoval removalTarget={removalTarget} removalFailure={removalFailure} busy={busy} cancelRemoval={cancelRemoval} removeOwnerEstimate={removeOwnerEstimate} />
    </section>
  );
}
