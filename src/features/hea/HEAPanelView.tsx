import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { CheckCircle as CheckCircle2 } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { Link } from "react-router";
import "../../shared/styles/focus.css";
import { Empty, Status, Stepper } from "../../shared/ui/feedback";
import { ResultPanel } from "../procurement/ResultPanel";
import type { useHEAPanel } from "./useHEAPanel";

export function HEAPanelView({ p, state, docs, selected, setSelected, prefs, setPrefs, busy, prefDirty, chosen, save, confirm, evaluate }: ReturnType<typeof useHEAPanel>) {

  return (
    <>
      <Stepper
        stage={
          chosen
            ? 4
            : p.preferenceConfirmed
              ? 3
              : docs.some((d) => d.status === "CONFIRMED")
                ? 2
                : docs.length
                  ? 1
                  : 0
        }
      />
      {chosen && <ResultPanel snapshot={chosen} procurement={p} />}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Preferensi pengadaan</h2>
            <p>
              Satu pasangan preferensi berlaku untuk seluruh vendor dalam
              evaluasi.
            </p>
          </div>
          <Status
            value={p.preferenceConfirmed ? "CONFIRMED" : "REVIEW_REQUIRED"}
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="pref-barang">Preferensi barang (%)</label>
            <input
              id="pref-barang"
              inputMode="decimal"
              placeholder="Masukkan persentase"
              value={prefs.barang}
              onChange={(e) => setPrefs({ ...prefs, barang: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="pref-jasa">Preferensi jasa (%)</label>
            <input
              id="pref-jasa"
              inputMode="decimal"
              placeholder="Masukkan persentase"
              value={prefs.jasa}
              onChange={(e) => setPrefs({ ...prefs, jasa: e.target.value })}
            />
          </div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={() => void save()}>
            Simpan preferensi
          </button>
          <button
            className="btn"
            disabled={prefDirty || !p.preferences || p.preferenceConfirmed}
            onClick={() => void confirm()}
          >
            <CheckCircle2 />
            Konfirmasi preferensi
          </button>
          <span className="muted">
            {prefDirty
              ? "Perubahan belum disimpan dan dikonfirmasi"
              : `Revisi ${p.preferenceRevision}`}
          </span>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Pilih Form A5 untuk evaluasi</h2>
            <p>Pilih satu dokumen terkonfirmasi untuk setiap vendor.</p>
          </div>
          <button
            className="btn primary"
            disabled={
              busy || prefDirty || !p.preferenceConfirmed || !selected.length
            }
            onClick={() => void evaluate()}
          >
            {busy ? "Mengevaluasi…" : "Evaluasi HEA"}
            <ArrowRight />
          </button>
        </div>
        {docs.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pilih</th>
                  <th>Vendor / dokumen</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${d.name}`}
                        disabled={d.status !== "CONFIRMED"}
                        checked={selected.includes(d.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, d.id]
                              : selected.filter((x) => x !== d.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <strong>
                        {state.vendors.find((v) => v.id === d.vendorId)?.name}
                      </strong>
                      <small>
                        {d.name} · Revisi {d.revision}
                      </small>
                    </td>
                    <td>
                      <Status value={d.status} />
                    </td>
                    <td>
                      <Link
                        className="btn small"
                        to={`/pengadaan/${p.id}/review/${d.id}`}
                      >
                        Periksa dokumen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Form A5 belum tersedia">
            Unggah Form A5 melalui tab Vendor & Dokumen.
          </Empty>
        )}
      </section>
    </>
  );
}
