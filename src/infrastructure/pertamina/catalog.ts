import type { A5Candidate } from "../../modules/documents/domain/intake";
import type { DocumentSource } from "../../modules/documents/application/ports";
import type { Preferences } from "../../modules/hea/domain/models";
import type { ResultRow } from "../../modules/evaluations/domain/models";
import { decimal } from "../../shared/kernel/validation";

export interface RegisteredSource extends DocumentSource { sha256: string; }
export interface PertaminaCatalog {
  version: 1;
  procurementName: string;
  functionName: string;
  preferences: Preferences;
  sources: RegisteredSource[];
  a5: { sourceId: string; candidate: A5Candidate }[];
  priceRows: ResultRow[];
  referenceHash: string;
}

export function validateCatalog(value: unknown): PertaminaCatalog {
  const catalog = value as PertaminaCatalog;
  if (!catalog || catalog.version !== 1 || typeof catalog.procurementName !== "string" || !catalog.procurementName.trim() || typeof catalog.functionName !== "string" || !Array.isArray(catalog.sources) || catalog.sources.length !== 4 || !Array.isArray(catalog.a5) || catalog.a5.length !== 2 || !Array.isArray(catalog.priceRows) || !catalog.priceRows.length)
    throw new Error("Paket sumber lokal tidak valid. Siapkan ulang paket.");
  const ids = new Set<string>();
  for (const source of catalog.sources) {
    if (!/^(PD|HEA)-\d{3}$/.test(source.id) || ids.has(source.id) || source.path !== `/_pertamina/source/${source.id}` || !/^[a-f0-9]{64}$/.test(source.sha256) || typeof source.name !== "string" || !["FORM_A5", "OE", "OFFER"].includes(source.kind)) throw new Error("Identitas sumber lokal tidak valid.");
    ids.add(source.id);
  }
  decimal(catalog.preferences.preferensi_barang, true); decimal(catalog.preferences.preferensi_jasa, true);
  for (const entry of catalog.a5) {
    const source = catalog.sources.find(s => s.id === entry.sourceId && s.kind === "FORM_A5");
    if (!source || entry.candidate.sha256 !== source.sha256 || !entry.candidate.vendorName?.trim() || !Array.isArray(entry.candidate.sources) || !Array.isArray(entry.candidate.warnings)) throw new Error("Kandidat A5 tidak sesuai sumber.");
    for (const key of ["hpb", "hpj", "knb", "tkdn_barang", "tkdn_jasa"] as const) decimal(entry.candidate.values[key], key.startsWith("tkdn"));
  }
  for (const row of catalog.priceRows) {
    if (!row.description?.trim() || !["MATERIAL", "SERVICE"].includes(row.category ?? "") || !["TIMPANG", "TIDAK_TIMPANG"].includes(row.classification ?? "")) throw new Error("Hasil harga sumber tidak valid.");
    decimal(row.oe ?? ""); decimal(row.offer ?? ""); decimal(row.percentageAgainstOE ?? "");
  }
  return catalog;
}
