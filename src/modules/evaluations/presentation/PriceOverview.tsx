import type { ReactNode } from "react";
import type { ResultRow } from "../domain/models";
import { priceComposition } from "../application/price-composition";

const percent = (value: number) => `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value)}%`;

function CompositionPie({ label, rows }: { label: string; rows: ResultRow[] }) {
  const composition = priceComposition(rows);
  return <figure className="price-composition" aria-label={`Komposisi ${label}`}>
    <figcaption>{label}</figcaption>
    {composition.classified > 0 ? <>
      <div className="price-composition-pie" role="img" aria-label={`${percent(composition.unequalPercent)} timpang, ${percent(composition.equalPercent)} tidak timpang`} style={{ background: `conic-gradient(#a75a06 0% ${composition.unequalPercent}%, var(--accent) ${composition.unequalPercent}% 100%)` }} />
      <dl className="price-composition-legend">
        <div className="unequal"><dt>Timpang</dt><dd>{percent(composition.unequalPercent)} · {composition.unequal} item</dd></div>
        <div><dt>Tidak timpang</dt><dd>{percent(composition.equalPercent)} · {composition.equal} item</dd></div>
      </dl>
      <p>{composition.classified} item terklasifikasi</p>
    </> : <div className="price-composition-empty">Belum ada item terklasifikasi.</div>}
    {composition.unclassified > 0 && <p>{composition.unclassified} item tanpa klasifikasi tidak masuk rasio.</p>}
  </figure>;
}

/** Ratios describe the whole saved result, including every classified item. */
export function PriceOverview({ rows, actions }: { rows: ResultRow[]; actions?: ReactNode }) {
  return <section className="panel price-overview" aria-label="Overview Harga Timpang">
    <div className="panel-header"><h2>Overview</h2>{actions}</div>
    <div className="price-overview-grid">
      <CompositionPie label="Seluruh Item" rows={rows} />
      <CompositionPie label="Barang" rows={rows.filter(row => row.category === "MATERIAL")} />
      <CompositionPie label="Jasa" rows={rows.filter(row => row.category === "SERVICE")} />
    </div>
  </section>;
}
