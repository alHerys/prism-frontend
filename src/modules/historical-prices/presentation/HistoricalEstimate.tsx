import { Sparkle } from "@phosphor-icons/react/dist/csr/Sparkle";
import { bankMoney as money, exactMoney } from "../../../shared/formatting/display";
import { useWorkspaceTime } from "../../../shared/ui/workspace-time";
import "../../../shared/styles/bank.css";
import type { BankPageModel } from "./view-models";
export function HistoricalEstimate({
  busy,
  need,
  setNeed,
  unit,
  units,
  setUnit,
  quantity,
  setQuantity,
  estimate,
  selected,
  createEstimate,
}: Pick<BankPageModel, "busy" | "need" | "setNeed" | "unit" | "units" | "setUnit" | "quantity" | "setQuantity" | "estimate" | "selected" | "createEstimate">) {
  const bankDateTime = useWorkspaceTime();
  return (
    <div className="bank-estimate-layout">
      <section className="panel">
        <div className="bank-section-heading">
          <div>
            <h2>Susun kebutuhan estimasi</h2>
            <p className="muted">
              Gunakan referensi yang telah diperiksa untuk membantu
              penyusunan OE.
            </p>
          </div>
        </div>
        <form
          className="bank-details"
          onSubmit={(e) => {
            e.preventDefault();
            void createEstimate();
          }}
        >
          <div className="bank-estimate-inputs">
            <label className="field">
              Uraian pekerjaan
              <input
                required
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                placeholder="Contoh: Pengecatan tangki"
              />
            </label>
            <label className="field">
              Satuan
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {units.map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="field">
              Kuantitas
              <input
                required
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Masukkan jumlah"
              />
            </label>
          </div>
          <p className="muted bank-subtle">
            {selected.length} referensi dengan satuan {unit} digunakan otomatis.
          </p>
          <div className="toolbar">
            <button
              className="btn primary"
              disabled={!!busy || !selected.length}
            >
              <Sparkle size={16} />
              Buat estimasi
            </button>
          </div>
        </form>
      </section>
      {estimate ? (
        <section className="panel">
          <div className="bank-section-heading">
            <div>
              <h2>Hasil estimasi · {estimate.description}</h2>
              <p className="muted">
                {estimate.referenceIds.length} referensi · dibuat{" "}
                {bankDateTime(estimate.createdAt)}
              </p>
            </div>
          </div>
          <div className="bank-details">
            <div className="bank-estimate-total"><span className="muted">Estimasi total</span><strong title={exactMoney(estimate.total)}>{money(estimate.total)}</strong></div>
            <dl>
              <dt>Harga satuan</dt>
              <dd>
                <strong>
                  {money(estimate.unitPrice)} / {estimate.unit}
                </strong>
              </dd>
              <dt>Kuantitas</dt>
              <dd>
                {estimate.quantity} {estimate.unit}
              </dd>
              <dt>Rentang referensi</dt>
              <dd>
                {money(estimate.min)} – {money(estimate.max)} /{" "}
                {estimate.unit}
              </dd>
            </dl>
            <p className="bank-notice">
              Estimasi menggunakan median seluruh referensi dengan satuan yang sama. Tinjau
              kondisi lokasi, spesifikasi, dan periode sebelum digunakan
              dalam penyusunan OE. Hasil ini memerlukan keputusan
              evaluator.
            </p>
          </div>
        </section>
      ) : (
        <aside className="panel" aria-label="Referensi estimasi otomatis">
          <div className="bank-section-heading">
            <h2>Referensi untuk estimasi</h2>
            <span className="bank-count">{selected.length} referensi</span>
          </div>
          <div className="bank-estimate-summary">
            <p className="muted">Periksa kesebandingan lingkup, spesifikasi, dan satuan sebelum membuat estimasi.</p>
            {selected.length ? (
              <ul>
                {selected.map((item) => (
                  <li key={item.id}>
                    <strong>{item.documentName}</strong>
                    <span>{item.period} · {item.unit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Belum ada referensi dengan satuan {unit}. Unggah dan publikasikan dokumen historis untuk menambah referensi.</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
