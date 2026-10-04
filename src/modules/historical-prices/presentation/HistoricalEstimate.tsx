import { Sparkle } from "@phosphor-icons/react/dist/csr/Sparkle";
import { bankDateTime, bankMoney as money } from "../../../shared/formatting/display";
import "../../../shared/styles/bank.css";
import type { BankPageModel } from "./view-models";
export function HistoricalEstimate({
  tab,
  setTab,
  busy,
  need,
  setNeed,
  unit,
  setUnit,
  quantity,
  setQuantity,
  estimate,
  selected,
  createEstimate,
}: Pick<BankPageModel, "tab" | "setTab" | "busy" | "need" | "setNeed" | "unit" | "setUnit" | "quantity" | "setQuantity" | "estimate" | "selected" | "createEstimate">) {
  return (
    <>
      {tab === "Bantuan Estimasi" && (
        <>
          <section className="panel">
            <div className="bank-section-heading">
              <div>
                <h2>Susun kebutuhan estimasi</h2>
                <p className="muted">
                  Gunakan referensi yang telah diperiksa untuk membantu
                  penyusunan OE.
                </p>
              </div>
              <Sparkle size={20} />
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
                    <option>m²</option>
                    <option>m</option>
                    <option>unit</option>
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
                {selected.length} referensi dipilih. Referensi harus memiliki
                satuan, lingkup, dan spesifikasi yang sebanding.
              </p>
              <div className="toolbar">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setTab("Pencarian Referensi")}
                >
                  Pilih referensi
                </button>
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
          {estimate && (
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
                  <dt>Estimasi total</dt>
                  <dd>
                    <strong>{money(estimate.total)}</strong>
                  </dd>
                  <dt>Rentang referensi</dt>
                  <dd>
                    {money(estimate.min)} – {money(estimate.max)} /{" "}
                    {estimate.unit}
                  </dd>
                </dl>
                <p className="bank-notice">
                  Estimasi menggunakan median tiga referensi historis. Tinjau
                  kondisi lokasi, spesifikasi, dan periode sebelum digunakan
                  dalam penyusunan OE. Hasil ini memerlukan keputusan
                  evaluator.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
