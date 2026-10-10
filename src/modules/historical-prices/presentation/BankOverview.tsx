import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import type { BankPageModel } from "./view-models";

export function BankOverview({
  state,
  selected,
  setTab,
  visible,
}: Pick<BankPageModel, "state" | "selected"> & {
  setTab: (value: string) => void;
  visible: boolean;
}) {
  const drafts = state.documents.filter((document) => document.kind === "HISTORICAL_OE" && !document.published);
  const comparable = selected.filter((item) => item.comparable).length;
  function navigate(value: string, trigger: HTMLButtonElement) {
    const page = trigger.closest(".bank-page");
    setTab(value);
    if (value === "Statistik Harga") {
      // The overview becomes inert; move focus to the tab that now owns the view.
      requestAnimationFrame(() => page?.querySelector<HTMLButtonElement>('[role="tab"][data-state="active"]')?.focus());
    }
  }

  return (
    <div className="bank-overview-region" data-visible={visible} aria-hidden={!visible} inert={!visible}>
      <div className="bank-overview-clip">
        <section className="bank-overview" aria-label="Ringkasan Bank Data OE">
          <article className="bank-overview-card bank-overview-primary">
            <div className="bank-overview-heading">
              <h2>Referensi terpublikasi</h2>
              <Database size={22} aria-hidden="true" />
            </div>
            <strong className="bank-overview-value">{state.historicalItems.length}</strong>
            <div className="bank-overview-footer">
              <span>Item dari dokumen historis</span>
              <button aria-label="Cari referensi harga" onClick={(event) => navigate("Pencarian Referensi", event.currentTarget)}><ArrowUpRight size={20} /></button>
            </div>
          </article>
          <article className="bank-overview-card">
            <div className="bank-overview-heading">
              <h2>Draft dokumen</h2>
              <FileText size={22} aria-hidden="true" />
            </div>
            <strong className="bank-overview-value">{drafts.length}</strong>
            <div className="bank-overview-footer">
              <span>Belum dipublikasikan ke bank</span>
              <button aria-label="Lihat draft dokumen historis" onClick={(event) => navigate("Dokumen Historis", event.currentTarget)}><ArrowUpRight size={20} /></button>
            </div>
          </article>
          <article className="bank-overview-card">
            <div className="bank-overview-heading">
              <h2>Referensi sebanding</h2>
              <CheckCircle size={22} aria-hidden="true" />
            </div>
            <strong className="bank-overview-value">{comparable}<span> / {selected.length}</span></strong>
            <div className="bank-overview-footer">
              <span>Dari referensi yang dipilih</span>
              <button aria-label="Tinjau statistik referensi" onClick={(event) => navigate("Statistik Harga", event.currentTarget)}><ArrowUpRight size={20} /></button>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
