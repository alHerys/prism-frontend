import { ArrowDown } from "@phosphor-icons/react/dist/csr/ArrowDown";
import { ArrowUp } from "@phosphor-icons/react/dist/csr/ArrowUp";
import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { FunnelSimple } from "@phosphor-icons/react/dist/csr/FunnelSimple";
import { X } from "@phosphor-icons/react/dist/csr/X";
import * as Dialog from "@radix-ui/react-dialog";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { SelectField } from "../../../shared/ui/select-field";
import { EmptyState as Empty } from "../../../shared/ui/empty-state";

import type { ProcurementSortKey, ProcurementTableModel } from "./view-models";
import "./procurement.css";

const sortColumns: { key: ProcurementSortKey; label: string; choice: string }[] = [
  { key: "name", label: "Pengadaan", choice: "Nama pengadaan" },
  { key: "vendors", label: "Vendor", choice: "Jumlah vendor" },
];

function ProcurementTableMenu({ sortKey, setSortKey, ascending, setAscending, status, setStatus, setPage }: Pick<ProcurementTableModel, "sortKey" | "setSortKey" | "ascending" | "setAscending" | "status" | "setStatus" | "setPage">) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 280, maxHeight: 400 });
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rectangle = trigger.current?.getBoundingClientRect();
      if (!rectangle) return;
      const width = Math.min(280, window.innerWidth - 32);
      const below = window.innerHeight - rectangle.bottom - 16;
      const top = below < 400 && rectangle.top > below
        ? Math.max(16, rectangle.top - 408)
        : rectangle.bottom + 8;
      setPosition({ top, left: Math.max(16, Math.min(rectangle.right - width, window.innerWidth - width - 16)), width, maxHeight: Math.max(64, window.innerHeight - top - 16) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
      <Dialog.Trigger asChild>
        <button ref={trigger} className="procurement-filter-trigger" aria-label="Filter dan urutkan pengadaan" data-filtered={status !== "all"}>
          <FunnelSimple size={17} aria-hidden="true" /><span className="procurement-filter-label">Filter</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="procurement-filter-menu" style={position}>
          <div className="procurement-filter-heading">
            <Dialog.Title>Filter dan urutkan pengadaan</Dialog.Title>
            <Dialog.Close asChild><button aria-label="Tutup filter pengadaan"><X size={17} aria-hidden="true" /></button></Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Pilihan langsung diterapkan pada tabel.</Dialog.Description>
          <fieldset>
            <legend>Urutkan berdasarkan</legend>
            {sortColumns.map((column) => <label key={column.key}><input type="radio" name={`${id}-sort`} value={column.key} checked={sortKey === column.key} onChange={() => { setSortKey(column.key); setPage(1); }} />{column.choice}</label>)}
          </fieldset>
          <fieldset>
            <legend>Arah urutan</legend>
            <label><input type="radio" name={`${id}-direction`} checked={ascending} onChange={() => { setAscending(true); setPage(1); }} />Menaik</label>
            <label><input type="radio" name={`${id}-direction`} checked={!ascending} onChange={() => { setAscending(false); setPage(1); }} />Menurun</label>
          </fieldset>
          <fieldset>
            <legend>Kesiapan dokumen</legend>
            {[{ value: "all", label: "Semua kesiapan" }, { value: "review", label: "Perlu ditinjau" }, { value: "ready", label: "Terkonfirmasi" }].map((option) => <label key={option.value}><input type="radio" name={`${id}-status`} value={option.value} checked={status === option.value} onChange={() => { setStatus(option.value); setPage(1); }} />{option.label}</label>)}
          </fieldset>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProcurementTableView({
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
  pages,
  current,
  shown,
  children,
}: ProcurementTableModel & { children?: ReactNode }) {
  const sort = (key: ProcurementSortKey) => {
    if (key === sortKey) setAscending((value) => !value);
    else { setSortKey(key); setAscending(true); }
    setPage(1);
  };
  return (
    <div className="procurement-data-table">
      <div className="table-toolbar">
        <div className="search">
          <MagnifyingGlass aria-hidden="true" />
          <input
            aria-label={searchLabel}
            placeholder="Cari nama, nomor, vendor, fungsi, atau dokumen"
            value={search}
            onChange={(e) => {
              (onSearchChange || setOwnSearch)(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {children}
      </div>
      <div className="table-wrap">
        <table className="table procurement-table">
          <thead>
            <tr>
              {sortColumns.map((column) => (
                <th key={column.key} scope="col" aria-sort={sortKey === column.key ? ascending ? "ascending" : "descending" : undefined}>
                  <button className="table-sort" data-active={sortKey === column.key} onClick={() => sort(column.key)}>
                    {column.label}
                    {sortKey === column.key && (ascending ? <ArrowUp size={15} aria-hidden="true" /> : <ArrowDown size={15} aria-hidden="true" />)}
                  </button>
                </th>
              ))}
              <th scope="col" className="procurement-table-actions-heading">
                <span className="sr-only">Buka pengadaan</span>
                <ProcurementTableMenu sortKey={sortKey} setSortKey={setSortKey} ascending={ascending} setAscending={setAscending} status={status} setStatus={setStatus} setPage={setPage} />
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              return (
                <tr key={p.id}>
                  <td>
                    <div className="procurement-name">
                      <span className="procurement-folder">
                        <Folder size={22} />
                      </span>
                      <div>
                        <Link to={`/pengadaan/${p.id}`}>
                          <strong>{p.name}</strong>
                        </Link>
                        <small>
                          {p.number} · {p.functionName}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {
                      state.vendors.filter((v) => v.procurementId === p.id)
                        .length
                    }{" "}
                    vendor
                  </td>
                  <td>
                    <Link
                      className="table-open"
                      to={`/pengadaan/${p.id}`}
                      aria-label={`Buka ${p.name}`}
                    >
                      <CaretRight size={20} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!shown.length && (
          <Empty
            title={
              items.length ? "Pengadaan tidak ditemukan" : "Belum ada pengadaan"
            }
          >
            {items.length
              ? "Ubah pencarian atau filter kesiapan untuk melihat pengadaan."
              : "Tambahkan pengadaan untuk mulai bekerja."}
          </Empty>
        )}
      </div>
      <div className="table-pagination">
        <label className="page-size">
          Tampilkan{" "}
          <SelectField
            ariaLabel="Jumlah pengadaan per halaman"
            value={size}
            onValueChange={(s) => {
              setSize(s);
              setPage(1);
            }}
            items={["5", "10", "25"].map((value) => ({ value, label: value }))}
          />
        </label>
        <div className="pagination-controls">
          <button
            className="btn small"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <CaretLeft /> Sebelumnya
          </button>
          <span
            aria-label={`Halaman ${current} dari ${pages}`}
            className="page-number"
          >
            {current}
          </span>
          <button
            className="btn small"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Selanjutnya <CaretRight />
          </button>
        </div>
      </div>
    </div>
  );
}
