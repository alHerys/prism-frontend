import { useState } from "react";
import { Link } from "react-router";
import { FilePdf } from "@phosphor-icons/react/dist/csr/FilePdf";
import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { Modal } from "../../../shared/ui/modal";
import { UploadZone } from "../../../shared/ui/upload-zone";
import { ErrorState } from "../../../shared/ui/error-state";
import { LoadingState } from "../../../shared/ui/loading-state";
import { useWorkspaceTime } from "../../../shared/ui/workspace-time";
import type { Vendor } from "../../procurement/domain/models";
import type { DocumentRecord } from "../domain/models";
import { OESheetChoice } from "./OESheetChoice";
import { useUploadPanel } from "./useUploadPanel";
import "../../../shared/styles/fernly-evaluation.css";
import "./owner-estimate.css";
import "./vendor-document-dialog.css";

function DocumentSlot({ vendor, kind, document, busy, onBusyChange }: {
  vendor: Vendor;
  kind: "FORM_A5" | "OFFER";
  document?: DocumentRecord;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const model = useUploadPanel({ procurementId: vendor.procurementId, vendorId: vendor.id, initialKind: kind });
  const dateTime = useWorkspaceTime();
  const title = kind === "FORM_A5" ? "Form A5" : "Penawaran Harga";
  const Icon = kind === "FORM_A5" ? FilePdf : FileXls;
  async function upload(file: File) {
    if (busy) return;
    onBusyChange(true);
    try { await model.upload(file); } finally { onBusyChange(false); }
  }
  return <section className="vendor-document-slot" aria-label={title} aria-busy={model.busy}>
    <h3>{title}</h3>
    <p className="vendor-document-purpose">{kind === "FORM_A5" ? "PDF untuk perhitungan HEA" : "XLSX untuk perhitungan Harga Timpang"}</p>
    {document ? <Link className="vendor-document-preview" to={`/pengadaan/${vendor.procurementId}/review/${document.id}`} aria-label={`Buka ${title}`} aria-disabled={busy || undefined} onClick={event => { if (busy) event.preventDefault(); }}>
      <div className="vendor-document-cover"><Icon size={64} weight="duotone" aria-hidden="true" /></div>
      <div className="vendor-document-caption">
        <strong>{document.name}</strong>
        <small>Diunggah {dateTime(document.uploadedAt)}</small>
        <span>Buka <ArrowRight size={17} aria-hidden="true" /></span>
      </div>
    </Link> : <div className="upload-panel-content">
      {model.offerChoice ? <OESheetChoice key={model.offerChoice.id} label="Penawaran" choice={model.offerChoice} busy={busy || model.busy} onChoose={async id => { onBusyChange(true); try { await model.chooseOfferSheet(id); } finally { onBusyChange(false); } }} onCancel={model.cancelOfferImport} /> : <UploadZone ariaLabel={`Unggah ${title}`} accept={kind === "FORM_A5" ? ".pdf" : ".xlsx"} disabled={busy}
        onFiles={files => { if (files[0]) void upload(files[0]); }}>
        <p><strong>{model.busy ? `${model.processing}…` : `Unggah ${title}`}</strong></p>
        <small>Tarik berkas ke sini atau pilih berkas. Maks. 10 MiB.</small>
        {model.busy && <LoadingState label={model.processing} />}
      </UploadZone>}
      {model.failure && <ErrorState message={`${model.failure} Pilih berkas kembali untuk mencoba ulang.`} />}
    </div>}
  </section>;
}

export function VendorDocumentDialog({ vendor, documents, onClose }: {
  vendor: Vendor;
  documents: DocumentRecord[];
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const active = documents.filter(document => document.procurementId === vendor.procurementId && document.vendorId === vendor.id && !document.removedAt && !document.supersededBy).reverse();
  return <Modal className="vendor-document-dialog" open onOpenChange={open => { if (!open && !busy) onClose(); }}
    title="Pilih Dokumen">
    <button type="button" className="icon-button vendor-document-close" aria-label="Tutup dokumen vendor" disabled={busy} onClick={onClose}><X size={22} aria-hidden="true" /></button>
    <div className="vendor-document-slots">
      {(["FORM_A5", "OFFER"] as const).map(kind => <DocumentSlot key={kind} vendor={vendor} kind={kind}
        document={active.find(document => document.kind === kind)} busy={busy} onBusyChange={setBusy} />)}
    </div>
  </Modal>;
}
