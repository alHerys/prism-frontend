import { DataTable } from "../../shared/ui/data-table";
import { ClipboardText } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { historyChartDay } from "../../shared/formatting/display";
import "../../shared/styles/bank.css";
import { Empty } from "./Empty";
import type { HistoryPageModel } from "./view-models";

export function HistoryStatistics({ tab, events, results, activityChart, maxCount, visibleDocuments }: Pick<HistoryPageModel, "tab" | "events" | "results" | "activityChart" | "maxCount" | "visibleDocuments">) {
  if (tab !== "Statistik Aktivitas") return null;
  const stats = [
    { label: "Pengadaan terkait", value: new Set(events.filter((event) => event.procurementId).map((event) => event.procurementId)).size, icon: ClipboardText },
    { label: "Aktivitas tercatat", value: events.length, icon: Clock },
    { label: "Hasil evaluasi", value: results.length, icon: FileText },
    { label: "Dokumen diproses", value: visibleDocuments.length, icon: FileText },
    { label: "Dokumen perlu review", value: visibleDocuments.filter((document) => document.status === "REVIEW_REQUIRED").length, icon: ClipboardText },
  ];
  return (
    <>
      <section className="bank-stat-strip" aria-label="Ringkasan statistik aktivitas">
        {stats.map((stat) => <div key={stat.label}><stat.icon size={20} aria-hidden="true" /><span className="muted">{stat.label}</span><strong>{stat.value}</strong></div>)}
      </section>
      <div className="history-stat-layout">
        <section className="panel">
          <div className="bank-section-heading">
            <div><h2>Aktivitas per hari</h2><p className="muted">Jumlah aktivitas sesuai filter yang dipilih.</p></div>
          </div>
          {activityChart.length ? (
            <div className="bank-bars" role="img" aria-label={`Aktivitas per hari: ${activityChart.map(([day, count]) => `${day}: ${count}`).join(", ")}`}>
              {activityChart.map(([day, count]) => (
                <div className="bank-bar-column" key={day}>
                  <strong>{count}</strong>
                  <div className="bank-bar" style={{ height: `${Math.max(8, (count / maxCount) * 160)}px` }} />
                  <span>{day.slice(8, 10)}/{day.slice(5, 7)}</span>
                </div>
              ))}
            </div>
          ) : <Empty title="Belum cukup aktivitas untuk ditampilkan" text="Aktivitas yang tercatat akan membentuk grafik dan rincian di halaman ini." />}
        </section>
        {activityChart.length > 0 && (
          <section className="panel">
            <div className="bank-section-heading"><h2>Rincian harian</h2><span className="bank-count">{activityChart.length} hari</span></div>
            <div className="table-scroll">
              <DataTable rows={activityChart} label="Rincian harian" columns={[
  { label: "Tanggal", value: row => row[0] },
  { label: "Aktivitas", value: row => row[1], className: "numeric" },
]}>{([day, count]) => <tr key={day}><td>{historyChartDay(day)}</td><td className="numeric">{count}</td></tr>}</DataTable>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
