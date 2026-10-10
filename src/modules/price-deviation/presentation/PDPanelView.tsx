import type { PDPanelProps } from "./input-models";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { Link } from "react-router";
import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import { Stepper } from "../../../shared/ui/stepper";
import { Status } from "../../../shared/ui/status";
import type { PDPanelModel } from "./view-models";

export function PDPanelView({ ResultView, p, docs, oe, setOe, offer, setOffer, busy, chosen, evaluate }: PDPanelModel & Pick<PDPanelProps, "ResultView">) {

  return (
    <div className="evaluation-workflow price-workflow">
      <Stepper stage={chosen ? 4 : oe && offer ? 2 : 0} />
      {chosen && <ResultView snapshot={chosen} procurement={p} />}
      <section className="panel evaluation-price-sources">
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
        <div className="evaluation-source-grid">
          {[
            ["OE pengadaan", "OE", oe, setOe],
            ["Penawaran vendor", "OFFER", offer, setOffer],
          ].map(([label, kind, value, setter]) => {
            const selectedDocument = docs.find((document) => document.id === value);
            return (
            <div className="field evaluation-source-field" key={label as string}>
              <label>
                <FileText aria-hidden="true" size={20} />
                {label as string}
              </label>
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
                <div className="evaluation-source-meta">
                  {selectedDocument && <Status value={selectedDocument.status} />}
                  <Link to={`/pengadaan/${p.id}/review/${value}`}>
                    Periksa sumber dan kelompok harga
                  </Link>
                </div>
              )}
            </div>
            );
          })}
        </div>
        <div className="alert">
          Harga timpang diperiksa per komponen material dan jasa. Pasangan belum
          valid ditampilkan terpisah dan tidak dikategorikan tidak timpang.
        </div>
      </section>
    </div>
  );
}
