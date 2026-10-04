import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { historyTime as time } from "../../shared/formatters/display";
import "../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { moduleLabel } from "./history-labels";
import type { HistoryPageModel } from "./view-models";
export function HistoryResults({ tab, setSelected, results, procurementName }: Pick<HistoryPageModel, "tab" | "setSelected" | "results" | "procurementName">) {
  return (
    <>
      {tab === "Hasil Evaluasi" && (
        <section className="panel">
          <div className="bank-section-heading">
            <h2>Hasil evaluasi tersimpan</h2>
            <span className="muted">{results.length} hasil</span>
          </div>
          {results.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pengadaan</th>
                    <th>Evaluasi</th>
                    <th>Waktu</th>
                    <th>Status</th>
                    <th>Rincian</th>
                  </tr>
                </thead>
                <tbody>
                  {[...results]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((result) => (
                      <tr key={result.id}>
                        <td>
                          <strong>
                            {procurementName(result.procurementId)}
                          </strong>
                          <div className="muted bank-meta">
                            {result.rows.length} baris hasil
                          </div>
                        </td>
                        <td>{moduleLabel[result.module]}</td>
                        <td>{time(result.createdAt)}</td>
                        <td>
                          <span
                            className={`badge ${result.status === "COMPLETE" ? "success" : "warning"}`}
                          >
                            {result.status === "COMPLETE"
                              ? "Lengkap"
                              : "Parsial"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn"
                            onClick={() => setSelected(result)}
                          >
                            Lihat hasil <ArrowUpRight size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Belum ada hasil evaluasi"
              text="Hasil yang berhasil dibuat akan tersimpan di sini beserta input dan sumbernya."
            />
          )}
        </section>
      )}
    </>
  );
}
