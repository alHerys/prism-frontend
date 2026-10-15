import { currentPriceSources } from "../../modules/price-deviation/application/queries";
import type { LocalStore } from "../local/store";
import type { PertaminaCatalog } from "./catalog";
import { decimalHEACalculator, localHEAPolicy } from "../../modules/hea/infrastructure/decimal-calculator";
import { snapshot } from "../local/snapshots";
import { copy } from "../../shared/kernel/validation";
import { vendorNameKey } from "../../shared/kernel/vendor-name";

const active = (d: { removedAt?: string; supersededBy?: string }) => !d.removedAt && !d.supersededBy;

export function createEvaluationCoordinator(store: LocalStore, catalog: PertaminaCatalog) {
  const hea = new Map<string, string>(), price = new Map<string, string>();
  const heaInputs = new Map<string, string>(), priceInputs = new Map<string, string>();
  function refreshHEA(procurementId: string) {
    const p = store.proc(procurementId);
    const vendors = store.state.vendors.filter(v => v.procurementId === procurementId);
    const documents = store.state.documents.filter(d => d.procurementId === procurementId && d.kind === "FORM_A5" && active(d) && d.status === "CONFIRMED" && d.reviewed && vendors.some(v => v.id === d.vendorId));
    if (!p.preferences || !p.preferenceConfirmed || !documents.length) { hea.delete(procurementId); heaInputs.delete(procurementId); return undefined; }
    const inputs = { procurement: copy(p), documents: copy(documents), vendors: copy(vendors), policy: localHEAPolicy };
    const fingerprint = JSON.stringify(inputs);
    if (heaInputs.get(procurementId) === fingerprint) return store.state.snapshots.find(s => s.id === hea.get(procurementId));
    const rows = decimalHEACalculator.evaluate(documents.map(d => ({ vendorId: d.vendorId!, vendorName: vendors.find(v => v.id === d.vendorId)!.name, source: d.name, values: d.reviewed! })), p.preferences);
    const excluded = vendors.filter(v => !documents.some(d => d.vendorId === v.id)).map(v => v.name);
    const result = snapshot(store, { procurementId, module: "HEA", rows, excluded, status: excluded.length ? "PARTIAL" : "COMPLETE", inputs,
      policy: "hea-sample-v1; TKDN barang ≥ 25%, jasa ≥ 30%; presisi 50 digit; tampilan HALF_UP." });
    heaInputs.set(procurementId, fingerprint); hea.set(procurementId, result.id);
    return result;
  }
  const priceKey = (procurementId: string, vendorId: string) => JSON.stringify([procurementId, vendorId]);
  function refreshPrice(procurementId: string) {
    const documents = store.state.documents.filter(d => d.procurementId === procurementId && active(d));
    const vendors = store.state.vendors.filter(v => v.procurementId === procurementId);
    const oeHash = catalog.sources.find(s => s.kind === "OE")!.sha256;
    const offerHash = catalog.sources.find(s => s.kind === "OFFER")!.sha256;
    const a5 = catalog.a5.find(a => a.sourceId === "HEA-001")!;
    for (const vendor of vendors) {
      const key = priceKey(procurementId, vendor.id);
      const { oe, offer } = currentPriceSources(documents, procurementId, vendor.id);
      const knownOwner = vendorNameKey(vendor.name) === vendorNameKey(a5.candidate.vendorName) || documents.some(d => d.vendorId === vendor.id && d.kind === "FORM_A5" && d.sha256 === a5.candidate.sha256);
      if (!knownOwner || !oe || oe.status !== "CONFIRMED" || oe.sha256 !== oeHash || !offer || offer.status !== "CONFIRMED" || offer.sha256 !== offerHash) {
        price.delete(key); priceInputs.delete(key); continue;
      }
      // Review revisions are deliberately absent: table corrections do not change this report.
      const fingerprint = `${oe.id}/${offer.id}/${oeHash}/${offerHash}`;
      if (priceInputs.get(key) === fingerprint) continue;
      const result = snapshot(store, { procurementId, module: "PRICE_DEVIATION", vendorId: vendor.id, vendorName: vendor.name,
        rows: copy(catalog.priceRows), excluded: [], status: "COMPLETE",
        inputs: { oe: copy(oe), offer: copy(offer), referenceHash: catalog.referenceHash },
        policy: "Harga satuan material dan jasa; harga penawaran > 110% OE diklasifikasikan timpang." });
      priceInputs.set(key, fingerprint); price.set(key, result.id);
    }
    for (const key of price.keys()) {
      const [id, vendorId] = JSON.parse(key) as [string, string];
      if (id === procurementId && !vendors.some(v => v.id === vendorId)) { price.delete(key); priceInputs.delete(key); }
    }
  }
  return { refreshHEA, refreshPrice, currentHEA: (id: string) => hea.get(id), currentPrice: (id: string, vendorId: string) => price.get(priceKey(id, vendorId)) };
}
export type EvaluationCoordinator = ReturnType<typeof createEvaluationCoordinator>;
