import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import "../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { ReferenceTable } from "./ReferenceTable";
import type { useBankPage } from "./useBankPage";
export function BankReferences({ tab, setTab, selectedIds, setDetail, filtered, selected, toggle, compareReference }: Pick<ReturnType<typeof useBankPage>, "tab" | "setTab" | "selectedIds" | "setDetail" | "filtered" | "selected" | "toggle" | "compareReference">) {
  return (
    <>
      {(tab === "Dokumen Historis" || tab === "Pencarian Referensi") && (
        <section className="panel">
          <div className="bank-section-heading">
            <div>
              <h2>
                {tab === "Dokumen Historis"
                  ? "Dokumen terpublikasi"
                  : "Referensi harga satuan"}
              </h2>
              <p className="muted">{filtered.length} referensi tersedia</p>
            </div>
          </div>
          {filtered.length ? (
            <ReferenceTable
              items={filtered}
              selected={selectedIds}
              toggle={toggle}
              onDetail={setDetail}
              onCompare={(id, value) =>
                compareReference(id, value)
              }
              showSelection={tab === "Pencarian Referensi"}
            />
          ) : (
            <Empty
              title="Referensi belum ditemukan"
              text="Ubah kata pencarian atau filter fungsi dan periode."
            />
          )}
          {tab === "Pencarian Referensi" && (
            <div className="bank-reference-selection">
              <span>
                {selected.length} referensi dipilih ·{" "}
                {selected.filter((i) => i.comparable).length} dinyatakan
                sebanding
              </span>
              <button
                className="btn primary"
                disabled={!selected.length}
                onClick={() => setTab("Statistik Harga")}
              >
                Lihat statistik <ArrowUpRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
