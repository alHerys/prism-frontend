export type DocumentKind = "FORM_A5" | "OE" | "OFFER" | "HISTORICAL_OE";
export type Status = "REVIEW_REQUIRED" | "CONFIRMED";
export type Module = "HEA" | "PRICE_DEVIATION" | "BANK" | "PROCUREMENT";
export interface A5Values {
  hpb: string;
  hpj: string;
  tkdn_barang: string;
  tkdn_jasa: string;
  knb: string;
}
export interface Preferences {
  preferensi_barang: string;
  preferensi_jasa: string;
}
export interface Procurement {
  id: string;
  name: string;
  number: string;
  functionName: string;
  createdAt: string;
  preferences?: Preferences;
  preferenceRevision: number;
  preferenceConfirmed: boolean;
}
export interface Vendor {
  id: string;
  procurementId: string;
  name: string;
}
export interface Source {
  field: string;
  location: string;
  quote: string;
}
export interface PriceSourceItem {
  id: string;
  description: string;
  category: "MATERIAL" | "SERVICE";
  unit: string;
  oe: string;
  offer: string;
  source: string;
}
export interface PricePair {
  id: string;
  description: string;
  category: "MATERIAL" | "SERVICE";
  unit: string;
  oe: string;
  offer: string;
  source: string;
  matched: boolean;
  confirmed: boolean;
  revision: number;
}
export interface DocumentRecord {
  id: string;
  procurementId: string;
  vendorId?: string;
  fixtureId: string;
  name: string;
  kind: DocumentKind;
  uploadedAt: string;
  revision: number;
  status: Status;
  candidate?: A5Values;
  reviewed?: A5Values;
  warnings: string[];
  acknowledged: boolean;
  sources: Source[];
  groups: string[];
  selectedGroup?: string;
  pairs: PricePair[];
  functionName?: string;
  period?: string;
  published: boolean;
  historicalItems?: HistoricalItem[];
  priceItems?: PriceSourceItem[];
}
export interface ResultRow {
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
export interface Snapshot {
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
export interface HistoricalItem {
  id: string;
  documentName: string;
  description: string;
  functionName: string;
  period: string;
  unit: string;
  price: string;
  source: string;
  comparable: boolean;
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
export interface Estimate {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  referenceIds: string[];
  unitPrice: string;
  total: string;
  min: string;
  max: string;
  median: string;
  createdAt: string;
}
export interface DemoState {
  procurements: Procurement[];
  vendors: Vendor[];
  documents: DocumentRecord[];
  snapshots: Snapshot[];
  historicalItems: HistoricalItem[];
  events: Activity[];
  estimates: Estimate[];
}
export interface UploadInput {
  procurementId: string;
  vendorId?: string;
  kind: DocumentKind;
  fixtureId: string;
  name: string;
  functionName?: string;
  period?: string;
}
export interface HistoricalStatistics {
  description: string;
  unit: string;
  min: string;
  median: string;
  max: string;
  observations: {
    id: string;
    period: string;
    price: string;
  }[];
  chart: {
    points: {
      x: number;
      y: number;
      period: string;
      price: string;
    }[];
    ticks: {
      y: number;
      price: string;
    }[];
  };
}
