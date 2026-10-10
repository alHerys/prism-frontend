import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import { bankMoney as money } from "../../../shared/formatting/display";
import "../../../shared/styles/bank.css";
import type { BankPageModel } from "./view-models";
export function HistoricalDraft({
  functionName,
  setFunctionName,
  period,
  setPeriod,
  busy,
  draft,
  saveDraft,
  confirmDraft,
  publishDraft,
}: Pick<BankPageModel, "functionName" | "setFunctionName" | "period" | "setPeriod" | "busy" | "draft" | "saveDraft" | "confirmDraft" | "publishDraft">) {
  return (
    <>
      {draft && (
        <section className="panel">
          <div className="bank-section-heading">
            <div>
              <h2>Review dokumen historis</h2>
              <p className="muted">
                {draft.name} · revisi {draft.revision}
              </p>
            </div>
            <span
              className={`badge ${draft.status === "CONFIRMED" ? "success" : "warning"}`}
            >
              {draft.status === "CONFIRMED"
                ? "Terkonfirmasi"
                : "Perlu ditinjau"}
            </span>
          </div>
          <ol
            className="bank-publication-stages"
            aria-label="Tahap publikasi historis"
          >
            <li data-complete={!!draft.functionName && !!draft.period}>
              Lengkapi metadata
            </li>
            <li data-complete={draft.status === "CONFIRMED"}>
              Konfirmasi dokumen
            </li>
            <li>Publikasikan referensi</li>
          </ol>
          <div className="bank-two-col bank-details">
            <div>
              <h3 className="bank-source-title">
                <FileXls size={20} /> Bukti sumber
              </h3>
              <p className="muted">
                {[
                  ...new Set(draft.sources.map((source) => source.location)),
                ].join(" · ") || "Periksa berkas sumber"}
              </p>
              <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pekerjaan</th>
                    <th>Satuan</th>
                    <th>Harga satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.historicalItems?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.unit}</td>
                      <td className="numeric">{money(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div className="bank-draft-form">
              <h3 className="bank-source-title">Metadata publikasi</h3>
              <label className="field">
                Fungsi
                <input
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  placeholder="Masukkan fungsi pemilik OE"
                />
              </label>
              <label className="field">
                Periode
                <input
                  inputMode="numeric"
                  maxLength={4}
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Tahun sumber dokumen"
                />
              </label>
              <div className="toolbar">
                <button
                  className="btn"
                  disabled={!!busy || !functionName || !period}
                  onClick={saveDraft}
                >
                  Simpan metadata
                </button>
                <button
                  className="btn"
                  disabled={
                    !!busy ||
                    !draft.functionName ||
                    draft.functionName !== functionName ||
                    draft.period !== period ||
                    draft.status === "CONFIRMED"
                  }
                  onClick={confirmDraft}
                >
                  <CheckCircle size={16} />
                  Konfirmasi
                </button>
                <button
                  className="btn primary"
                  disabled={
                    !!busy ||
                    draft.status !== "CONFIRMED" ||
                    draft.functionName !== functionName ||
                    draft.period !== period
                  }
                  onClick={publishDraft}
                >
                  Publikasikan
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
