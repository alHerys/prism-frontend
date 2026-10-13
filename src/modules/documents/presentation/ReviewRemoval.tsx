import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { Modal } from "../../../shared/ui/modal";
import type { ReviewModel } from "./view-models";

export function ReviewRemoval({ removalTarget, removalFailure, busy, cancelRemoval, removeDocument }: Pick<ReviewModel, "removalTarget" | "removalFailure" | "busy" | "cancelRemoval" | "removeDocument">) {
  const label = removalTarget?.kind === "FORM_A5" ? "Form A5" : "Penawaran Harga";
  return <Modal open={!!removalTarget} onOpenChange={open => { if (!open) cancelRemoval(); }} title={`Hapus ${label}?`} description={`${removalTarget?.name ?? "Dokumen"} akan dilepas dari vendor. Jejak sumber dan hasil evaluasi lama tetap tersimpan.`}>
    {removalFailure && <div className="alert error" role="alert">{removalFailure}</div>}
    <div className="modal-actions">
      <button className="btn" disabled={busy} onClick={cancelRemoval}>Batal</button>
      <button className="btn danger" disabled={busy} onClick={() => void removeDocument()}><Trash size={17} aria-hidden="true" />{busy ? "Menghapus…" : `Hapus ${label}`}</button>
    </div>
  </Modal>;
}
