import type { PDPanelModel } from "./view-models";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { usePriceDeviationCommands, usePriceDeviationData } from "./binding";
import { errorMessage } from "../../../shared/kernel/error-message";
import type { Procurement } from "../../procurement/domain/models";
import { useToast } from "../../../shared/ui/toast-provider";

export function usePDPanel({ procurement: p }: { procurement: Procurement }) : PDPanelModel {
  const service = usePriceDeviationCommands();
  const state = usePriceDeviationData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const docs = state.documents.filter((d) => d.procurementId === p.id);
  const [oe, setOe] = useState("");
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen =
    state.snapshots.find(
      (s) =>
        s.id === params.get("hasil") &&
        s.procurementId === p.id &&
        s.module === "PRICE_DEVIATION",
    ) ||
    state.snapshots.find(
      (s) => s.procurementId === p.id && s.module === "PRICE_DEVIATION",
    );
  async function evaluate() {
    setBusy(true);
    try {
      const s = await service.evaluateDeviation(p.id, oe, offer);
      setParams({ tab: "harga", hasil: s.id });
      toast("Evaluasi Harga Timpang selesai.", false, "evaluation");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return { p, docs, oe, setOe, offer, setOffer, busy, chosen, evaluate };
}
