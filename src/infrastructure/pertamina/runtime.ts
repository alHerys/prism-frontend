import { resolvePriceSnapshotScope } from "../../modules/price-deviation/application/queries";
import { createLocalRuntime } from "../local/runtime-factory";
import { createOwnerEstimateAdapter } from "../local/owner-estimate";
import { createOfferSpreadsheetAdapter } from "../local/offer-spreadsheet";
import { createA5Publication } from "../local/intake-publication";
import { parseOwnerEstimate } from "../owner-estimate/parser";
import { parseOfferSpreadsheet } from "../spreadsheet/offer-parser";
import type { SpreadsheetSheet } from "../../modules/documents/domain/spreadsheet";
import type { PertaminaCatalog } from "./catalog";
import { validateCatalog } from "./catalog";
import { createPreparedA5Extraction, recognizeSource } from "./sources";
import { createEvaluationCoordinator } from "./evaluations";
import type { EvaluationCoordinator } from "./evaluations";
import { createSavingDocuments } from "./documents";
import { createCalculatingHEA } from "./preferences";
import { seedPertamina } from "./seed";
import { currentResultStore } from "./result-store";
import { copy } from "../../shared/kernel/validation";
import { addVendor } from "../local/procurement";

export function createPertaminaRuntime(catalog: PertaminaCatalog, sheets: { oe: SpreadsheetSheet; offer: SpreadsheetSheet }) {
  let evaluations!: EvaluationCoordinator;
  const runtime = createLocalRuntime(false, false, undefined, (base, store) => {
    evaluations = createEvaluationCoordinator(store, catalog);
    const saved = (documentId: string) => {
      const document = store.doc(documentId); document.status = "CONFIRMED";
      evaluations.refreshPrice(document.procurementId);
    };
    const published = (documentId: string) => {
      const document = store.doc(documentId);
      if (document.kind === "OFFER") {
        for (const older of store.state.documents) if (older.id !== document.id && older.procurementId === document.procurementId && older.vendorId === document.vendorId && older.kind === "OFFER" && !older.removedAt && !older.supersededBy) older.supersededBy = document.id;
      }
      evaluations.refreshPrice(document.procurementId);
    };
    const oe = createOwnerEstimateAdapter(store, { saved, published }), offer = createOfferSpreadsheetAdapter(store, { saved, published });
    const ownerEstimate = { ...oe,
      prepare: async (...args: Parameters<typeof oe.prepare>) => { const known = await recognizeSource(catalog, args[0], "OE"); return oe.prepare(known.file, args[1]); },
      saveAndConfirm: (input: Parameters<typeof oe.saveAndConfirm>[0]) => oe.saveAndConfirm({ ...input, acknowledged: true }),
    };
    const offerSpreadsheet = { ...offer,
      prepare: async (...args: Parameters<typeof offer.prepare>) => { const known = await recognizeSource(catalog, args[0], "OFFER"); return offer.prepare(known.file, args[1]); },
      saveAndConfirm: (input: Parameters<typeof offer.saveAndConfirm>[0]) => offer.saveAndConfirm({ ...input, acknowledged: true }),
    };
    const publication = createA5Publication(store, evaluations.refreshHEA);
    seedPertamina(store, catalog, sheets, evaluations);
    return {
      ...base, reviewWorkflow: "SAVE_CONFIRMS", ownerEstimate, offerSpreadsheet,
      documentsGateway: createSavingDocuments(store, base.documentsGateway, evaluations, catalog),
      procurementGateway: { ...base.procurementGateway, addVendor: (...args) => addVendor(store, ...args, evaluations.refreshHEA) },
      heaGateway: createCalculatingHEA(store, evaluations),
      intake: { ...base.intake, extraction: createPreparedA5Extraction(catalog), publication },
      processing: {
        process: async (file, kind, progress) => { progress("Membaca dokumen"); return (await recognizeSource(catalog, file, kind)).source; },
        availableSources: () => [...catalog.sources.map(copy), ...base.intake.assets.sources().map(s => ({ ...s, kind: "FORM_A5" as const })), ...ownerEstimate.sources(), ...offerSpreadsheet.sources()],
      },
    };
  });
  return { ...runtime,
    hea: { ...runtime.hea, queries: currentResultStore(runtime.hea.queries, s => s.module !== "HEA" || evaluations.currentHEA(s.procurementId) === s.id) },
    priceDeviation: { ...runtime.priceDeviation, queries: currentResultStore(runtime.priceDeviation.queries, s => s.module !== "PRICE_DEVIATION" || evaluations.currentPrice(s.procurementId, resolvePriceSnapshotScope(s)?.vendorId ?? "") === s.id) },
  };
}

export async function loadPertaminaRuntime() {
  const response = await fetch("/_pertamina/catalog.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Data pengadaan belum dapat dimuat. Coba muat ulang halaman.");
  const catalog = validateCatalog(await response.json());
  const read = async (kind: "OE" | "OFFER") => {
    const source = catalog.sources.find(s => s.kind === kind)!;
    const response = await fetch(source.path);
    if (!response.ok) throw new Error("Sumber spreadsheet tidak dapat dibuka.");
    const bytes = await response.arrayBuffer();
    const known = await recognizeSource(catalog, { name: source.name, size: bytes.byteLength, arrayBuffer: async () => bytes }, kind);
    const sheets = await (kind === "OE" ? parseOwnerEstimate : parseOfferSpreadsheet)(await known.file.arrayBuffer());
    if (sheets.length !== 1) throw new Error("Paket sumber harus memiliki satu tabel detail terpilih.");
    return sheets[0];
  };
  const [oe, offer] = await Promise.all([read("OE"), read("OFFER")]);
  return createPertaminaRuntime(catalog, { oe, offer });
}
