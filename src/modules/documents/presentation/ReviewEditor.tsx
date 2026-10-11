import { CheckCircle as CheckCircle2 } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { toPercent } from "../../../shared/formatting/review-input";
import type { A5Values, DocumentRecord } from "../domain/models";
import "../../../shared/styles/focus.css";
import { CurrencyInput } from "../../../shared/ui/currency-input";
import { fields } from "./review-fields";
import type { ReviewModel } from "./view-models";

const reviewFieldOrder: (keyof A5Values)[] = [
  "hpb", "hpj", "knb", "tkdn_barang", "tkdn_jasa",
];

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
  editPair,
}: Pick<ReviewModel, "d" | "ack" | "setAck" | "busy" | "setConfirm" | "setFocused" | "values" | "pairs" | "group" | "setGroup" | "dirty" | "setDirty" | "failure" | "changeValue" | "editPair"> & { d: DocumentRecord }) {
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
            Cocokkan nilai dengan bukti sumber. Konfirmasi data
            menyimpan perubahan dan menyetujui data untuk evaluasi.
          </p>
        </div>
      </div>
      {values ? (
        <div className="form-grid review-values">
          {reviewFieldOrder.map((key) => (
            <div className={`field review-value-field${key === "knb" ? " review-value-wide" : ""}`} key={key}>
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
              {values[key] !==
                  (key.startsWith("tkdn")
                    ? toPercent(d.candidate![key])
                    : d.candidate![key]) && (
                <div className="review-field-meta"><span className="badge info">
                    Dikoreksi
                  </span></div>
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
          </div>
          {d.kind === "OFFER" && (
            <div className="table-wrap review-pairs" role="region" aria-label="Pasangan komponen harga" tabIndex={0}>
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
                      </td>
                      <td>
                        <input
                          aria-label={`OE ${pair.description}`}
                          className="review-pair-price"
                          value={pair.oe}
                          onChange={(e) =>
                            editPair(i, "oe", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Penawaran ${pair.description}`}
                          className="review-pair-price"
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
        <div className="alert review-warning">
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
        <button
          className="btn primary"
          disabled={
            busy ||
            (d.status === "CONFIRMED" && !dirty) ||
            (d.warnings.length > 0 && !ack) ||
            (!values && !group)
          }
          onClick={() => setConfirm(true)}
        >
          <CheckCircle2 />
          {busy ? "Mengonfirmasi…" : "Konfirmasi data"}
        </button>
      </div>
    </section>
  );
}
