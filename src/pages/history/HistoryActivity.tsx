import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { historyTime as time } from "../../shared/formatters/display";
import "../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { eventLabel, moduleLabel } from "./history-labels";
import type { useHistoryPage } from "./useHistoryPage";
export function HistoryActivity({ tab, events, procurementName }: Pick<ReturnType<typeof useHistoryPage>, "tab" | "events" | "procurementName">) {
  return (
    <>
      {tab === "Aktivitas" && (
        <section className="panel">
          <div className="bank-section-heading">
            <h2>Catatan aktivitas</h2>
            <span className="muted">{events.length} aktivitas</span>
          </div>
          {events.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Aktivitas</th>
                    <th>Pengadaan</th>
                    <th>Modul</th>
                  </tr>
                </thead>
                <tbody>
                  {[...events]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((event) => (
                      <tr key={event.id}>
                        <td className="nowrap">{time(event.createdAt)}</td>
                        <td>
                          <div className="bank-document-identity">
                            <span className="bank-document-icon">
                              <Clock size={22} />
                            </span>
                            <div>
                              <strong>{event.summary}</strong>
                              <div className="muted bank-meta">
                                {eventLabel[event.type] ?? "Perubahan data"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{procurementName(event.procurementId)}</td>
                        <td>
                          <span className="badge">
                            {moduleLabel[event.module]}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Belum ada aktivitas pada pilihan ini"
              text="Ubah filter atau mulai pekerjaan melalui Pengadaan dan Bank Data OE."
            />
          )}
        </section>
      )}
    </>
  );
}
