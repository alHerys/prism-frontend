import { CircleNotch } from "@phosphor-icons/react/dist/csr/CircleNotch";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import "../../../shared/styles/bank.css";
import { HeaderAction } from "../../../shared/ui/header-action";
import { HistoricalDraft } from "./HistoricalDraft";
import { HistoricalEstimate } from "./HistoricalEstimate";
import { HistoricalUpload } from "./HistoricalUpload";
import type { BankPageModel } from "./view-models";

export function BankPageView(model: BankPageModel) {
  const { showUpload, setShowUpload, setDraftId, setError, error, notice, busy } = model;
  return (
    <div className="page bank-page">
      <HeaderAction>
        <button className="btn primary" onClick={() => { setShowUpload(!showUpload); setDraftId(""); setError(""); }}>
          <Plus size={17} />Tambah dokumen historis
        </button>
      </HeaderAction>
      {error && <p role="alert" className="bank-notice bank-error">{error}</p>}
      {notice && <p role="status" className="bank-notice">{notice}</p>}
      {busy && <p role="status" className="bank-notice"><CircleNotch size={16} className="spin" /> {busy}…</p>}
      <HistoricalUpload {...model} />
      <HistoricalDraft {...model} />
      <HistoricalEstimate {...model} />
    </div>
  );
}
