import "../../../shared/styles/focus.css";
import { Modal } from "../../../shared/ui/feedback";
import type { useReview } from "./useReview";
export function ReviewConfirmation({ busy, confirm, setConfirm, confirmDocument }: Pick<ReturnType<typeof useReview>, "busy" | "confirm" | "setConfirm" | "confirmDocument">) {
  return (
    <Modal
      open={confirm}
      onOpenChange={setConfirm}
      title="Konfirmasi data dokumen"
      description="Anda telah memeriksa nilai, sumber, dan peringatan. Data terkonfirmasi akan menjadi input evaluasi."
    >
      <div className="modal-actions">
        <button className="btn" onClick={() => setConfirm(false)}>
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
