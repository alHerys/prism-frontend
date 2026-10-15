import type { HistoryPageModel } from "./view-models";
import { useMemo, useState } from "react";
import { useEvaluationsData } from "../../modules/evaluations/presentation/binding";
import { useDocumentsData } from "../../modules/documents/presentation/binding";
import { localDay } from "../../shared/formatting/display";
import { moduleLabel } from "./history-labels";

export function useHistoryPage() : HistoryPageModel {
  const state = { ...useEvaluationsData(), ...useDocumentsData() };
  const [tab, setTab] = useState("Aktivitas");
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("");
  const [procurement, setProcurement] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const matchesDate = (date: string) =>
    (!start || localDay(date) >= start) && (!end || localDay(date) <= end);
  const events = state.events.filter(
    (event) =>
      (!module || event.module === module) &&
      (!procurement || event.procurementId === procurement) &&
      matchesDate(event.createdAt) &&
      `${event.summary} ${event.type}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")),
  );
  const results = state.snapshots.filter(
    (result) =>
      (!module || result.module === module) &&
      (!procurement || result.procurementId === procurement) &&
      matchesDate(result.createdAt) &&
      `${moduleLabel[result.module]} ${state.procurements.find((p) => p.id === result.procurementId)?.name ?? ""}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")),
  );
  const activityChart = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const day = localDay(event.createdAt);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return [...counts].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  }, [events]);
  const maxCount = Math.max(1, ...activityChart.map(([, count]) => count));
  const visibleDocuments = state.documents.filter(
    (d) =>
      (!procurement || d.procurementId === procurement) &&
      matchesDate(d.uploadedAt) &&
      (!module ||
        (d.kind === "FORM_A5"
          ? "HEA"
          : d.kind === "HISTORICAL_OE"
            ? "BANK"
            : "PRICE_DEVIATION") === module),
  );
  const procurementName = (id?: string) =>
    state.procurements.find((p) => p.id === id)?.name ?? "Bank Data OE";
  return {
    state,
    tab,
    setTab,
    query,
    setQuery,
    module,
    setModule,
    procurement,
    setProcurement,
    start,
    setStart,
    end,
    setEnd,
    events,
    results,
    activityChart,
    maxCount,
    visibleDocuments,
    procurementName,
  };
}
