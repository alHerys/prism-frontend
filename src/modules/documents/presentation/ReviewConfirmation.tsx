import "../../../shared/styles/focus.css";
import { Modal } from "../../../shared/ui/modal";
import type { ReviewModel } from "./view-models";
export function ReviewConfirmation({ busy, confirm, setConfirm, confirmDocument }: Pick<ReviewModel, "busy" | "confirm" | "setConfirm" | "confirmDocument">) {
  return (
    <Modal
      open={confirm}
      onOpenChange={(open) => { if (!busy) setConfirm(open); }}
      title="Konfirmasi data dokumen"
      description="Anda telah memeriksa nilai, sumber, dan peringatan. Data terkonfirmasi akan menjadi input evaluasi."
    >
      <div className="modal-actions">
        <button className="btn" disabled={busy} onClick={() => setConfirm(false)}>
          Kembali memeriksa
        </button>
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => void confirmDocument()}
        >
          {busy ? "Mengonfirmasi…" : "Konfirmasi data"}
        </button>
      </div>
    </Modal>
  );
}
