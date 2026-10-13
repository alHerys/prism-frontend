import type { priceSummary } from "../application/price-summary";

export function PriceClassificationChart({ summary }: { summary: ReturnType<typeof priceSummary> }) {
  const maximum = Math.max(1, ...summary.categories.flatMap(category => [category.unequal, category.equal]));
  return <figure className="price-classification-chart" aria-label="Grafik klasifikasi Harga Timpang">
    <figcaption>Klasifikasi harga</figcaption>
    <p>Jumlah item menurut hasil evaluasi</p>
    <div className="price-chart-legend" aria-hidden="true"><span className="unequal">Timpang</span><span className="equal">Tidak timpang</span></div>
    {summary.total === 0 ? <p className="price-chart-empty">Tidak ada item pada kategori ini.</p> :
      <div className="price-chart-groups">
        {summary.categories.map(category => <div className="price-chart-group" key={category.category}>
          <h3>{category.label}</h3>
          {([{ label: "Timpang", value: category.unequal, className: "unequal" }, { label: "Tidak timpang", value: category.equal, className: "equal" }]).map(series =>
            <div className="price-chart-row" key={series.className} aria-label={`${category.label}: ${series.value} ${series.label.toLowerCase()}`}>
              <span>{series.label}</span>
              <div className="price-chart-track" aria-hidden="true"><div className={series.className} style={{ width: `${series.value / maximum * 100}%` }} /></div>
              <strong>{series.value}</strong>
            </div>)}
        </div>)}
        <div className="price-chart-scale" aria-hidden="true"><span>0</span><span>{maximum} item</span></div>
      </div>}
  </figure>;
}
