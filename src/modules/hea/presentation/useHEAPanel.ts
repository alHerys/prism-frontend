import type { HEAPanelModel } from "./view-models";
import { useRef, useState } from "react";
import { usesCurrentPreferences } from "../application/result-query";
import { useSearchParams } from "react-router";
import { useHEACommands, useHEAData } from "./binding";
import { errorMessage } from "../../../shared/kernel/error-message";
import { percentInput, ratioInput } from "../../../shared/formatting/percentage-input";
import type { Procurement } from "../../procurement/domain/models";
import { useToast } from "../../../shared/ui/toast-provider";

export function useHEAPanel({ procurement: p }: { procurement: Procurement }) : HEAPanelModel {
  const service = useHEACommands();
  const state = useHEAData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const eligibleDocumentIds = state.documents.filter(
    d => d.procurementId === p.id && d.kind === "FORM_A5" && d.status === "CONFIRMED" && !d.removedAt && !d.supersededBy,
  ).map(document => document.id);
  const [prefs, setPrefs] = useState({
    barang: p.preferences ? percentInput(p.preferences.preferensi_barang) : "",
    jasa: p.preferences ? percentInput(p.preferences.preferensi_jasa) : "",
  });
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const prefsComplete = !!prefs.barang.trim() && !!prefs.jasa.trim();
  const prefDirty =
    prefs.barang !==
    (p.preferences ? percentInput(p.preferences.preferensi_barang) : "") ||
    prefs.jasa !==
    (p.preferences ? percentInput(p.preferences.preferensi_jasa) : "");
  const snapshot =
    state.snapshots.find(
      (s) =>
        s.id === params.get("hasil") &&
        s.procurementId === p.id &&
        s.module === "HEA",
    ) ||
    state.snapshots.find((s) => s.procurementId === p.id && s.module === "HEA");
  const chosen = snapshot && prefsComplete && !prefDirty && p.preferenceConfirmed && usesCurrentPreferences(snapshot, p) ? snapshot : undefined;
  async function evaluate() {
    if (running.current || !prefsComplete) return;
    running.current = true;
    setBusy(true);
    try {
      const preferences = {
        preferensi_barang: ratioInput(prefs.barang),
        preferensi_jasa: ratioInput(prefs.jasa),
      };
      const result = await service.evaluateWithPreferences({ procurementId: p.id, preferences, expectedRevision: p.preferenceRevision, documentIds: eligibleDocumentIds });
      setPrefs({ barang: percentInput(preferences.preferensi_barang), jasa: percentInput(preferences.preferensi_jasa) });
      setParams({ tab: "hea", hasil: result.id });
      toast("Evaluasi HEA selesai. Hasil tersimpan.", false, "evaluation");
    } catch (error) {
      toast(errorMessage(error), true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  return {
    p,
    eligibleDocumentIds,
    prefs,
    setPrefs,
    busy,
    prefsComplete,
    chosen,
    evaluate,
  };
}
