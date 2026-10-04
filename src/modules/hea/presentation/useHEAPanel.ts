import type { HEAPanelModel } from "./view-models";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useHEACommands, useHEAData } from "./binding";
import { errorMessage } from "../../../shared/errors/message";
import { percentInput, ratioInput } from "../../../shared/formatters/percentage-input";
import type { Procurement } from "../../procurement/domain/models";
import { useToast } from "../../../shared/ui/feedback";

export function useHEAPanel({ procurement: p }: { procurement: Procurement }) : HEAPanelModel {
  const service = useHEACommands();
  const state = useHEAData();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const docs = state.documents.filter(
    (d) => d.procurementId === p.id && d.kind === "FORM_A5",
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({
    barang: p.preferences ? percentInput(p.preferences.preferensi_barang) : "",
    jasa: p.preferences ? percentInput(p.preferences.preferensi_jasa) : "",
  });
  const [busy, setBusy] = useState(false);
  const prefDirty =
    prefs.barang !==
    (p.preferences ? percentInput(p.preferences.preferensi_barang) : "") ||
    prefs.jasa !==
    (p.preferences ? percentInput(p.preferences.preferensi_jasa) : "");
  const chosen =
    state.snapshots.find(
      (s) =>
        s.id === params.get("hasil") &&
        s.procurementId === p.id &&
        s.module === "HEA",
    ) ||
    state.snapshots.find((s) => s.procurementId === p.id && s.module === "HEA");
  async function save() {
    try {
      const saved = await service.setPreferences(
        p.id,
        {
          preferensi_barang: ratioInput(prefs.barang),
          preferensi_jasa: ratioInput(prefs.jasa),
        },
        p.preferenceRevision,
      );
      if (saved.preferences) {
        setPrefs({
          barang: percentInput(saved.preferences.preferensi_barang),
          jasa: percentInput(saved.preferences.preferensi_jasa),
        });
      }
      toast("Preferensi disimpan. Konfirmasikan nilai yang akan digunakan.");
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  async function confirm() {
    try {
      await service.confirmPreferences(p.id, p.preferenceRevision);
      toast("Preferensi pengadaan terkonfirmasi.");
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  async function evaluate() {
    setBusy(true);
    try {
      const s = await service.evaluateHEA(p.id, selected);
      setParams({ tab: "hea", hasil: s.id });
      toast("Evaluasi HEA selesai. Hasil tersimpan.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return {
    p,
    state,
    docs,
    selected,
    setSelected,
    prefs,
    setPrefs,
    busy,
    prefDirty,
    chosen,
    save,
    confirm,
    evaluate,
  };
}
