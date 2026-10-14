import type { PriceSourceItem, PricePair } from "../../price-deviation/domain/models";
import type { HistoricalItem } from "../../historical-prices/domain/models";
import type { SpreadsheetReview } from "./spreadsheet";
import type { OEReview } from "./owner-estimate";

export type DocumentKind = "FORM_A5" | "OE" | "OFFER" | "HISTORICAL_OE";

export type Status = "REVIEW_REQUIRED" | "CONFIRMED";

export interface A5Values {
  hpb: string;
  hpj: string;
  tkdn_barang: string;
  tkdn_jasa: string;
  knb: string;
}

export interface Source {
  field: string;
  location: string;
  quote: string;
}

export interface DocumentRecord {
  id: string;
  procurementId: string;
  vendorId?: string;
  sourceId: string;
  sha256?: string;
  candidateVendorName?: string;
  name: string;
  kind: DocumentKind;
  uploadedAt: string;
  revision: number;
  status: Status;
  supersededBy?: string;
  removedAt?: string;
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
  ownerEstimate?: OEReview;
  offerSpreadsheet?: SpreadsheetReview & { status: Status; acknowledged: boolean };
}

export interface UploadInput {
  procurementId: string;
  vendorId?: string;
  kind: DocumentKind;
  sourceId: string;
  name: string;
  functionName?: string;
  period?: string;
  replacement?: { id: string; revision: number };
}
