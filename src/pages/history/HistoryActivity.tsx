import { CalendarBlank } from "@phosphor-icons/react/dist/csr/CalendarBlank";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { historyChartDay, historyTime as time, localDay } from "../../shared/formatting/display";
import "../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { eventLabel, moduleLabel } from "./history-labels";
import type { HistoryPageModel } from "./view-models";

export function HistoryActivity({ tab, events, procurementName }: Pick<HistoryPageModel, "tab" | "events" | "procurementName">) {
  if (tab !== "Aktivitas") return null;
  const days = new Map<string, typeof events>();
  for (const event of [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const day = localDay(event.createdAt);
    days.set(day, [...(days.get(day) ?? []), event]);
  }
  const procurementCount = new Set(events.filter((event) => event.procurementId).map((event) => event.procurementId)).size;

  return (
    <div className="history-workspace">
      <section className="panel">
        <div className="bank-section-heading">
          <h2>Catatan aktivitas</h2>
          <span className="bank-count">{events.length} aktivitas</span>
        </div>
        {events.length ? (
          <div className="history-timeline">
            {[...days].map(([day, dayEvents]) => (
              <section className="history-day" key={day} aria-label={historyChartDay(day)}>
                <h3><CalendarBlank size={18} aria-hidden="true" />{historyChartDay(day)}</h3>
                <ol>
                  {dayEvents.map((event) => (
                    <li className="history-event" key={event.id}>
                      <span className="bank-document-icon"><Clock size={21} aria-hidden="true" /></span>
                      <div className="history-event-content">
                        <div className="history-event-heading">
                          <strong>{event.summary}</strong>
                          <time dateTime={event.createdAt}>{time(event.createdAt)}</time>
                        </div>
                        <div className="muted bank-meta">{eventLabel[event.type] ?? "Perubahan data"}</div>
                        <div className="history-event-meta">
                          <span>{procurementName(event.procurementId)}</span>
                          <span className="badge">{moduleLabel[event.module]}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <Empty title="Belum ada aktivitas pada pilihan ini" text="Ubah filter atau mulai pekerjaan melalui Pengadaan dan Bank Data OE." />
        )}
      </section>
      <aside className="panel" aria-label="Ringkasan aktivitas terfilter">
        <div className="bank-section-heading"><h2>Dalam pilihan ini</h2></div>
        <div className="history-context">
          <dl>
            <dt>Aktivitas tercatat</dt><dd>{events.length}</dd>
            <dt>Hari dengan aktivitas</dt><dd>{days.size}</dd>
            <dt>Pengadaan terkait</dt><dd>{procurementCount}</dd>
          </dl>
          <p className="muted">Catatan disusun dari aktivitas yang tercatat, sesuai pencarian, modul, pengadaan, dan rentang tanggal di atas.</p>
        </div>
      </aside>
    </div>
  );
}
