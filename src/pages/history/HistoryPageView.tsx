import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import "../../shared/styles/bank.css";
import { PageTabs } from "../../shared/ui/page-tabs";
import { moduleLabel } from "./history-labels";
import { HistoryActivity } from "./HistoryActivity";
import { HistoryResults } from "./HistoryResults";
import { HistorySnapshot } from "./HistorySnapshot";
import { HistoryStatistics } from "./HistoryStatistics";

import type { HistoryPageModel } from "./view-models";
export function HistoryPageView({
  onOpenResult,
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
  selected,
  setSelected,
  notice,
  exportBusy,
  noticeError,
  events,
  results,
  activityChart,
  maxCount,
  visibleDocuments,
  procurementName,
  exportSelected,
}: HistoryPageModel) {

  return (
    <div className="page bank-page bank-history">
      <PageTabs
        ariaLabel="Bagian riwayat"
        value={tab}
        items={["Aktivitas", "Hasil Evaluasi", "Statistik Aktivitas"].map(
          (label) => ({ label, value: label }),
        )}
        onValueChange={(value) => {
          setTab(value);
          setSelected(undefined);
        }}
      >
        <section className="bank-filters" aria-label="Filter riwayat">
          <label className="bank-search">
            <MagnifyingGlass size={17} />
            <input
              aria-label="Cari aktivitas atau hasil"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari aktivitas atau pengadaan…"
            />
          </label>
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
        </section>
        {notice && (
          <p
            role={noticeError ? "alert" : "status"}
            className={`bank-notice ${noticeError ? "bank-error" : ""}`}
          >
            {notice}
          </p>
        )}
        {<HistoryActivity tab={tab} events={events} procurementName={procurementName} />}
        {<HistoryResults tab={tab} setSelected={setSelected} results={results} procurementName={procurementName} />}
        {<HistoryStatistics tab={tab} events={events} results={results} activityChart={activityChart} maxCount={maxCount} visibleDocuments={visibleDocuments} />}
        {<HistorySnapshot onOpenResult={onOpenResult} selected={selected} setSelected={setSelected} exportBusy={exportBusy} procurementName={procurementName} exportSelected={exportSelected} />}
      </PageTabs>
    </div>
  );
}
