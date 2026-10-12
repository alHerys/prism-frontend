import { X } from "@phosphor-icons/react/dist/csr/X";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import "./review-leave-dialog.css";
import "../../../shared/styles/focus.css";
import { Modal } from "../../../shared/ui/modal";
import type { ReviewModel } from "./view-models";
export function ReviewLeaveDialog({ busy, leave, setLeave, setDirty, blocker, leavePage, save }: Pick<ReviewModel, "busy" | "leave" | "setLeave" | "setDirty" | "blocker" | "leavePage" | "save">) {
  return (
    <Modal
      className="review-leave-dialog"
      open={leave || blocker.state === "blocked"}
      onOpenChange={(value) => {
        setLeave(value);
        if (!value && blocker.state === "blocked") blocker.reset();
      }}
      title="Perubahan belum disimpan"
      description="Simpan atau buang koreksi sebelum keluar."
    >
      <button
        type="button"
        className="icon-button review-leave-close"
        aria-label="Tutup dialog"
        onClick={() => {
          setLeave(false);
          if (blocker.state === "blocked") blocker.reset();
        }}
      >
        <X size={20} aria-hidden="true" />
      </button>
      <div className="modal-actions">
        <button
          className="btn danger"
          onClick={() => {
            setDirty(false);
            if (blocker.state === "blocked") blocker.proceed();
            else setTimeout(leavePage, 0);
          }}
        >
          <Trash aria-hidden="true" /> Buang perubahan
        </button>
        <button
          className="btn primary"
          disabled={busy}
          onClick={async () => {
            if (await save()) setTimeout(leavePage, 0);
          }}
        >
          Simpan
        </button>
      </div>
    </Modal>
  );
}
