import type { A5Values, Source } from "./models";
import { decimal, requireText } from "../../../shared/kernel/validation";
import { vendorNameKey } from "../../../shared/kernel/vendor-name";

export const a5Keys = ["hpb", "hpj", "knb", "tkdn_barang", "tkdn_jasa"] as const;
export type IntakePhase = "queued" | "reading" | "ready" | "failed" | "skipped" | "confirmed";
export interface A5Candidate {
  sha256: string;
  vendorName: string;
  values: A5Values;
  sources: Source[];
  warnings: string[];
}
export interface IntakeSource { id: string; name: string; path: string; sha256: string; }
export interface ExistingA5Vendor {
  id: string; name: string;
  document?: { id: string; name: string; revision: number; sha256?: string };
}
export interface IntakeItem {
  id: string; source: IntakeSource; phase: IntakePhase;
  candidate?: A5Candidate;
  vendorName: string; values: A5Values; acknowledged: boolean;
  percentInputs?: { tkdn_barang: string; tkdn_jasa: string };
  error?: string; publishing?: boolean;
  target?: ExistingA5Vendor;
  documentId?: string;
}
export interface IntakeBatch {
  id: string; procurementId: string; items: IntakeItem[];
  rejected: { name: string; reason: string }[];
}
export interface IntakeData { batches: IntakeBatch[]; }
export interface IntakeConflict { key: string; name: string; items: IntakeItem[]; existing?: ExistingA5Vendor; }
export const emptyA5 = (): A5Values => ({ hpb: "", hpj: "", knb: "", tkdn_barang: "", tkdn_jasa: "" });
export const unfinished = (item: IntakeItem) => !["skipped", "confirmed"].includes(item.phase);
export function intakeConflicts(batch: IntakeBatch, existing: ExistingA5Vendor[]): IntakeConflict[] {
  const groups = new Map<string, IntakeItem[]>();
  for (const item of batch.items) {
    if (item.phase !== "ready" || !item.vendorName.trim()) continue;
    const key = vendorNameKey(item.vendorName);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups].flatMap(([key, items]) => {
    const vendor = existing.find(v => vendorNameKey(v.name) === key);
    const approvedTarget = items.length === 1 && vendor && items[0].target?.id === vendor.id && items[0].target?.document?.id === vendor.document?.id && items[0].target?.document?.revision === vendor.document?.revision;
    return items.length > 1 || (vendor && !approvedTarget) ? [{ key, name: items[0].vendorName, items, existing: vendor }] : [];
  });
}
export function validateIntakeDraft(item: IntakeItem) {
  requireText(item.vendorName, "Nama vendor");
  if (item.vendorName.trim().length > 200 || /[\x00-\x1f]/.test(item.vendorName)) throw new Error("Nama vendor tidak valid.");
  for (const key of a5Keys) decimal(item.values[key], key.startsWith("tkdn"));
  if (item.candidate?.warnings.length && !item.acknowledged) throw new Error("Periksa dan akui peringatan sebelum konfirmasi.");
}

export function intakeHashConflicts(batch: IntakeBatch): IntakeConflict[] {
  const groups = new Map<string, IntakeItem[]>();
  for (const item of batch.items.filter(unfinished)) {
    const key = item.source.sha256;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups].flatMap(([key, items]) => items.length > 1 ? [{ key: `hash:${key}`, name: "PDF identik", items }] : []);
}
