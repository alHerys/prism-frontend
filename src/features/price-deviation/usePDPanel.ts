import { useState } from "react";
import { useSearchParams } from "react-router";
import "../../shared/styles/focus.css";
import { useSessionService, useSessionState } from "../../services/session-context";
import { errorMessage } from "../../shared/errors/message";
import type { Procurement } from "../../shared/model/session";
import { useToast } from "../../shared/ui/feedback";

export function usePDPanel({ procurement: p }: { procurement: Procurement }) {
  const service = useSessionService();
  const state = useSessionState();
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
      await new Promise((r) => setTimeout(r, 450));
      const s = await service.evaluateDeviation(p.id, oe, offer);
      setParams({ tab: "harga", hasil: s.id });
      toast("Evaluasi Harga Timpang selesai.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return { p, docs, oe, setOe, offer, setOffer, busy, chosen, evaluate };
}
