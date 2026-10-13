import { Package } from "@phosphor-icons/react/dist/csr/Package";
import { Wrench } from "@phosphor-icons/react/dist/csr/Wrench";
import { ListBullets } from "@phosphor-icons/react/dist/csr/ListBullets";
import { WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { priceSummary } from "../application/price-summary";
import type { ResultRow } from "../domain/models";
import { PriceDeviationTable } from "./PriceDeviationTable";
import { PriceClassificationChart } from "./PriceClassificationChart";

export function PriceDeviationResults({ rows, filter, setFilter }: {
  rows: ResultRow[];
  filter: string;
  setFilter: (value: string) => void;
}) {
  const summary = priceSummary(rows);
  const [goods, services] = summary.categories;
  return <>
    <div className="result-filter-toolbar">
      <select aria-label="Filter kategori hasil" value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="">Barang & jasa</option>
        <option value="MATERIAL">Barang</option>
        <option value="SERVICE">Jasa</option>
      </select>
      <div className="result-counts" aria-label="Jumlah hasil harga">
        <span><ListBullets size={18} aria-hidden="true" />Total Item <strong>{summary.total}</strong></span>
        <span><Package size={18} aria-hidden="true" />Total Barang <strong>{goods.total}</strong></span>
        <span><Wrench size={18} aria-hidden="true" />Total Jasa <strong>{services.total}</strong></span>
        <span><WarningCircle size={18} aria-hidden="true" />Barang timpang <strong>{goods.unequal}</strong></span>
        <span><WarningCircle size={18} aria-hidden="true" />Jasa timpang <strong>{services.unequal}</strong></span>
      </div>
    </div>
    <div className="price-results-layout">
      <PriceDeviationTable rows={rows} />
      <PriceClassificationChart summary={summary} />
    </div>
  </>;
}
