import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { Link } from "react-router";
import "../../../shared/styles/focus.css";
import { Stepper } from "../../../shared/ui/feedback";
import { ResultPanel } from "../../evaluations/presentation/ResultPanel";
import type { usePDPanel } from "./usePDPanel";

export function PDPanelView({ p, docs, oe, setOe, offer, setOffer, busy, chosen, evaluate }: ReturnType<typeof usePDPanel>) {

  return (
    <>
      <Stepper stage={chosen ? 4 : oe && offer ? 2 : 0} />
      {chosen && <ResultPanel snapshot={chosen} procurement={p} />}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Sumber perbandingan harga</h2>
            <p>
              Pilih dokumen OE dan satu set penawaran vendor dalam pengadaan
              ini.
            </p>
          </div>
          <button
            className="btn primary"
            disabled={busy || !oe || !offer}
            onClick={() => void evaluate()}
          >
            {busy ? "Mengevaluasi…" : "Evaluasi harga"}
            <ArrowRight />
          </button>
        </div>
        <div className="form-grid">
          {[
            ["OE pengadaan", "OE", oe, setOe],
            ["Penawaran vendor", "OFFER", offer, setOffer],
          ].map(([label, kind, value, setter]) => (
            <div className="field" key={label as string}>
              <label>{label as string}</label>
              <select
                aria-label={label as string}
                value={value as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
              >
                <option value="">Pilih dokumen</option>
                {docs
                  .filter((d) => d.kind === kind)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.status === "CONFIRMED"
                        ? " · Terkonfirmasi"
                        : " · Perlu ditinjau"}
                    </option>
                  ))}
              </select>
              {value && (
                <Link to={`/pengadaan/${p.id}/review/${value}`}>
                  Periksa sumber dan kelompok harga
                </Link>
              )}
            </div>
          ))}
        </div>
        <div className="alert">
          Harga timpang diperiksa per komponen material dan jasa. Pasangan belum
          valid ditampilkan terpisah dan tidak dikategorikan tidak timpang.
        </div>
      </section>
    </>
  );
}
