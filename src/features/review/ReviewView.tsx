import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeSlash as EyeOff } from "@phosphor-icons/react/dist/csr/EyeSlash";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Link } from "react-router";
import { kindLabel } from "../../shared/formatters/display";
import "../../shared/styles/focus.css";
import { Empty, Status } from "../../shared/ui/feedback";
import { ReviewConfirmation } from "./ReviewConfirmation";
import { ReviewEditor } from "./ReviewEditor";
import { ReviewLeaveDialog } from "./ReviewLeaveDialog";
import { ReviewSource } from "./ReviewSource";

import type { useReview } from "./useReview";
export function ReviewView({ d, showSource, setShowSource, ack, setAck, busy, confirm, setConfirm, leave, setLeave, focused, setFocused, values, pairs, group, setGroup, dirty, setDirty, failure, blocker, leavePage, p, vendor, fixture, back, changeValue, save, confirmDocument, editPair }: ReturnType<typeof useReview>) {
  if (!d)
    return (
      <div className="page">
        <Empty title="Dokumen tidak ditemukan">
          Buka pengadaan untuk memilih dokumen yang tersedia.
        </Empty>
        <Link className="btn" to="/pengadaan">
          Kembali ke pengadaan
        </Link>
      </div>
    );
  return (
    <div className="focus-shell">
      <header className="focus-head">
        <div className="review-header-context">
          <button
            className="btn quiet review-back"
            onClick={() => (dirty ? setLeave(true) : back())}
          >
            <ArrowLeft />
            Kembali ke pengadaan
          </button>
          <div className="review-heading">
            <h1>Periksa {kindLabel[d.kind]}</h1>
            <p>
              {p.number} · {vendor?.name || p.name}
            </p>
          </div>
        </div>
      </header>
      <main className="focus-content">
        <div className="review-document-bar">
          <div className="review-document-identity">
            <span className="review-file-icon">
              <FileText aria-hidden="true" />
            </span>
            <div>
              <strong>{d.name}</strong>
              <p>
                Revisi {d.revision} · {kindLabel[d.kind]}
              </p>
            </div>
            <Status value={dirty ? "REVIEW_REQUIRED" : d.status} />
          </div>
          <button
            className="btn"
            aria-expanded={showSource}
            aria-controls="review-source"
            onClick={() => setShowSource((shown) => !shown)}
          >
            {showSource ? <EyeOff /> : <Eye />}
            {showSource ? "Tutup bukti sumber" : "Tampilkan bukti sumber"}
          </button>
        </div>
        <div
          className="review-grid"
          style={!showSource ? { gridTemplateColumns: "1fr" } : undefined}
        >
          {showSource && (
            <ReviewSource d={d} focused={focused} p={p} vendor={vendor} fixture={fixture} />
          )}
          <ReviewEditor d={d} ack={ack} setAck={setAck} busy={busy} setConfirm={setConfirm} setFocused={setFocused} values={values} pairs={pairs} group={group} setGroup={setGroup} dirty={dirty} setDirty={setDirty} failure={failure} changeValue={changeValue} save={save} editPair={editPair} />
        </div>
      </main>
      <ReviewConfirmation busy={busy} confirm={confirm} setConfirm={setConfirm} confirmDocument={confirmDocument} />
      <ReviewLeaveDialog busy={busy} leave={leave} setLeave={setLeave} setDirty={setDirty} blocker={blocker} leavePage={leavePage} save={save} />
    </div>
  );
}
