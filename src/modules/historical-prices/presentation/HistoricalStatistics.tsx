import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { bankMoney as money, exactMoney } from "../../../shared/formatting/display";
import "../../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { ReferenceTable } from "./ReferenceTable";
import { ReferencePriceChart } from "./ReferencePriceChart";
import type { BankPageModel } from "./view-models";

export function HistoricalStatistics({ tab, setTab, selectedIds, setDetail, busy, selected, statistics, statsReady, toggle, exportStats, compareReference }: Pick<BankPageModel, "tab" | "setTab" | "selectedIds" | "setDetail" | "busy" | "selected" | "statistics" | "statsReady" | "toggle" | "exportStats" | "compareReference">) {
  if (tab !== "Statistik Harga") return null;

  return (
    <>
      {statistics && (
        <section className="bank-stat-strip bank-price-stats" aria-label="Ringkasan harga referensi">
          {[
            { label: "Minimum", value: statistics.min },
            { label: "Median", value: statistics.median },
            { label: "Maksimum", value: statistics.max },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="muted">{stat.label} / {statistics.unit}</span>
              <strong title={exactMoney(stat.value)}>{money(stat.value)}</strong>
            </div>
          ))}
        </section>
      )}
      <section className="panel">
        <div className="bank-section-heading">
          <div>
            <h2>Perkembangan harga referensi</h2>
            <p className="muted">Referensi yang dipilih pada Pencarian Referensi.</p>
          </div>
          <button className="btn" disabled={!statsReady || !!busy} onClick={exportStats}>
            <DownloadSimple size={16} /> Ekspor Excel
          </button>
        </div>
        {statistics ? (
          <ReferencePriceChart statistics={statistics} />
        ) : (
          <Empty title={selected.length === 1 ? "Satu pengamatan belum membentuk tren" : "Pilih referensi yang sebanding"} text="Pilih tiga pengamatan lintas periode dan periksa kesebandingannya melalui Pencarian Referensi." />
        )}
        <div className="bank-reference-selection">
          <button className="btn" onClick={() => setTab("Pencarian Referensi")}>Atur referensi</button>
          <button className="btn primary" disabled={!statsReady} onClick={() => setTab("Bantuan Estimasi")}>Lanjut ke bantuan estimasi <ArrowUpRight size={16} /></button>
        </div>
      </section>
      {statistics && (
        <section className="panel">
          <div className="bank-section-heading">
            <div><h2>Dasar referensi</h2><p className="muted">Jejak dokumen dan kesebandingan tetap tersedia untuk diperiksa.</p></div>
            <span className="bank-count">{selected.length} referensi dipilih</span>
          </div>
          <ReferenceTable items={selected} selected={selectedIds} toggle={toggle} onDetail={setDetail} onCompare={compareReference} />
        </section>
      )}
    </>
  );
}
