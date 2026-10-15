import type { Snapshot } from "../../evaluations/domain/models";
import { DomainError } from "../../../shared/kernel/validation";
import { vendorNameKey } from "../../../shared/kernel/vendor-name";

type ScopedSnapshot = Pick<Snapshot, "module" | "procurementId" | "vendorId" | "vendorName" | "rows" | "inputs">;
interface VendorIdentity { id: string; name: string; procurementId: string; }
interface SourceIdentity { id: string; name: string; procurementId: string; kind: string; vendorId?: string; sha256?: string; }
export interface PriceSnapshotScope {
  vendorId: string;
  vendorName?: string;
  oe: SourceIdentity;
  offer: SourceIdentity;
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function source(value: unknown, kind: string, procurementId: string): SourceIdentity | undefined {
  if (!record(value) || value.kind !== kind || value.procurementId !== procurementId || typeof value.id !== "string" || !value.id.trim() || typeof value.name !== "string" || !value.name.trim()) return undefined;
  if (value.sha256 !== undefined && (typeof value.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.sha256))) return undefined;
  if (value.vendorId !== undefined && (typeof value.vendorId !== "string" || !value.vendorId.trim())) return undefined;
  return { id: value.id, name: value.name, kind, procurementId, vendorId: value.vendorId as string | undefined, sha256: typeof value.sha256 === "string" ? value.sha256 : undefined };
}

/** Identity comes from the saved offer, never from a filename or result ordering. */
export function resolvePriceSnapshotScope(snapshot: ScopedSnapshot, vendors?: readonly VendorIdentity[]): PriceSnapshotScope | undefined {
  if (snapshot.module !== "PRICE_DEVIATION" || !record(snapshot.inputs)) return undefined;
  const oe = source(snapshot.inputs.oe, "OE", snapshot.procurementId);
  const offer = source(snapshot.inputs.offer, "OFFER", snapshot.procurementId);
  if (!oe || !offer?.vendorId || oe.vendorId || oe.id === offer.id) return undefined;
  if (snapshot.vendorId !== undefined && snapshot.vendorId !== offer.vendorId) return undefined;
  const vendor = vendors?.find(v => v.id === offer.vendorId && v.procurementId === snapshot.procurementId);
  if (vendors && !vendor) return undefined;
  if (vendor && snapshot.vendorName !== undefined && vendorNameKey(snapshot.vendorName) !== vendorNameKey(vendor.name)) return undefined;
  const vendorName = snapshot.vendorName?.trim() || vendor?.name.trim();
  if (snapshot.vendorName !== undefined && !snapshot.vendorName.trim()) return undefined;
  if (snapshot.rows.some(row => (row.vendorId !== undefined && row.vendorId !== offer.vendorId) ||
    (row.vendorName !== undefined && (!vendorName || vendorNameKey(row.vendorName) !== vendorNameKey(vendorName))))) return undefined;
  return { vendorId: offer.vendorId, vendorName, oe, offer };
}

export function requirePriceSnapshot(snapshot: Snapshot, vendors?: readonly VendorIdentity[]): Snapshot & { vendorId: string; vendorName: string } {
  const scope = resolvePriceSnapshotScope(snapshot, vendors);
  if (!scope?.vendorName) throw new DomainError("WRONG_SCOPE", "Identitas vendor atau sumber hasil Harga Timpang tidak konsisten. Hasil belum dapat diekspor.");
  return { ...snapshot, vendorId: scope.vendorId, vendorName: scope.vendorName };
}

interface CurrentSource { procurementId: string; kind: string; vendorId?: string; uploadedAt: string; removedAt?: string; supersededBy?: string; }
export function currentPriceSources<T extends CurrentSource>(documents: readonly T[], procurementId: string, vendorId: string) {
  const active = documents.filter(d => d.procurementId === procurementId && !d.removedAt && !d.supersededBy)
    .sort((a, b) => (Date.parse(b.uploadedAt) || 0) - (Date.parse(a.uploadedAt) || 0));
  return { oe: active.find(d => d.kind === "OE"), offer: active.find(d => d.kind === "OFFER" && d.vendorId === vendorId) };
}
