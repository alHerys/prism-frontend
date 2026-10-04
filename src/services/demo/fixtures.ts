import type { A5Values, HistoricalItem, PricePair } from "../../shared/model/session";
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
export const DEMO_PREFERENCES = {
  preferensi_barang: "0.15",
  preferensi_jasa: "0.075",
};
export const HEA_RESULTS: Record<string, string> = {
  "a5-nusa": "1261794759.4224293029478248835170918485030216358352",
  "a5-borneo": "1297256720.3920346712743959436875053111633572217659",
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
