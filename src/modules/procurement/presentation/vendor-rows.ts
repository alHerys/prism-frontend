import type { Vendor } from "../domain/models";
import type { DocumentRecord } from "../../documents/domain/models";

export interface VendorRow {
  vendor: Vendor;
  documentCount: number;
  confirmedCount: number;
  hasA5: boolean;
  hasOffer: boolean;
}

export function vendorRows(vendors: readonly Vendor[], documents: readonly DocumentRecord[]): VendorRow[] {
  const byVendor = new Map<string, DocumentRecord[]>();
  for (const document of documents) {
    if (!document.vendorId || document.supersededBy) continue;
    const owned = byVendor.get(document.vendorId) ?? [];
    owned.push(document);
    byVendor.set(document.vendorId, owned);
  }
  return vendors.map(vendor => {
    const owned = (byVendor.get(vendor.id) ?? []).filter(document => document.procurementId === vendor.procurementId);
    return {
      vendor,
      documentCount: owned.length,
      confirmedCount: owned.filter(document => document.status === "CONFIRMED").length,
      hasA5: owned.some(document => document.kind === "FORM_A5"),
      hasOffer: owned.some(document => document.kind === "OFFER"),
    };
  });
}
