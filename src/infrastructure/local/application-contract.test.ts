// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createApplication } from "../../app/bootstrap/application";
import { createLocalRuntime } from "./runtime";
import { createHEAUseCases } from "../../modules/hea/application/use-cases";
import { createPriceDeviationUseCases } from "../../modules/price-deviation/application/use-cases";
import type { HEAGateway } from "../../modules/hea/application/ports";
import type { PriceDeviationGateway } from "../../modules/price-deviation/application/ports";
it("uses the same HEA and price-deviation argument/exception contracts with fake and local ports", async () => {
  const runtime = createLocalRuntime(false);
  const error = Object.assign(new Error("Pengadaan tidak ditemukan."), { code: "NOT_FOUND" });
  const hea: HEAGateway = { ...runtime.hea.gateway, evaluateHEA: vi.fn(async () => { throw error; }) };
  const prices: PriceDeviationGateway = { ...runtime.priceDeviation.gateway, evaluateDeviation: vi.fn(async () => { throw error; }) };
  for (const gateways of [{ hea, prices }, { hea: runtime.hea.gateway, prices: runtime.priceDeviation.gateway }]) {
    const delay = vi.fn(async () => {});
    await expect(createHEAUseCases(gateways.hea, delay).evaluateHEA("missing", ["a5"])).rejects.toMatchObject({ code: "NOT_FOUND", message: error.message });
    await expect(createPriceDeviationUseCases(gateways.prices, delay).evaluateDeviation("missing", "oe", "offer")).rejects.toMatchObject({ code: "NOT_FOUND", message: error.message });
    expect(delay.mock.calls).toEqual([[450], [450]]);
  }
  expect(hea.evaluateHEA).toHaveBeenCalledWith("missing", ["a5"]);
  expect(prices.evaluateDeviation).toHaveBeenCalledWith("missing", "oe", "offer");
  expect(runtime.evaluations.queries.getSnapshot().events).toEqual([]);
});
it("keeps historical estimation delay before adapter validation and does not create state on failure", async () => {
  const runtime = createLocalRuntime(false);
  const calls: string[] = [];
  const estimate = vi.fn(async (input: Parameters<typeof runtime.historicalPrices.gateway.estimate>[0]) => {
    calls.push("estimate"); return runtime.historicalPrices.gateway.estimate(input);
  });
  const app = createApplication({ ...runtime, delay: async (ms) => { calls.push(`delay:${ms}`); }, historicalPrices: { ...runtime.historicalPrices, gateway: { ...runtime.historicalPrices.gateway, estimate } } }, { download: async () => {} });
  await expect(app.historicalPrices.commands.estimate({ description: "Tank", quantity: "1", unit: "unknown-unit", referenceIds: [] })).rejects.toMatchObject({ code: "INSUFFICIENT_DATA" });
  expect(calls).toEqual(["delay:800", "estimate"]);
  expect(runtime.historicalPrices.queries.getSnapshot().estimates).toEqual([]);
  expect(runtime.evaluations.queries.getSnapshot().events).toEqual([]);
});
it("preserves uploaded snapshot field order and historical document field omission", async () => {
  const runtime = createLocalRuntime(false);
  const application = createApplication({ ...runtime, delay: async () => {}, processing: {
    process: async (_file, kind) => ({ id: kind === "HISTORICAL_OE" ? "history-2024" : "a5-nusa", name: "Source", path: "/source", kind }),
    availableSources: () => [],
  } }, { download: async () => {} });
  const procurement = await application.procurement.commands.createProcurement({ name: "Test", number: "T-1", functionName: "Maintenance" });
  const vendor = await application.procurement.commands.addVendor(procurement.id, "Nusa");
  const file = { name: "Original.pdf", size: 1, arrayBuffer: async () => new ArrayBuffer(1) };
  const document = await application.documents.commands.upload({ file, procurementId: procurement.id, kind: "FORM_A5", vendorId: vendor.id }, () => {});
  await application.documents.commands.confirmDocument(document.id, document.revision);
  await application.hea.commands.setPreferences(procurement.id, { preferensi_barang: "0.15", preferensi_jasa: "0.075" }, 0);
  await application.hea.commands.confirmPreferences(procurement.id, 1);
  const snapshot = await application.hea.commands.evaluateHEA(procurement.id, [document.id]);
  const inputs = snapshot.inputs as { documents: Record<string, unknown>[] };
  expect(Object.keys(inputs.documents[0]).slice(0, 6)).toEqual(["procurementId", "kind", "vendorId", "fixtureId", "name", "id"]);
  expect(inputs.documents[0].fixtureId).toBe("a5-nusa");
  expect(inputs.documents[0]).not.toHaveProperty("sourceId");
  const historical = await application.documents.commands.upload({ file, procurementId: procurement.id, kind: "HISTORICAL_OE" }, () => {});
  expect(historical).not.toHaveProperty("vendorId");
  expect(Object.keys(historical).slice(0, 5)).toEqual(["procurementId", "kind", "sourceId", "name", "id"]);
});
