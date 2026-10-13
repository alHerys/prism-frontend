import "../../../shared/styles/focus.css";
import { Modal } from "../../../shared/ui/modal";
import type { ReviewModel } from "./view-models";
export function ReviewConfirmation({ d, ack, setAck, busy, confirm, setConfirm, confirmDocument }: Pick<ReviewModel, "d" | "ack" | "setAck" | "busy" | "confirm" | "setConfirm" | "confirmDocument">) {
  const warnings = d?.kind === "FORM_A5" ? d.warnings : [];
  return (
    <Modal
      open={confirm}
      onOpenChange={(open) => { if (!busy) setConfirm(open); }}
      title="Konfirmasi data dokumen"
      description="Anda telah memeriksa nilai, sumber, dan peringatan. Data terkonfirmasi akan menjadi input evaluasi."
    >
      {!!warnings.length && <div className="alert review-warning">
        <strong>Perlu verifikasi evaluator</strong>
        {warnings.map(warning => <p key={warning}>{warning}</p>)}
        <label className="notice"><input type="checkbox" checked={ack} onChange={event => setAck(event.target.checked)} />Saya telah memeriksa peringatan dan memastikan data sesuai sumber.</label>
      </div>}
      <div className="modal-actions">
        <button className="btn" disabled={busy} onClick={() => setConfirm(false)}>
          Kembali memeriksa
        </button>
        <button
          className="btn primary"
          disabled={busy || (!!warnings.length && !ack)}
          onClick={() => void confirmDocument()}
        >
          {busy ? "Mengonfirmasi…" : "Konfirmasi data"}
        </button>
      </div>
    </Modal>
  );
}
