import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { bankMoney as money } from "../../../shared/formatters/display";
import "../../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { ReferenceTable } from "./ReferenceTable";
import type { BankPageModel } from "./view-models";
export function HistoricalStatistics({
  tab,
  setTab,
  selectedIds,
  setDetail,
  busy,
  selected,
  statistics,
  statsReady,
  toggle,
  exportStats,
  compareReference,
}: Pick<BankPageModel, "tab" | "setTab" | "selectedIds" | "setDetail" | "busy" | "selected" | "statistics" | "statsReady" | "toggle" | "exportStats" | "compareReference">) {
  return (
    <>
      {tab === "Statistik Harga" && (
        <section className="panel">
          <div className="bank-section-heading">
            <div>
              <h2>Perkembangan harga referensi</h2>
              <p className="muted">
                Referensi yang dipilih pada Pencarian Referensi.
              </p>
            </div>
            <button
              className="btn"
              disabled={!statsReady || !!busy}
              onClick={exportStats}
            >
              <DownloadSimple size={16} />
              Ekspor Excel
            </button>
          </div>
          {statistics ? (
            <>
              <div className="bank-stat-strip bank-price-stats">
                <div>
                  <span className="muted">Minimum / {statistics.unit}</span>
                  <strong>{money(statistics.min)}</strong>
                </div>
                <div>
                  <span className="muted">Median / {statistics.unit}</span>
                  <strong>{money(statistics.median)}</strong>
                </div>
                <div>
                  <span className="muted">Maksimum / {statistics.unit}</span>
                  <strong>{money(statistics.max)}</strong>
                </div>
              </div>
              <figure className="bank-figure">
                <svg
                  className="bank-chart"
                  viewBox="0 0 720 220"
                  role="img"
                  aria-label={`Harga ${statistics.description.toLowerCase()}: ${statistics.observations.map((item) => `${item.period} ${money(item.price)}`).join(", ")}`}
                >
                  {statistics.chart.ticks.map((tick) => (
                    <g key={tick.price}>
                      <line
                        x1="80"
                        y1={tick.y}
                        x2="650"
                        y2={tick.y}
                        stroke="#e2e8f0"
                      />
                      <text x="0" y={tick.y + 4}>
                        {money(tick.price)}
                      </text>
                    </g>
                  ))}
                  <path
                    d={statistics.chart.points
                      .map(
                        (point, index) =>
                          `${index ? "L" : "M"}${point.x} ${point.y}`,
                      )
                      .join(" ")}
                  />
                  {statistics.chart.points.map((point) => (
                    <g key={point.period}>
                      <circle cx={point.x} cy={point.y} r="5" />
                      <text x={point.x} y="208" textAnchor="middle">
                        {point.period}
                      </text>
                    </g>
                  ))}
                </svg>
                <figcaption>
                  {statistics.description} · rupiah per {statistics.unit}.
                  Harga historis bukan penetapan harga pasar.
                </figcaption>
              </figure>
              <ReferenceTable
                items={selected}
                selected={selectedIds}
                toggle={toggle}
                onDetail={setDetail}
                onCompare={(id, value) =>
                  compareReference(id, value)
                }
              />
            </>
          ) : (
            <Empty
              title={
                selected.length === 1
                  ? "Satu pengamatan belum membentuk tren"
                  : "Pilih referensi yang sebanding"
              }
              text="Pilih tiga pengamatan lintas periode dan periksa kesebandingannya melalui Pencarian Referensi."
            />
          )}
          <div className="bank-reference-selection">
            <button
              className="btn"
              onClick={() => setTab("Pencarian Referensi")}
            >
              Atur referensi
            </button>
            <button
              className="btn primary"
              disabled={!statsReady}
              onClick={() => setTab("Bantuan Estimasi")}
            >
              Lanjut ke bantuan estimasi <ArrowUpRight size={16} />
            </button>
          </div>
        </section>
      )}
    </>
  );
}
