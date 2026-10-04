import { CheckCircle as CheckCircle2 } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { FloppyDisk as Save } from "@phosphor-icons/react/dist/csr/FloppyDisk";
import { money, pct } from "../../../shared/formatting/display";
import { toPercent } from "../../../shared/formatting/review-input";
import type { A5Values, DocumentRecord } from "../domain/models";
import "../../../shared/styles/focus.css";
import { CurrencyInput } from "../../../shared/ui/currency-input";
import { fields } from "./review-fields";
import type { ReviewModel } from "./view-models";
export function ReviewEditor({
  d,
  ack,
  setAck,
  busy,
  setConfirm,
  setFocused,
  values,
  pairs,
  group,
  setGroup,
  dirty,
  setDirty,
  failure,
  changeValue,
  save,
  editPair,
}: Pick<ReviewModel, "d" | "ack" | "setAck" | "busy" | "setConfirm" | "setFocused" | "values" | "pairs" | "group" | "setGroup" | "dirty" | "setDirty" | "failure" | "changeValue" | "save" | "editPair"> & { d: DocumentRecord }) {
  return (
    <section className="panel review-editor">
      <div className="panel-header">
        <div>
          <h2>
            {values
              ? "Nilai hasil pembacaan"
              : "Kelompok harga dan pasangan"}
          </h2>
          <p>
            Cocokkan nilai dengan sumber di sebelah kiri. Simpan koreksi
            sebelum mengonfirmasi data.
          </p>
        </div>
      </div>
      {values ? (
        <div className="form-grid">
          {(Object.keys(fields) as (keyof A5Values)[]).map((key) => (
            <div className="field" key={key}>
              <label htmlFor={key}>
                {fields[key]} {key.startsWith("tkdn") ? "(%)" : "(Rp)"}
              </label>
              {key.startsWith("tkdn") ? <input
                id={key}
                value={values[key]}
                inputMode="decimal"
                onFocus={() => setFocused(key)}
                onChange={(e) => changeValue(key, e.target.value)}
              /> : <CurrencyInput
                id={key}
                value={values[key]}
                onFocus={() => setFocused(key)}
                onValueChange={(value) => changeValue(key, value)}
              />}
              <small>
                Nilai awal:{" "}
                {key.startsWith("tkdn")
                  ? pct(d.candidate![key])
                  : money(d.candidate![key])}
              </small>
              {values[key] !==
                (key.startsWith("tkdn")
                  ? toPercent(d.candidate![key])
                  : d.candidate![key]) && (
                  <span
                    className="badge info"
                    style={{ width: "fit-content" }}
                  >
                    Dikoreksi
                  </span>
                )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor="group">Kelompok harga yang digunakan</label>
            <select
              id="group"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setDirty(true);
                setAck(false);
              }}
            >
              <option value="">Pilih kelompok secara eksplisit</option>
              {d.groups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <small>
              Ringkasan total tidak digunakan untuk perbandingan harga
              satuan.
            </small>
          </div>
          {d.kind === "OFFER" && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pasangan</th>
                    <th>OE (Rp)</th>
                    <th>Penawaran (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((pair, i) => (
                    <tr key={pair.id}>
                      <td>
                        <label>
                          <input
                            type="checkbox"
                            checked={pair.matched}
                            onChange={(e) =>
                              editPair(i, "matched", e.target.checked)
                            }
                          />{" "}
                          {pair.description}
                        </label>
                        <small>
                          {pair.category === "MATERIAL"
                            ? "Material"
                            : "Jasa"}{" "}
                          · {pair.unit}
                        </small>
                        <small>{pair.source}</small>
                        {!pair.matched && (
                          <span className="badge warning">
                            Periksa pasangan
                          </span>
                        )}
                      </td>
                      <td>
                        <input
                          aria-label={`OE ${pair.description}`}
                          style={{ width: 110 }}
                          value={pair.oe}
                          onChange={(e) =>
                            editPair(i, "oe", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Penawaran ${pair.description}`}
                          style={{ width: 110 }}
                          value={pair.offer}
                          onChange={(e) =>
                            editPair(i, "offer", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {d.warnings.length > 0 && (
        <div className="alert">
          <strong>Perlu verifikasi evaluator</strong>
          {d.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          <label className="notice">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            Saya telah memeriksa peringatan dan memastikan nilai serta
            pasangan sesuai sumber.
          </label>
        </div>
      )}
      {failure && (
        <div className="alert error" role="alert">
          {failure}
        </div>
      )}
      <div className="review-action">
        <div className="review-save-state" role="status">
          <strong>
            {dirty
              ? "Perubahan belum disimpan"
              : d.status === "CONFIRMED"
                ? "Data terkonfirmasi"
                : "Siap diperiksa"}
          </strong>
          <small>
            {dirty
              ? "Simpan koreksi agar dapat dikonfirmasi."
              : `Revisi ${d.revision} · ${d.status === "CONFIRMED" ? "Siap digunakan untuk evaluasi" : "Konfirmasi setelah nilai dan sumber sesuai"}`}
          </small>
        </div>
        <button
          className="btn"
          disabled={!dirty || busy}
          onClick={() => void save()}
        >
          <Save />
          {busy ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        <button
          className="btn primary"
          disabled={
            dirty ||
            busy ||
            d.status === "CONFIRMED" ||
            (d.warnings.length > 0 && !ack) ||
            (!values && !d.selectedGroup)
          }
          onClick={() => setConfirm(true)}
        >
          <CheckCircle2 />
          Konfirmasi data
        </button>
      </div>
    </section>
  );
}
