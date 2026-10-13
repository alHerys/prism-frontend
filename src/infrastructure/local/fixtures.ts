import type { A5Values } from "../../modules/documents/domain/models";
import type { HistoricalItem } from "../../modules/historical-prices/domain/models";
import type { PricePair } from "../../modules/price-deviation/domain/models";
import type { HEACalculation } from "../../modules/evaluations/domain/models";
export const A5_FIXTURES: Record<string, A5Values> = {
  "a5-nusa": {
    hpb: "1000000000",
    hpj: "300000000",
    knb: "25000000",
    tkdn_barang: "0.4",
    tkdn_jasa: "0.3",
  },
  "a5-borneo": {
    hpb: "1040000000",
    hpj: "320000000",
    knb: "18000000",
    tkdn_barang: "0.5",
    tkdn_jasa: "0.35",
  },
};
export const FIXTURE_PREFERENCES = {
  preferensi_barang: "0.15",
  preferensi_jasa: "0.075",
};
export const HEA_RESULTS: Record<string, string> = {
  "a5-nusa": "1261794759.4224293029478248835170918485030216358352",
  "a5-borneo": "1297256720.3920346712743959436875053111633572217659",
};
// Synthetic inputs only. Verified offline with Python Decimal (precision 50).
export const HEA_CALCULATIONS: Record<string, HEACalculation> = {
  "a5-nusa": {
    total: "1300000000", tkdnCombined: "0.37692307692307692307692307692307692307692307692308",
    kpb: "0.060", kpj: "0.0225",
    heGoods: "943396226.41509433962264150943396226415094339622642",
    heServices: "293398533.00733496332518337408312958435207823960880",
    heCombined: "1236794759.4224293029478248835170918485030216358352",
  },
  "a5-borneo": {
    total: "1360000000", tkdnCombined: "0.46470588235294117647058823529411764705882352941176",
    kpb: "0.075", kpj: "0.02625",
    heGoods: "967441860.46511627906976744186046511627906976744186",
    heServices: "311814859.92691839220462850182704019488428745432400",
    heCombined: "1279256720.3920346712743959436875053111633572217659",
  },
};
export const PAIR_FIXTURES: PricePair[] = [
  {
    id: "pipe",
    description: "Pipa baja 4 inci",
    category: "MATERIAL",
    unit: "m",
    oe: "100000",
    offer: "125000",
    source: "RAB!E12 / Penawaran!F12",
    matched: true,
    confirmed: false,
    revision: 1,
  },
  {
    id: "install",
    description: "Pemasangan pipa",
    category: "SERVICE",
    unit: "m",
    oe: "50000",
    offer: "55000",
    source: "RAB!E13 / Penawaran!F13",
    matched: true,
    confirmed: false,
    revision: 1,
  },
  {
    id: "valve",
    description: "Katup gate 4 inci",
    category: "MATERIAL",
    unit: "unit",
    oe: "850000",
    offer: "680000",
    source: "RAB!E14 / Penawaran!F14",
    matched: false,
    confirmed: false,
    revision: 1,
  },
];
export const HISTORICAL_FIXTURES: HistoricalItem[] = [
  "2024",
  "2025",
  "2026",
].map((period, index) => ({
  id: `reference-${period}`,
  documentName: `OE-Historis-${period}.xlsx`,
  description: "Pengecatan tangki",
  functionName: "Maintenance",
  period,
  unit: "m²",
  price: ["85000", "90000", "95000"][index],
  source: "Harga · E5",
  comparable: false,
}));
