import { toLocalDocument } from "./document-mapping";
import type { LocalUploadInput } from "./state";
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
    uploadRegisteredDocument: async ({ fixtureId, ...input }: LocalUploadInput) => toLocalDocument(await runtime.documents.gateway.uploadDocument({ ...input, sourceId: fixtureId })),
    reviewDocument: async (...args: Parameters<typeof runtime.documents.gateway.reviewDocument>) => toLocalDocument(await runtime.documents.gateway.reviewDocument(...args)),
    confirmDocument: async (...args: Parameters<typeof runtime.documents.gateway.confirmDocument>) => toLocalDocument(await runtime.documents.gateway.confirmDocument(...args)),
    selectGroup: async (...args: Parameters<typeof runtime.priceDeviation.gateway.selectGroup>) => toLocalDocument(await runtime.priceDeviation.gateway.selectGroup(...args)),
    reviewPairs: async (...args: Parameters<typeof runtime.priceDeviation.gateway.reviewPairs>) => toLocalDocument(await runtime.priceDeviation.gateway.reviewPairs(...args)),
    confirmPairs: async (...args: Parameters<typeof runtime.priceDeviation.gateway.confirmPairs>) => toLocalDocument(await runtime.priceDeviation.gateway.confirmPairs(...args)),
    getPreparedStatistics: runtime.historicalPrices.gateway.getHistoricalStatistics,
    subscribe: runtime.procurement.queries.subscribe,
    getState: () => {
      if (version !== seen) {
        const p = runtime.procurement.queries.getSnapshot();
        const h = runtime.historicalPrices.queries.getSnapshot();
        view = Object.freeze({ procurements: p.procurements, vendors: p.vendors, documents: Object.freeze(p.documents.map((document) => Object.freeze(toLocalDocument(document)))) as unknown as LocalState["documents"],
          snapshots: p.snapshots, historicalItems: h.historicalItems, events: p.events, estimates: h.estimates });
        seen = version;
      }
      return view;
    },
  };
}
