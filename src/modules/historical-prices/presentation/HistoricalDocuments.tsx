import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import "../../../shared/styles/bank.css";
import type { BankPageModel } from "./view-models";
export function HistoricalDocuments({ state, tab, setDraftId, setFunctionName, setPeriod }: Pick<BankPageModel, "state" | "tab" | "setDraftId" | "setFunctionName" | "setPeriod">) {
  return (
    <>
      {tab === "Dokumen Historis" &&
        state.documents.some(
          (d) => d.kind === "HISTORICAL_OE" && !d.published,
        ) && (
          <section className="panel">
            <div className="bank-section-heading">
              <h2>Draft belum dipublikasikan</h2>
            </div>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Dokumen</th>
                    <th>Fungsi / periode</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {state.documents
                    .filter((d) => d.kind === "HISTORICAL_OE" && !d.published)
                    .map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div className="bank-document-identity">
                            <span className="bank-document-icon">
                              <FileXls size={23} />
                            </span>
                            <strong>{d.name}</strong>
                          </div>
                        </td>
                        <td>
                          {d.functionName || "Belum diisi"} ·{" "}
                          {d.period || "Belum diisi"}
                        </td>
                        <td>
                          <span className="badge warning">
                            {d.status === "CONFIRMED"
                              ? "Siap publikasi"
                              : "Perlu ditinjau"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn"
                            onClick={() => {
                              setDraftId(d.id);
                              setFunctionName(d.functionName ?? "");
                              setPeriod(d.period ?? "");
                            }}
                          >
                            Review dokumen <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
    </>
  );
}
