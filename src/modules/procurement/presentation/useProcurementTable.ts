import { useState } from "react";
import { useProcurementData } from "./binding";
import type { Procurement } from "../../../shared/model/session";

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
}) {
  const state = useProcurementData();
  const [ownSearch, setOwnSearch] = useState("");
  const search = controlledSearch ?? ownSearch;
  const [status, setStatus] = useState("all");
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const filtered = items
    .filter((p) => {
      const docs = state.documents.filter((d) => d.procurementId === p.id);
      const pending = docs.some((d) => d.status !== "CONFIRMED");
      return (
        `${p.name} ${p.number} ${p.functionName} ${state.vendors.filter((v) => v.procurementId === p.id).map((v) => v.name).join(" ")} ${docs.map((d) => d.name).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (status === "all" ||
          (status === "review" ? pending : docs.length > 0 && !pending))
      );
    })
    .sort((a, b) =>
      ascending
        ? a.name.localeCompare(b.name, "id")
        : b.name.localeCompare(a.name, "id"),
    );
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
