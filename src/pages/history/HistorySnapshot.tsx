import { DataTable } from "../../shared/ui/data-table";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { exactMoney, roundedMoney } from "../../shared/formatting/display";
import { useWorkspaceTime } from "../../shared/ui/workspace-time";
import { SnapshotInputs } from "../../modules/evaluations/presentation/SnapshotInputs";
import "../../shared/styles/bank.css";
import { categoryLabel, classificationLabel, moduleLabel } from "./history-labels";
import type { HistoryPageModel } from "./view-models";
export function HistorySnapshot({ onOpenResult, selected, setSelected, exportBusy, procurementName, exportSelected }: Pick<HistoryPageModel, "onOpenResult" | "selected" | "setSelected" | "exportBusy" | "procurementName" | "exportSelected">) {
  const time = useWorkspaceTime();
  return (
    <>
      {selected && (
        <section
          className="panel bank-result-detail"
          aria-label="Rincian snapshot"
        >
          <div className="bank-section-heading">
            <div>
              <h2>
                {moduleLabel[selected.module]} ·{" "}
                {procurementName(selected.procurementId)}
              </h2>
              <p className="muted">
                Hasil tersimpan {time(selected.createdAt)} · {selected.id}
              </p>
            </div>
            <button className="btn" onClick={() => setSelected(undefined)}>
              Tutup rincian
            </button>
          </div>
          <div className="bank-snapshot-overview">
            <div><span className="muted">Baris hasil tersimpan</span><strong>{selected.rows.length}</strong></div>
            <div><span className="muted">Status snapshot</span><span className={`badge ${selected.status === "COMPLETE" ? "success" : "warning"}`}>{selected.status === "COMPLETE" ? "Lengkap" : "Parsial"}</span></div>
            <div><span className="muted">Kebijakan evaluasi</span><p>{selected.policy}</p></div>
          </div>
          {selected.excluded.length > 0 && (
            <p className="bank-notice">
              Tidak disertakan: {selected.excluded.join(", ")}
            </p>
          )}
          <div className="table-scroll">
            <DataTable key={selected.id} rows={selected.rows} label="Rincian snapshot" columns={[
  { label: "Vendor / item", value: row => row.vendorName ?? row.description },
  { label: "Kategori", value: row => row.category ? categoryLabel[row.category] ?? row.category : "—", filter: row => row.category ? categoryLabel[row.category] ?? row.category : "—" },
  { label: "HEA / penawaran", value: row => row.hea ?? row.offer, type: "decimal", className: "numeric" },
  { label: "Klasifikasi", value: row => row.classification ? classificationLabel[row.classification] ?? row.classification : row.rank ? `Peringkat ${row.rank}` : "—", filter: row => row.classification ? classificationLabel[row.classification] ?? row.classification : "Peringkat HEA" },
  { label: "Sumber", value: row => row.source ?? "Form A5 terkonfirmasi" },
]}>{(row, index) => (
                  <tr key={index}>
                    <td>{row.vendorName ?? row.description}</td>
                    <td>
                      {row.category
                        ? (categoryLabel[row.category] ?? row.category)
                        : "—"}
                    </td>
                    <td
                      className="numeric"
                      title={exactMoney(row.hea ?? row.offer)}
                    >
                      {roundedMoney(row.hea ?? row.offer)}
                    </td>
                    <td>
                      {row.classification
                        ? (classificationLabel[row.classification] ??
                          row.classification)
                        : row.rank
                          ? `Peringkat ${row.rank}`
                          : "—"}
                    </td>
                    <td>{row.source ?? "Form A5 terkonfirmasi"}</td>
                  </tr>
                )}</DataTable>
          </div>
          <details className="bank-input-details">
            <summary>Input dan revisi saat evaluasi</summary>
            <SnapshotInputs value={selected.inputs} />
          </details>
          <div className="toolbar">
            {onOpenResult && (
              <button
                className="btn"
                onClick={() => onOpenResult(selected.id)}
              >
                Buka dalam pengadaan <ArrowUpRight size={16} />
              </button>
            )}
            <button
              className="btn primary"
              onClick={exportSelected}
              disabled={exportBusy}
              aria-busy={exportBusy}
            >
              <DownloadSimple size={16} />
              {exportBusy ? "Menyiapkan laporan…" : "Ekspor Excel"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
