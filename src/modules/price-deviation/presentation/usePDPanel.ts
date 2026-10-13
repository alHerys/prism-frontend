import { useSearchParams } from "react-router";
import { usePriceDeviationData } from "./binding";
import type { Procurement } from "../../procurement/domain/models";
import type { PDPanelModel } from "./view-models";

/** Read-only results surface; source selection is no longer part of this page. */
export function usePDPanel({ procurement: p }: { procurement: Procurement }): PDPanelModel {
  const { snapshots } = usePriceDeviationData();
  const [params] = useSearchParams();
  const results = snapshots.filter(s => s.procurementId === p.id && s.module === "PRICE_DEVIATION");
  return { p, chosen: results.find(s => s.id === params.get("hasil")) ?? results[0] };
}
