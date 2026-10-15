import type { BankPageModel } from "./view-models";
import { useState } from "react";
import { useHistoricalPricesCommands, useHistoricalPricesData } from "./binding";
import { useWorkspacePreferences } from "../../../shared/ui/workspace-preferences";


export function useBankPage() : BankPageModel {
  const { shouldNotify } = useWorkspacePreferences();
  const service = useHistoricalPricesCommands();
  const state = useHistoricalPricesData();
  const preparedEstimate = state.estimates[0];
  const [showUpload, setShowUpload] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [period, setPeriod] = useState("");
  const [procurementId, setProcurementId] = useState(
    state.procurements[0]?.id ?? "",
  );
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [need, setNeed] = useState(preparedEstimate?.description ?? "");
  const [unit, setUnit] = useState(preparedEstimate?.unit ?? "m²");
  const [quantity, setQuantity] = useState(preparedEstimate?.quantity ?? "");
  const [estimateId, setEstimateId] = useState(preparedEstimate?.id ?? "");
  const draft = state.documents.find((d) => d.id === draftId);
  const estimate = state.estimates.find((e) => e.id === estimateId);
  const selected = state.historicalItems.filter(item => item.unit === unit);
  const selectedIds = selected.map(item => item.id);
  const units = [...new Set(["m²", "m", "unit", ...state.historicalItems.map(item => item.unit)])];
  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Proses belum berhasil. Silakan coba kembali.",
      );
    } finally {
      setBusy("");
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    await run("Membaca dokumen", async () => {
      const record = await service.upload({ file, procurementId, kind: "HISTORICAL_OE" }, setBusy);
      setDraftId(record.id);
      setPeriod(record.period ?? "");
      setFunctionName("");
      setShowUpload(false);
      setNotice(
        "Dokumen selesai dibaca. Periksa metadata dan sumber sebelum publikasi.",
      );
    });
  };
  const saveDraft = async () => {
    if (!draft) return;
    await run("Menyimpan perubahan", async () => {
      await service.setHistoricalMetadata(
        draft.id,
        { functionName, period },
        draft.revision,
      );
      setNotice("Metadata tersimpan. Konfirmasi dokumen sebelum publikasi.");
    });
  };
  const confirmDraft = async () => {
    if (!draft) return;
    await run("Mengonfirmasi dokumen", async () => {
      await service.confirmDocument(draft.id, draft.revision, true);
      setNotice("Dokumen terkonfirmasi dan siap dipublikasikan.");
    });
  };
  const publishDraft = async () => {
    if (!draft) return;
    await run("Mempublikasikan dokumen", async () => {
      await service.publishHistory(draft.id, draft.revision);
      setNotice(shouldNotify("publication") ? "Dokumen telah ditambahkan ke Bank Data OE." : "");
      setDraftId("");
    });
  };
  const createEstimate = () => run("Menelaah referensi dan kebutuhan", async () => {
    const result = await service.estimate({
      description: need,
      unit,
      quantity,
      referenceIds: selectedIds,
    });
    setEstimateId(result.id);
    setNotice(
      "Estimasi selesai. Tinjau sumber dan batas penggunaannya.",
    );
  });
  return {
    state,
    showUpload,
    setShowUpload,
    setDraftId,
    functionName,
    setFunctionName,
    period,
    setPeriod,
    procurementId,
    setProcurementId,
    busy,
    notice,
    error,
    setError,
    need,
    setNeed,
    unit,
    setUnit,
    quantity,
    setQuantity,
    draft,
    estimate,
    selected,
    units,
    upload,
    saveDraft,
    confirmDraft,
    publishDraft,
    createEstimate,
  };
}
