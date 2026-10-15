import type { ProcurementSortKey, ProcurementTableModel } from "./view-models";
import { useState } from "react";
import { useProcurementData } from "./binding";
import type { Procurement } from "../domain/models";

export function useProcurementTable({
  items,
  search: controlledSearch,
  onSearchChange,
  searchLabel = "Cari pengadaan",
}: {
  items: Procurement[];
  search?: string;
  onSearchChange?: (s: string) => void;
  searchLabel?: string;
}) : ProcurementTableModel {
  const state = useProcurementData();
  const [ownSearch, setOwnSearch] = useState("");
  const search = controlledSearch ?? ownSearch;
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<ProcurementSortKey>("name");
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const facts = new Map(items.map((procurement) => {
    const documents = state.documents.filter((document) => document.procurementId === procurement.id);
    const vendors = state.vendors.filter((vendor) => vendor.procurementId === procurement.id);
    return [procurement.id, {
      documents: documents.length,
      vendors: vendors.length,
      confirmed: documents.filter((document) => document.status === "CONFIRMED").length,
      text: `${procurement.name} ${procurement.number} ${procurement.functionName} ${vendors.map((vendor) => vendor.name).join(" ")} ${documents.map((document) => document.name).join(" ")}`.toLowerCase(),
    }];
  }));
  const filtered = items
    .filter((p) => {
      const fact = facts.get(p.id)!;
      const pending = fact.confirmed < fact.documents;
      return (
        fact.text.includes(search.toLowerCase()) &&
        (status === "all" ||
          (status === "review" ? pending : fact.documents > 0 && !pending))
      );
    })
    .sort((a, b) => {
      const aFact = facts.get(a.id)!;
      const bFact = facts.get(b.id)!;
      const comparison = sortKey === "name"
        ? a.name.localeCompare(b.name, "id")
        : aFact.vendors - bFact.vendors;
      return comparison === 0
        ? a.name.localeCompare(b.name, "id")
        : comparison * (ascending ? 1 : -1);
    });
  const count = Number(size);
  const pages = Math.max(1, Math.ceil(filtered.length / count));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * count, current * count);
  return {
    items,
    onSearchChange,
    searchLabel,
    state,
    setOwnSearch,
    search,
    status,
    setStatus,
    sortKey,
    setSortKey,
    ascending,
    setAscending,
    setPage,
    size,
    setSize,
    filtered,
    count,
    pages,
    current,
    shown,
  };
}
