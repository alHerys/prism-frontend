
export type Module = "HEA" | "PRICE_DEVIATION" | "BANK" | "PROCUREMENT";

export interface ResultRow {
  calculation?: HEACalculation;
  vendorId?: string;
  vendorName?: string;
  rank?: number;
  description?: string;
  category?: string;
  unit?: string;
  offer?: string;
  oe?: string;
  deviation?: string;
  percentageAgainstOE?: string;
  classification?: string;
  hea?: string;
  source?: string;
}

/** Decimal strings returned by the calculation adapter, never recomputed by reports. */
export interface HEACalculation {
  total: string;
  tkdnCombined?: string;
  kpb: string;
  kpj: string;
  heGoods: string;
  heServices: string;
  heCombined: string;
}

export interface Snapshot {
  vendorId?: string;
  vendorName?: string;
  id: string;
  procurementId: string;
  module: "HEA" | "PRICE_DEVIATION" | "BANK";
  createdAt: string;
  status: "COMPLETE" | "PARTIAL";
  rows: ResultRow[];
  excluded: string[];
  inputs: unknown;
  policy: string;
}

export interface Activity {
  id: string;
  createdAt: string;
  procurementId?: string;
  module: Module;
  type: string;
  summary: string;
  snapshotId?: string;
}
