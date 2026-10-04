import type * as React from "react";

export interface ProcurementDetailModel {
  id: string | undefined;
  state: import("../../modules/procurement/application/queries").ProcurementData;
  setParams: import("react-router").SetURLSearchParams;
  tab: string;
  p: import("../../modules/procurement/domain/models").Procurement | undefined;
  vendorOpen: boolean;
  setVendorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  vendorName: string;
  setVendorName: React.Dispatch<React.SetStateAction<string>>;
  docs: import("../../modules/documents/domain/models").DocumentRecord[];
  vendors: import("../../modules/procurement/domain/models").Vendor[];
  results: import("../../modules/evaluations/domain/models").Snapshot[];
  addVendor: (e: React.FormEvent<Element>) => Promise<void>;
}

export interface VendorDocumentsModel {
  id: string | undefined;
  vendorId: string | undefined;
  state: import("../../modules/procurement/application/queries").ProcurementData;
  procurement: import("../../modules/procurement/domain/models").Procurement | undefined;
  vendor: import("../../modules/procurement/domain/models").Vendor | undefined;
  backUrl: string;
}
