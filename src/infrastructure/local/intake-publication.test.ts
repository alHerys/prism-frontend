import { it, expect } from "vitest";
import { FIXTURE_PREFERENCES } from "./fixtures";
import { createLocalRuntime } from "./runtime";
import type { IntakeItem } from "../../modules/documents/domain/intake";

const values = { hpb: "1000", hpj: "300", knb: "25", tkdn_barang: "0.4", tkdn_jasa: "0.3" };
function entry(name: string, hash: string): IntakeItem {
  return { id: "item", phase: "ready", source: { id: "source-import", path: "blob:source", name: "import.pdf", sha256: hash }, candidate: { sha256: hash, vendorName: name, values, warnings: [], sources: [{ field: "vendor_name", location: "Identitas", quote: name }] }, values: { ...values }, vendorName: name, acknowledged: false };
}
it("atomically publishes vendor plus confirmed document with original candidate/evidence", async () => {
  const runtime = createLocalRuntime(false); const p = await runtime.procurement.gateway.createProcurement({ name: "P", number: "N", functionName: "F" });
  const item = entry("PT Baru", "hash"); item.values = { ...values, hpj: "456" };
  const notifications: number[] = []; runtime.procurement.queries.subscribe(() => notifications.push(runtime.procurement.queries.getSnapshot().vendors.length));
  await runtime.intake.publication.publish(p.id, item);
  expect(notifications).toEqual([1]);
  const d = runtime.documents.queries.getSnapshot().documents[0];
  expect(d.status).toBe("CONFIRMED"); expect(d.candidate?.hpj).toBe("300"); expect(d.reviewed?.hpj).toBe("456"); expect(d.sources[0].quote).toBe("PT Baru"); expect(d.sourceId).toBe("source-import");
  await expect(runtime.intake.publication.publish(p.id, item)).rejects.toThrow();
  expect(runtime.procurement.queries.getSnapshot().vendors).toHaveLength(1);
});
it("replaces only the chosen A5, preserving offer and rejecting stale or invalid requests without mutation", async () => {
  const runtime = createLocalRuntime(true, true);
  const target = runtime.intake.publication.existing("proc-terminal").find(v => v.name === "PT Nusa Teknik Mandiri")!;
  const before = runtime.documents.queries.getSnapshot();
  const offer = before.documents.find(d => d.vendorId === target.id && d.kind === "OFFER")!;
  const item = entry(target.name, "replacement-hash"); item.target = target;
  const bad = { ...item, target: { ...target, document: { ...target.document!, revision: 999 } } };
  await expect(runtime.intake.publication.publish("proc-terminal", bad)).rejects.toThrow("berubah");
  expect(runtime.documents.queries.getSnapshot()).toEqual(before);
  const result = await runtime.intake.publication.publish("proc-terminal", item);
  const docs = runtime.documents.queries.getSnapshot().documents;
  expect(docs.find(d => d.id === target.document!.id)?.supersededBy).toBe(result.documentId);
  expect(docs.find(d => d.id === offer.id)).toEqual(offer);
  expect(runtime.procurement.queries.getSnapshot().vendors).toHaveLength(before.vendors.length);
  const p = runtime.procurement.queries.getSnapshot().procurements.find(p => p.id === "proc-terminal")!;
  const reviewed = await runtime.hea.gateway.setPreferences(p.id, FIXTURE_PREFERENCES, p.preferenceRevision);
  await runtime.hea.gateway.confirmPreferences(p.id, reviewed.preferenceRevision);
  await expect(runtime.hea.gateway.evaluateHEA("proc-terminal", [result.documentId])).rejects.toThrow("belum tersedia");
});
