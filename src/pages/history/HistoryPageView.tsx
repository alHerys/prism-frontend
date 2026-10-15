import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import "../../shared/styles/bank.css";
import { PageTabs } from "../../shared/ui/page-tabs";
import { moduleLabel } from "./history-labels";
import { HistoryActivity } from "./HistoryActivity";
import { HistoryStatistics } from "./HistoryStatistics";

import type { HistoryPageModel } from "./view-models";
export function HistoryPageView({
  state,
  tab,
  setTab,
  query,
  setQuery,
  module,
  setModule,
  procurement,
  setProcurement,
  start,
  setStart,
  end,
  setEnd,
  events,
  results,
  activityChart,
  maxCount,
  visibleDocuments,
  procurementName,
}: HistoryPageModel) {

  return (
    <div className="page bank-page bank-history">
      <p className="history-date-basis muted">Rentang tanggal dan pengelompokan aktivitas menggunakan WIB. Waktu setiap aktivitas mengikuti zona waktu profil.</p>
      <PageTabs
        ariaLabel="Bagian riwayat"
        value={tab}
        items={["Aktivitas", "Statistik Aktivitas"].map(
          (label) => ({ label, value: label }),
        )}
        onValueChange={setTab}
      >
        <section className="bank-filters" aria-label="Filter riwayat">
          <label className="field">
            Modul
            <select value={module} onChange={(e) => setModule(e.target.value)}>
              <option value="">Semua modul</option>
              {Object.entries(moduleLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Pengadaan
            <select
              value={procurement}
              onChange={(e) => setProcurement(e.target.value)}
            >
              <option value="">Semua pengadaan</option>
              {state.procurements.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Dari tanggal
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="field">
            Sampai tanggal
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label className="bank-search">
            <MagnifyingGlass size={17} />
            <input
              aria-label="Cari aktivitas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari aktivitas atau pengadaan…"
            />
          </label>
        </section>
        {<HistoryActivity tab={tab} events={events} procurementName={procurementName} />}
        {<HistoryStatistics tab={tab} events={events} results={results} activityChart={activityChart} maxCount={maxCount} visibleDocuments={visibleDocuments} />}
      </PageTabs>
    </div>
  );
}
