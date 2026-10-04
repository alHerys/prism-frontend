import { useState } from "react";
import { useSessionService, useSessionState } from "../../services/session-context";
import type { HistoricalItem } from "../../shared/model/session";
import "../../shared/styles/bank.css";
import type { BankPageProps } from "./bank-page.types";
import { pause } from "./simulation";

export function useBankPage({ service: serviceOverride, onExport }: BankPageProps) {
  const service = useSessionService(serviceOverride);
  const state = useSessionState(service);
  const preparedEstimate = state.estimates[0];
  const [tab, setTab] = useState(preparedEstimate ? "Statistik Harga" : "Dokumen Historis");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [functionFilter, setFunctionFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() => preparedEstimate?.referenceIds ?? []);
  const [detail, setDetail] = useState<HistoricalItem>();
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
  const filtered = state.historicalItems.filter(
    (item) =>
      `${item.description} ${item.documentName}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")) &&
      (!year || item.period === year) &&
      (!functionFilter || item.functionName === functionFilter),
  );
  const selected = state.historicalItems.filter((item) =>
    selectedIds.includes(item.id),
  );
  const statistics = service.getPreparedStatistics(selectedIds);
  const statsReady = !!statistics;
  const years = [
    ...new Set(state.historicalItems.map((item) => item.period)),
  ].sort();
  const functions = [
    ...new Set(state.historicalItems.map((item) => item.functionName)),
  ];
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
  const toggle = (id: string) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  const upload = async (file?: File) => {
    if (!file) return;
    await run("Membaca dokumen", async () => {
      const { processDemoDocument } = await import("../../services/document-processing");
      const registered = await processDemoDocument(file, "HISTORICAL_OE", setBusy);
      const record = await service.uploadRegisteredDocument({
        procurementId,
        kind: "HISTORICAL_OE",
        fixtureId: registered.id,
        name: file.name,
      });
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
      setNotice("Dokumen telah ditambahkan ke Bank Data OE.");
      setDraftId("");
    });
  };
  const exportStats = async () => {
    await run("Menyiapkan laporan", async () => {
      const result = await service.createBankSnapshot(selectedIds);
      if (onExport) await onExport(result);
      else {
        const { downloadSnapshot } = await import("../../services/export/workbook.ts");
        const p = state.procurements.find((p) => p.id === result.procurementId);
        await downloadSnapshot(
          result,
          p ?? { name: "Bank Data OE", number: "OE-HISTORIS" },
        );
        await service.recordExport(result.id);
      }
      setNotice("Laporan referensi berhasil disiapkan.");
    });
  };
  const createEstimate = () => run("Menelaah referensi dan kebutuhan", async () => {
    await pause(800);
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
  const compareReference = (id: string, value: boolean) => run("Memperbarui kesebandingan", () => service.setComparable(id, value));
  return {
    state,
    tab,
    setTab,
    query,
    setQuery,
    year,
    setYear,
    functionFilter,
    setFunctionFilter,
    selectedIds,
    detail,
    setDetail,
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
    filtered,
    selected,
    statistics,
    statsReady,
    years,
    functions,
    toggle,
    upload,
    saveDraft,
    confirmDraft,
    publishDraft,
    exportStats,
    createEstimate,
    compareReference,
  };
}
