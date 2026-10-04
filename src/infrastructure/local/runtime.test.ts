// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createLocalRuntime } from "./runtime";
it("keeps unrelated projections stable and exposes a complete view before notifying", async () => {
  const runtime = createLocalRuntime(false);
  const other = createLocalRuntime(false);
  const prices = runtime.priceDeviation.queries.getSnapshot();
  const listener = vi.fn(() => {
    expect(runtime.procurement.queries.getSnapshot().procurements).toHaveLength(1);
    expect(runtime.evaluations.queries.getSnapshot().events).toHaveLength(1);
  });
  const stop = runtime.procurement.queries.subscribe(listener);
  await runtime.procurement.gateway.createProcurement({ name: "Test", number: "T-1", functionName: "Maintenance" });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(runtime.priceDeviation.queries.getSnapshot()).toBe(prices);
  expect(other.procurement.queries.getSnapshot().procurements).toEqual([]);
  expect(Object.isFrozen(runtime.procurement.queries.getSnapshot().procurements)).toBe(true);
  stop();
  await runtime.procurement.gateway.addVendor(runtime.procurement.queries.getSnapshot().procurements[0].id, "Vendor");
  expect(listener).toHaveBeenCalledTimes(1);
});
