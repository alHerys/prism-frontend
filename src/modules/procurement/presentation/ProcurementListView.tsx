import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import "../../../shared/styles/focus.css";
import { Button } from "../../../shared/ui/button";
import { Field } from "../../../shared/ui/field";
import { HeaderAction } from "../../../shared/ui/header-action";
import { Modal } from "../../../shared/ui/modal";
import { ProcurementTable } from "./ProcurementTable";
import type { ProcurementListModel } from "./view-models";
import "./procurement.css";

export function ProcurementListView({ state, setParams, open, setOpen, search, setSearch, form, setForm, busy, create }: ProcurementListModel) {

  return (
    <div className="page procurement-list-page">
      <HeaderAction>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus />
          Tambah pengadaan
        </Button>
      </HeaderAction>
      <section className="panel procurement-list-panel" aria-label="Daftar pengadaan">
        <ProcurementTable
          items={state.procurements}
          search={search}
          onSearchChange={setSearch}
        >
          <span className="procurement-list-count"><Folder size={18} aria-hidden="true" /> {state.procurements.length} pengadaan</span>
        </ProcurementTable>
      </section>
      <Modal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          setParams({});
        }}
        title="Tambah pengadaan"
        description="Lengkapi identitas pengadaan sebelum menambahkan vendor dan dokumen."
      >
        <form onSubmit={create}>
          {[
            ["name", "Nama pengadaan"],
            ["number", "Nomor pengadaan"],
            ["functionName", "Fungsi / unit kerja"],
          ].map(([key, label]) => (
            <Field key={key} label={label} htmlFor={key}>
              <input
                id={key}
                required
                maxLength={256}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </Field>
          ))}
          <div className="modal-actions">
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(false)}
            >
              Batal
            </button>
            <button className="btn primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Buat pengadaan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
