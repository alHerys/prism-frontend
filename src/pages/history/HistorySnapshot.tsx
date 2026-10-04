import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { exactMoney, roundedMoney, historyTime as time } from "../../shared/formatters/display";
import { SnapshotInputs } from "../../modules/evaluations/presentation/SnapshotInputs";
import "../../shared/styles/bank.css";
import { categoryLabel, classificationLabel, moduleLabel } from "./history-labels";
import type { useHistoryPage } from "./useHistoryPage";
export function HistorySnapshot({ onOpenResult, selected, setSelected, exportBusy, procurementName, exportSelected }: Pick<ReturnType<typeof useHistoryPage>, "onOpenResult" | "selected" | "setSelected" | "exportBusy" | "procurementName" | "exportSelected">) {
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
          <p>{selected.policy}</p>
          {selected.excluded.length > 0 && (
            <p className="bank-notice">
              Tidak disertakan: {selected.excluded.join(", ")}
            </p>
          )}
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Vendor / item</th>
                  <th>Kategori</th>
                  <th>HEA / penawaran</th>
                  <th>Klasifikasi</th>
                  <th>Sumber</th>
                </tr>
              </thead>
              <tbody>
                {selected.rows.map((row, index) => (
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
                ))}
              </tbody>
            </table>
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
