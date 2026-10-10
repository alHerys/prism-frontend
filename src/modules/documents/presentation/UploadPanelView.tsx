import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import { ErrorState } from "../../../shared/ui/error-state";
import { LoadingState } from "../../../shared/ui/loading-state";
import { UploadZone } from "../../../shared/ui/upload-zone";
import type { UploadPanelModel } from "./view-models";

export function UploadPanelView({ scope, embedded, kind, setKind, busy, processing, failure, upload }: UploadPanelModel) {

  return (
    <section className={`fernly-upload ${embedded ? "upload-panel-embedded" : "panel"}`} aria-busy={busy}>
      <div className="panel-header">
        <div>
          <h2>{scope === "procurement" ? "Unggah Owner Estimate (OE)" : "Unggah dokumen"}</h2>
          <p>{scope === "vendor" ? "Pilih Form A5 atau penawaran untuk vendor ini." : "Owner Estimate ditautkan ke seluruh pengadaan."}</p>
        </div>
        <span className="badge">PDF / XLSX · maks. 10 MiB</span>
      </div>
      <div className="upload-document-options">{scope === "vendor" ? (
        <div className="field document-kind-field">
          <span className="field-label">Jenis dokumen</span>
          <div className="document-kind-actions" role="group" aria-label="Jenis dokumen">
            <button type="button" className={`btn ${kind === "FORM_A5" ? "selected" : ""}`} aria-pressed={kind === "FORM_A5"} disabled={busy} onClick={() => setKind("FORM_A5")}>Form A5 · PDF</button>
            <button type="button" className={`btn ${kind === "OFFER" ? "selected" : ""}`} aria-pressed={kind === "OFFER"} disabled={busy} onClick={() => setKind("OFFER")}>Penawaran vendor · XLSX</button>
          </div>
        </div>
      ) : (
        <div className="procurement-document-kind">
          <span>Jenis dokumen</span>
          <strong>Owner Estimate · XLSX</strong>
        </div>
      )}</div>
      <UploadZone
        ariaLabel="Pilih berkas dokumen"
        accept={kind === "FORM_A5" ? ".pdf" : ".xlsx"}
        disabled={busy}
        onFiles={(files) => {
          if (files[0]) void upload(files[0]);
        }}
      >
        <p>
          <strong>
            {busy
              ? `${processing}…`
              : "Tarik dokumen ke sini atau pilih berkas"}
          </strong>
        </p>
        <small>Dokumen akan diperiksa sebelum digunakan untuk evaluasi.</small>
        {busy && <LoadingState label={processing} />}
      </UploadZone>
      {failure && (
        <ErrorState
          message={`${failure} Pilih berkas kembali untuk mencoba ulang.`}
        />
      )}
    </section>
  );
}
