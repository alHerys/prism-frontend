import { ArrowsDownUp } from "@phosphor-icons/react/dist/csr/ArrowsDownUp";
import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { Link } from "react-router";
import { SelectField } from "../../../shared/ui/select-field";
import { EmptyState as Empty } from "../../../shared/ui/empty-state";

import type { ProcurementTableModel } from "./view-models";
import "./procurement.css";
export function ProcurementTableView({
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
}: ProcurementTableModel) {

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
        <SelectField
          ariaLabel="Filter kesiapan pengadaan"
          value={status}
          onValueChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
          items={[
            { value: "all", label: "Semua kesiapan" },
            { value: "review", label: "Perlu ditinjau" },
            { value: "ready", label: "Terkonfirmasi" },
          ]}
        />
      </div>
      <div className="table-wrap">
        <table className="table procurement-table">
          <thead>
            <tr>
              <th aria-sort={ascending ? "ascending" : "descending"}>
                <button
                  className="table-sort"
                  onClick={() => setAscending((v) => !v)}
                >
                  Pengadaan <ArrowsDownUp size={15} />
                </button>
              </th>
              <th>Vendor</th>
              <th>Dokumen</th>
              <th>Kesiapan</th>
              <th>
                <span className="sr-only">Buka pengadaan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const docs = state.documents.filter(
                (d) => d.procurementId === p.id,
              );
              const ready = docs.filter((d) => d.status === "CONFIRMED").length;
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
                    <strong>{docs.length} dokumen</strong>
                  </td>
                  <td>
                    <div className="readiness-badges">
                      {docs.length ? (
                        <>
                          {ready > 0 && (
                            <span className="badge success">
                              {ready} terkonfirmasi
                            </span>
                          )}
                          {docs.length > ready && (
                            <span className="badge warning">
                              {docs.length - ready} perlu ditinjau
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="badge">Belum ada dokumen</span>
                      )}
                    </div>
                    {docs.length > 0 && <progress className="procurement-readiness" value={ready} max={docs.length} aria-label={`Dokumen terkonfirmasi untuk ${p.name}`} />}
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
        <span>
          Menampilkan {filtered.length ? (current - 1) * count + 1 : 0}–
          {Math.min(current * count, filtered.length)} dari {filtered.length}{" "}
          pengadaan
        </span>
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
