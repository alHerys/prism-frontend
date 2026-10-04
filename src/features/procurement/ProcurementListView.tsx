import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import "../../shared/styles/focus.css";
import {
  Button,
  Field,
  HeaderAction
} from "../../shared/ui/components";
import { Modal } from "../../shared/ui/feedback";
import { ProcurementTable } from "./ProcurementTable";
import type { useProcurementList } from "./useProcurementList";

export function ProcurementListView({ state, setParams, open, setOpen, search, setSearch, form, setForm, busy, create }: ReturnType<typeof useProcurementList>) {

  return (
    <div className="page">
      <HeaderAction>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus />
          Tambah pengadaan
        </Button>
      </HeaderAction>
      <section className="panel">
        <ProcurementTable
          items={state.procurements}
          search={search}
          onSearchChange={setSearch}
        />
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
