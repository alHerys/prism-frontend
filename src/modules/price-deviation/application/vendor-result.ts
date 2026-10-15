import type { PriceDeviationData } from "./queries";
import type { Procurement } from "../../procurement/domain/models";
import type { Snapshot } from "../../evaluations/domain/models";
import { requirePriceSnapshot, resolvePriceSnapshotScope, currentPriceSources } from "../domain/snapshot-scope";

export type PriceEmptyReason = "no-vendors" | "choose-vendor" | "no-oe" | "oe-review" | "no-offer" | "offer-review" | "no-result";
export type VendorPriceResult = { kind: "empty"; reason: PriceEmptyReason } | { kind: "ready"; snapshot: Snapshot; offerName: string };

/** A current result must belong to the selected vendor and its current source documents. */
export function vendorPriceResult(data: PriceDeviationData, procurementId: Procurement["id"], vendorId?: string): VendorPriceResult {
  const vendors = data.vendors.filter(v => v.procurementId === procurementId);
  if (!vendors.length) return { kind: "empty", reason: "no-vendors" };
  const vendor = vendors.find(v => v.id === vendorId);
  if (!vendor) return { kind: "empty", reason: "choose-vendor" };
  const { oe, offer } = currentPriceSources(data.documents, procurementId, vendor.id);
  if (!offer) return { kind: "empty", reason: "no-offer" };
  if (!oe) return { kind: "empty", reason: "no-oe" };
  if (oe.status !== "CONFIRMED") return { kind: "empty", reason: "oe-review" };
  if (offer.status !== "CONFIRMED") return { kind: "empty", reason: "offer-review" };
  const snapshot = data.snapshots.filter(s => {
    if (s.procurementId !== procurementId) return false;
    const scope = resolvePriceSnapshotScope(s, vendors);
    return scope?.vendorId === vendor.id && scope.oe.id === oe.id && scope.offer.id === offer.id &&
      (!scope.oe.sha256 || scope.oe.sha256 === oe.sha256) && (!scope.offer.sha256 || scope.offer.sha256 === offer.sha256);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return snapshot ? { kind: "ready", snapshot: requirePriceSnapshot(snapshot, vendors), offerName: offer.name } : { kind: "empty", reason: "no-result" };
}
