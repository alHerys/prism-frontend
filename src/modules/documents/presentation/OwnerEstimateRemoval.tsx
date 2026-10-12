import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { Modal } from "../../../shared/ui/modal";
import { ErrorState } from "../../../shared/ui/error-state";
import type { UploadPanelModel } from "./view-models";

export function OwnerEstimateRemoval({ removalTarget, removalFailure, busy, cancelRemoval, removeOwnerEstimate }: Pick<UploadPanelModel, "removalTarget" | "removalFailure" | "busy" | "cancelRemoval" | "removeOwnerEstimate">) {
  return (
    <Modal open={!!removalTarget} onOpenChange={open => { if (!open) cancelRemoval(); }} title="Hapus OE?"
      description={`${removalTarget?.name ?? "Dokumen OE"} akan dilepas dari pengadaan. Sumber dan hasil evaluasi lama tetap tersimpan. Unggah OE baru untuk melanjutkan evaluasi.`}>
      {removalFailure && <ErrorState message={removalFailure} />}
      <div className="modal-actions">
        <button type="button" className="btn" disabled={busy} onClick={cancelRemoval}>Batal</button>
        <button type="button" className="btn danger" disabled={busy} onClick={() => void removeOwnerEstimate()}><Trash size={17} aria-hidden="true" />{busy ? "Menghapus…" : "Hapus OE"}</button>
      </div>
    </Modal>
  );
}
