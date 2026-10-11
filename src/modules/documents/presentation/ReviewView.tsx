import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeSlash as EyeOff } from "@phosphor-icons/react/dist/csr/EyeSlash";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Link } from "react-router";
import { kindLabel } from "../../../shared/formatting/display";
import "../../../shared/styles/focus.css";
import { EmptyState as Empty } from "../../../shared/ui/empty-state";
import { Status } from "../../../shared/ui/status";
import { ReviewConfirmation } from "./ReviewConfirmation";
import { ReviewEditor } from "./ReviewEditor";
import { ReviewLeaveDialog } from "./ReviewLeaveDialog";
import { ReviewSource } from "./ReviewSource";

import type { ReviewModel } from "./view-models";
export function ReviewView({
  d,
  showSource,
  setShowSource,
  ack,
  setAck,
  busy,
  confirm,
  setConfirm,
  leave,
  setLeave,
  focused,
  setFocused,
  values,
  pairs,
  group,
  setGroup,
  dirty,
  setDirty,
  failure,
  blocker,
  leavePage,
  p,
  vendor,
  source,
  back,
  changeValue,
  save,
  confirmDocument,
  editPair,
}: ReviewModel) {
  if (!d)
    return (
      <main className="page focus-recovery">
        <Empty title="Dokumen tidak ditemukan" headingLevel={1}>
          Buka pengadaan untuk memilih dokumen yang tersedia.
        </Empty>
        <Link className="btn" to="/pengadaan">
          Kembali ke pengadaan
        </Link>
      </main>
    );
  return (
    <div className="focus-shell fernly-review">
      <header className="focus-head">
        <div className="review-header-context">
          <button
            className="icon-button review-back"
            aria-label="Kembali ke pengadaan"
            title="Kembali ke pengadaan"
            disabled={busy}
            onClick={() => (dirty ? setLeave(true) : back())}
          >
            <ArrowLeft size={28} aria-hidden="true" />
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
        <div className={`review-grid${showSource ? "" : " review-grid-editor-only"}`}>
          {showSource && (
            <ReviewSource d={d} focused={focused} p={p} vendor={vendor} source={source} />
          )}
          <ReviewEditor d={d} ack={ack} setAck={setAck} busy={busy} setConfirm={setConfirm} setFocused={setFocused} values={values} pairs={pairs} group={group} setGroup={setGroup} dirty={dirty} setDirty={setDirty} failure={failure} changeValue={changeValue} editPair={editPair} />
        </div>
      </main>
      <ReviewConfirmation busy={busy} confirm={confirm} setConfirm={setConfirm} confirmDocument={confirmDocument} />
      <ReviewLeaveDialog busy={busy} leave={leave} setLeave={setLeave} setDirty={setDirty} blocker={blocker} leavePage={leavePage} save={save} />
    </div>
  );
}
