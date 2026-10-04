import { ClipboardText } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { historyChartDay } from "../../shared/formatters/display";
import "../../shared/styles/bank.css";
import { Empty } from "./Empty";
import type { useHistoryPage } from "./useHistoryPage";
export function HistoryStatistics({ tab, events, results, activityChart, maxCount, visibleDocuments }: Pick<ReturnType<typeof useHistoryPage>, "tab" | "events" | "results" | "activityChart" | "maxCount" | "visibleDocuments">) {
  return (
    <>
      {tab === "Statistik Aktivitas" && (
        <>
          <section className="panel bank-stat-strip">
            {[
              {
                label: "Pengadaan terkait",
                value: new Set(
                  events
                    .filter((e) => e.procurementId)
                    .map((e) => e.procurementId),
                ).size,
                icon: ClipboardText,
              },
              {
                label: "Aktivitas tercatat",
                value: events.length,
                icon: Clock,
              },
              {
                label: "Hasil evaluasi",
                value: results.length,
                icon: FileText,
              },
              {
                label: "Dokumen diproses",
                value: visibleDocuments.length,
                icon: FileText,
              },
              {
                label: "Dokumen perlu review",
                value: visibleDocuments.filter(
                  (d) => d.status === "REVIEW_REQUIRED",
                ).length,
                icon: ClipboardText,
              },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon size={20} />
                <span className="muted">{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="bank-section-heading">
              <div>
                <h2>Aktivitas per hari</h2>
                <p className="muted">
                  Jumlah aktivitas sesuai filter yang dipilih.
                </p>
              </div>
            </div>
            {activityChart.length ? (
              <>
                <div
                  className="bank-bars"
                  role="img"
                  aria-label={`Aktivitas per hari: ${activityChart.map(([day, count]) => `${day}: ${count}`).join(", ")}`}
                >
                  {activityChart.map(([day, count]) => (
                    <div className="bank-bar-column" key={day}>
                      <strong>{count}</strong>
                      <div
                        className="bank-bar"
                        style={{
                          height: `${Math.max(8, (count / maxCount) * 140)}px`,
                        }}
                      />
                      <span>
                        {day.slice(8, 10)}/{day.slice(5, 7)}
                      </span>
                    </div>
                  ))}
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Jumlah aktivitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityChart.map(([day, count]) => (
                      <tr key={day}>
                        <td>
                          {historyChartDay(day)}
                        </td>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <Empty
                title="Belum cukup aktivitas untuk ditampilkan"
                text="Aktivitas yang tercatat akan membentuk grafik dan rincian di halaman ini."
              />
            )}
          </section>
        </>
      )}
    </>
  );
}
