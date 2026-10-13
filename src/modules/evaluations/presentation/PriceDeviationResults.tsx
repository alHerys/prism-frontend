import { Package } from "@phosphor-icons/react/dist/csr/Package";
import { Wrench } from "@phosphor-icons/react/dist/csr/Wrench";
import { ListBullets } from "@phosphor-icons/react/dist/csr/ListBullets";
import { priceSummary } from "../application/price-summary";
import type { ResultRow } from "../domain/models";
import { PriceDeviationTable } from "./PriceDeviationTable";
import { useState } from "react";
import { PriceTableSearch } from "./PriceTableSearch";

export function PriceDeviationResults({ rows, filter, setFilter }: {
  rows: ResultRow[];
  filter: string;
  setFilter: (value: string) => void;
}) {
  const summary = priceSummary(rows);
  const [query, setQuery] = useState("");
  const [goods, services] = summary.categories;
  return <>
    <div className="result-filter-toolbar">
      <select aria-label="Filter kategori hasil" value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="">Barang & jasa</option>
        <option value="MATERIAL">Barang</option>
        <option value="SERVICE">Jasa</option>
      </select>
      <PriceTableSearch query={query} onQueryChange={setQuery}>
      <div className="result-counts" aria-label="Jumlah hasil harga">
        <span><ListBullets size={18} aria-hidden="true" />Total Item <strong>{summary.total}</strong></span>
        <span><Package size={18} aria-hidden="true" />Barang Timpang <strong>{goods.unequal}</strong> dari <strong>{goods.total}</strong></span>
        <span><Wrench size={18} aria-hidden="true" />Jasa Timpang <strong>{services.unequal}</strong> dari <strong>{services.total}</strong></span>
      </div>
      </PriceTableSearch>
    </div>
    <PriceDeviationTable rows={rows} search={{ query, onQueryChange: setQuery }} />
  </>;
}
