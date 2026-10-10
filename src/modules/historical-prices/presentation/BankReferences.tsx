import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { X } from "@phosphor-icons/react/dist/csr/X";
import "../../../shared/styles/bank.css";
import { Empty } from "./Empty";
import { ReferenceTable } from "./ReferenceTable";
import type { BankPageModel } from "./view-models";
export function BankReferences({ tab, setTab, selectedIds, setDetail, filtered, selected, toggle, compareReference }: Pick<BankPageModel, "tab" | "setTab" | "selectedIds" | "setDetail" | "filtered" | "selected" | "toggle" | "compareReference">) {
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
              <p className="muted">Telusuri pekerjaan, periode, dan jejak sumbernya.</p>
            </div>
            <span className="bank-count">{filtered.length} referensi tersedia</span>
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
            <div className="bank-selection-workspace">
              {selected.length > 0 && (
                <ul className="bank-selected-references" aria-label="Referensi yang dipilih">
                  {selected.map((item) => (
                    <li key={item.id}>
                      <span>{item.documentName} <span className="muted">· {item.period}</span></span>
                      <button type="button" aria-label={`Hapus pilihan ${item.documentName}`} onClick={() => toggle(item.id)}><X size={14} /></button>
                    </li>
                  ))}
                </ul>
              )}
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
            </div>
          )}
        </section>
      )}
    </>
  );
}
