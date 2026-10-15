import type { Procurement, Vendor } from "../../procurement/domain/models";
import type { VendorPriceResult } from "../application/vendor-result";
export interface PDPanelModel {
  p: Procurement;
  vendors: Vendor[];
  vendor?: Vendor;
  result: VendorPriceResult;
  selectVendor(id: string): void;
}
