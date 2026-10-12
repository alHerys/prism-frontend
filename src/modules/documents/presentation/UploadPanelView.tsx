import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import { ErrorState } from "../../../shared/ui/error-state";
import { LoadingState } from "../../../shared/ui/loading-state";
import { UploadZone } from "../../../shared/ui/upload-zone";
import type { UploadPanelModel } from "./view-models";
import { OwnerEstimateDocument } from "./OwnerEstimateDocument";

export function UploadPanelView({ scope, embedded, kind, setKind, busy, processing, failure, upload, currentDocument, replacing, beginReplacement, cancelReplacement }: UploadPanelModel) {

  const title = scope === "vendor" ? "Unggah dokumen" : currentDocument ? "Owner Estimate (OE)" : "Unggah Owner Estimate (OE)";
  const showUpload = !currentDocument || replacing;

  return (
    <section className={`fernly-upload ${embedded ? "upload-panel-embedded" : "panel"}`} aria-busy={busy}>
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{scope === "vendor" ? "Pilih Form A5 atau penawaran untuk vendor ini." : "Owner Estimate ditautkan ke seluruh pengadaan."}</p>
        </div>
        {scope === "vendor" && <span className="badge">PDF / XLSX · maks. 10 MiB</span>}
      </div>
      {currentDocument && <OwnerEstimateDocument document={currentDocument} busy={busy} replacing={replacing} onReplace={beginReplacement} />}
      {scope === "vendor" && <div className="upload-document-options">
        <div className="field document-kind-field">
          <span className="field-label">Jenis dokumen</span>
          <div className="document-kind-actions" role="group" aria-label="Jenis dokumen">
            <button type="button" className={`btn ${kind === "FORM_A5" ? "selected" : ""}`} aria-pressed={kind === "FORM_A5"} disabled={busy} onClick={() => setKind("FORM_A5")}>Form A5 · PDF</button>
            <button type="button" className={`btn ${kind === "OFFER" ? "selected" : ""}`} aria-pressed={kind === "OFFER"} disabled={busy} onClick={() => setKind("OFFER")}>Penawaran vendor · XLSX</button>
          </div>
        </div>
      </div>}
      {showUpload && (
        <div className={currentDocument ? "owner-estimate-replacement" : undefined}>
          {currentDocument && (
            <p>Unggah OE terbaru untuk mengganti dokumen ini. OE baru perlu diperiksa dan dikonfirmasi kembali.</p>
          )}
          <UploadZone
            ariaLabel={currentDocument ? "Pilih berkas OE terbaru" : "Pilih berkas dokumen"}
            accept={kind === "FORM_A5" ? ".pdf" : ".xlsx"}
            disabled={busy}
            onFiles={(files) => {
              if (files[0]) void upload(files[0]);
            }}
          >
            <p><strong>{busy ? `${processing}…` : "Tarik dokumen ke sini atau pilih berkas"}</strong></p>
            <small>Dokumen akan diperiksa sebelum digunakan untuk evaluasi.</small>
            {busy && <LoadingState label={processing} />}
          </UploadZone>
          {currentDocument && (
            <button type="button" className="btn small" disabled={busy} onClick={cancelReplacement}>Batal mengganti</button>
          )}
        </div>
      )}
      {failure && (
        <ErrorState
          message={`${failure} Pilih berkas kembali untuk mencoba ulang.`}
        />
      )}
    </section>
  );
}
