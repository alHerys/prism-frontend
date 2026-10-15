import { createHash } from "node:crypto";
import oe from "../local/fixtures/oe-review.json";
import offers from "../local/fixtures/offer-review.json";
import registry from "../local/fixtures/file-registry.json";
import type { SpreadsheetSheet } from "../../modules/documents/domain/spreadsheet";
import type { PertaminaCatalog } from "./catalog";

// Independently authored data. No original document data belongs in this helper.
export function syntheticCatalog(): PertaminaCatalog {
  const a5 = ["A", "B"].map((key, index) => {
    const sha256 = createHash("sha256").update(`%PDF-1.7\n% Synthetic ${key}\n%%EOF`).digest("hex");
    return { sourceId: `HEA-00${index + 1}`, candidate: { sha256, vendorName: `Penyedia ${key}`, values: { hpb: index ? "1200" : "1000", hpj: "400", knb: "5", tkdn_barang: "0.5", tkdn_jasa: "0.4" }, sources: [{ field: "hpb", location: "Halaman 1", quote: "Synthetic source" }], warnings: index ? [] : ["Periksa subtotal sumber."] } };
  });
  return { version: 1, procurementName: "Pekerjaan sintetis", functionName: "Pemeliharaan", preferences: { preferensi_barang: "0.25", preferensi_jasa: "0.075" }, a5, referenceHash: "f".repeat(64),
    sources: [
      ...a5.map(a => ({ id: a.sourceId, name: `${a.sourceId}.pdf`, sha256: a.candidate.sha256, path: `/_pertamina/source/${a.sourceId}`, kind: "FORM_A5" as const })),
      ...(["OE", "OFFER"] as const).map((kind, index) => ({ id: `PD-00${index + 1}`, name: `${kind}.xlsx`, sha256: registry.find(s => s.id === (kind === "OE" ? "oe-terminal" : "bid-nusa"))!.sha256, path: `/_pertamina/source/PD-00${index + 1}`, kind })),
    ],
    priceRows: [{ description: "Komponen sintetis", category: "MATERIAL", unit: "m", oe: "100", offer: "125", percentageAgainstOE: "1.25", classification: "TIMPANG" }],
  };
}
export const syntheticSheets = () => ({ oe: structuredClone(oe) as SpreadsheetSheet, offer: structuredClone(offers["bid-nusa"]) as SpreadsheetSheet });
