import { bankMoney as money } from "../../shared/formatters/display";
import "../../shared/styles/bank.css";
import type { useBankPage } from "./useBankPage";
export function ReferenceDetail({ state, detail, setDetail, compareReference }: Pick<ReturnType<typeof useBankPage>, "state" | "detail" | "setDetail" | "compareReference">) {
  return (
    <>
      {detail && (
        <section className="panel">
          <div className="bank-section-heading">
            <h2>Jejak sumber referensi</h2>
            <button className="btn" onClick={() => setDetail(undefined)}>
              Tutup rincian
            </button>
          </div>
          <div className="bank-details">
            <dl>
              <dt>Dokumen</dt>
              <dd>{detail.documentName}</dd>
              <dt>Pekerjaan</dt>
              <dd>{detail.description}</dd>
              <dt>Fungsi / periode</dt>
              <dd>
                {detail.functionName} · {detail.period}
              </dd>
              <dt>Sumber</dt>
              <dd>{detail.source}</dd>
              <dt>Harga satuan</dt>
              <dd>
                {money(detail.price)} / {detail.unit}
              </dd>
            </dl>
            <p className="bank-subtle muted">
              Periksa lingkup pekerjaan, spesifikasi, satuan, dan konteks
              periode sebelum menyatakan referensi sebanding.
            </p>
            <label className="bank-comparability">
              <input
                type="checkbox"
                checked={
                  state.historicalItems.find((i) => i.id === detail.id)
                    ?.comparable ?? false
                }
                onChange={(e) =>
                  void compareReference(detail.id, e.target.checked)
                }
              />
              Saya telah memeriksa kesebandingan item ini
            </label>
          </div>
        </section>
      )}
    </>
  );
}
