import "../../shared/styles/focus.css";
import { Modal } from "../../shared/ui/feedback";
import type { useReview } from "./useReview";
export function ReviewLeaveDialog({ busy, leave, setLeave, setDirty, blocker, leavePage, save }: Pick<ReturnType<typeof useReview>, "busy" | "leave" | "setLeave" | "setDirty" | "blocker" | "leavePage" | "save">) {
  return (
    <Modal
      open={leave || blocker.state === "blocked"}
      onOpenChange={(value) => {
        setLeave(value);
        if (!value && blocker.state === "blocked") blocker.reset();
      }}
      title="Perubahan belum disimpan"
      description="Simpan koreksi sebelum meninggalkan halaman, atau buang perubahan yang belum tersimpan."
    >
      <div className="modal-actions">
        <button
          className="btn quiet"
          onClick={() => {
            setLeave(false);
            if (blocker.state === "blocked") blocker.reset();
          }}
        >
          Tetap di halaman
        </button>
        <button
          className="btn"
          onClick={() => {
            setDirty(false);
            if (blocker.state === "blocked") blocker.proceed();
            else setTimeout(leavePage, 0);
          }}
        >
          Buang perubahan
        </button>
        <button
          className="btn primary"
          disabled={busy}
          onClick={async () => {
            if (await save()) setTimeout(leavePage, 0);
          }}
        >
          Simpan & kembali
        </button>
      </div>
    </Modal>
  );
}
