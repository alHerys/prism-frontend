import { DataTable } from "../../shared/ui/data-table";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { useWorkspaceTime } from "../../shared/ui/workspace-time";
import "../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { moduleLabel } from "./history-labels";
import type { HistoryPageModel } from "./view-models";
export function HistoryResults({ tab, setSelected, results, procurementName }: Pick<HistoryPageModel, "tab" | "setSelected" | "results" | "procurementName">) {
  const time = useWorkspaceTime();
  return (
    <>
      {tab === "Hasil Evaluasi" && (
        <section className="panel">
          <div className="bank-section-heading">
            <h2>Hasil evaluasi tersimpan</h2>
            <div className="history-results-meta">
              <span className="bank-count">{results.length} hasil</span>
              <span className="badge success">{results.filter((result) => result.status === "COMPLETE").length} lengkap</span>
              <span className="badge warning">{results.filter((result) => result.status !== "COMPLETE").length} parsial</span>
            </div>
          </div>
          {results.length ? (
            <div className="table-scroll">
              <DataTable rows={[...results].sort((a,b) => b.createdAt.localeCompare(a.createdAt))} label="Hasil evaluasi tersimpan" columns={[
  { label: "Pengadaan", value: result => procurementName(result.procurementId) },
  { label: "Evaluasi", value: result => moduleLabel[result.module], filter: result => moduleLabel[result.module] },
  { label: "Waktu", value: result => result.createdAt },
  { label: "Status", value: result => result.status, filter: result => result.status === "COMPLETE" ? "Lengkap" : "Parsial" },
  { label: "Rincian" },
]}>{(result) => (
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
                        <td className="nowrap">{time(result.createdAt)}</td>
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
                    )}</DataTable>
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
