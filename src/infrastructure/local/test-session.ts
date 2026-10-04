import { createLocalRuntime } from "./runtime";
import type { LocalState } from "./state";
export function createTestSession(seed = true, prepared = false, runtime = createLocalRuntime(seed, prepared)) {
  let view: LocalState;
  let version = 0;
  let seen = -1;
  runtime.procurement.queries.subscribe(() => version++);
  return {
    ...runtime.procurement.gateway, ...runtime.documents.gateway, ...runtime.hea.gateway,
    ...runtime.priceDeviation.gateway, ...runtime.historicalPrices.gateway, ...runtime.evaluations.gateway,
    subscribe: runtime.procurement.queries.subscribe,
    getState: () => {
      if (version !== seen) {
        const p = runtime.procurement.queries.getSnapshot();
        const h = runtime.historicalPrices.queries.getSnapshot();
        view = Object.freeze({ procurements: p.procurements, vendors: p.vendors, documents: p.documents,
          snapshots: p.snapshots, historicalItems: h.historicalItems, events: p.events, estimates: h.estimates });
        seen = version;
      }
      return view;
    },
  };
}
