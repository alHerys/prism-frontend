import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { usePriceDeviationData } from "./binding";
import { vendorPriceResult } from "../application/vendor-result";
import type { Procurement } from "../../procurement/domain/models";
import type { PDPanelModel } from "./view-models";

export function usePDPanel({ procurement: p }: { procurement: Procurement }): PDPanelModel {
  const data = usePriceDeviationData();
  const [params, setParams] = useSearchParams();
  const vendors = data.vendors.filter(v => v.procurementId === p.id);
  const vendor = vendors.find(v => v.id === params.get("vendor"));
  const result = vendorPriceResult(data, p.id, vendor?.id);
  const resultId = result.kind === "ready" ? result.snapshot.id : undefined;
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (!vendor) next.delete("vendor");
    if (next.has("hasil") && next.get("hasil") !== resultId) next.delete("hasil");
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [params, setParams, vendor, resultId]);
  return { p, vendors, vendor, result, selectVendor: id => {
    const next = new URLSearchParams(params);
    next.set("vendor", id); next.delete("hasil");
    setParams(next);
  } };
}
