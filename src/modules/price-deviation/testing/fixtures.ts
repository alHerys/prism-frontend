import type { DocumentRecord } from "../../documents/domain/models";
import type { PriceDeviationData } from "../application/queries";
import type { Procurement } from "../../procurement/domain/models";
import type { Snapshot } from "../../evaluations/domain/models";
export const priceProcurement: Procurement = { id: "p", name: "Synthetic procurement", number: "TEST-001", functionName: "Maintenance", createdAt: "", preferenceRevision: 0, preferenceConfirmed: false };
export const priceDocument = (id: string, kind: "OE" | "OFFER", vendorId?: string): DocumentRecord => ({ id, name: id + ".xlsx", procurementId: "p", kind, vendorId, sourceId: id, uploadedAt: "", revision: 1, status: "CONFIRMED", published: false, warnings: [], sources: [], groups: [], pairs: [], acknowledged: true });
export function priceData(): PriceDeviationData {
  const oe = priceDocument("oe", "OE"), a = priceDocument("a-offer", "OFFER", "a"), b = priceDocument("b-offer", "OFFER", "b");
  const snapshot = (offer: DocumentRecord, classification: string): Snapshot => ({ id: `result-${offer.vendorId}`, vendorId: offer.vendorId, vendorName: `Supplier ${offer.vendorId!.toUpperCase()}`,
    procurementId: "p", module: "PRICE_DEVIATION", status: "COMPLETE", policy: "", excluded: [], createdAt: "2026-01-01", inputs: { oe, offer },
    rows: Array.from({ length: offer.vendorId === "a" ? 2 : 3 }, (_, i) => ({ description: `Synthetic component ${i}`, category: i ? "SERVICE" : "MATERIAL", oe: "100", offer: classification === "TIMPANG" ? "125" : "100", percentageAgainstOE: classification === "TIMPANG" ? "1.25" : "1", classification })) });
  return { vendors: [{ id: "a", name: "Supplier A", procurementId: "p" }, { id: "b", name: "Supplier B", procurementId: "p" }, { id: "c", name: "Supplier C", procurementId: "p" }], documents: [oe, a, b], snapshots: [snapshot(a, "TIMPANG"), snapshot(b, "TIDAK_TIMPANG")] };
}
