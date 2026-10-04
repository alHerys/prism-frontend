import { ArrowsOut } from "@phosphor-icons/react/dist/csr/ArrowsOut";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { money, pct } from "../../../shared/formatters/display";
import type { A5Values, DocumentRecord } from "../../../shared/model/session";
import "../../../shared/styles/focus.css";
import { SourcePanel } from "../../../shared/ui/components";
import { fields } from "./review-fields";
import type { useReview } from "./useReview";
export function ReviewSource({ d, focused, p, vendor, fixture }: Pick<ReturnType<typeof useReview>, "d" | "focused" | "p" | "vendor" | "fixture"> & { d: DocumentRecord }) {
  return (
    <SourcePanel
      id="review-source"
      className="review-source"
      title="Bukti sumber"
      action={
        fixture && (
          <a
            className="btn small"
            href={fixture.path}
            target={d.kind === "FORM_A5" ? "_blank" : undefined}
            rel={d.kind === "FORM_A5" ? "noreferrer" : undefined}
            download={d.kind === "FORM_A5" ? undefined : true}
            aria-label={d.kind === "FORM_A5" ? "Perbesar PDF di tab baru" : "Buka berkas"}
            title={d.kind === "FORM_A5" ? "Perbesar PDF" : "Buka berkas"}
          >
            {d.kind === "FORM_A5" ? <ArrowsOut aria-hidden="true" /> : <><FileText /> Buka berkas</>}
          </a>
        )
      }
    >
      {d.kind === "FORM_A5" && fixture ? (
        <iframe
          className="review-pdf-preview"
          src={fixture.path}
          title={`Preview PDF ${d.name}`}
        />
      ) : (
        <div className="paper">
          <div className="paper-header">
            <h3>
              {d.kind === "FORM_A5"
                ? "FORM A5 · KOMITMEN TKDN"
                : "RINCIAN HARGA SATUAN"}
            </h3>
            <small>{vendor?.name || p.name}</small>
          </div>
          {d.candidate ? (
            <dl>
              {Object.entries(d.candidate).map(([key, value]) => (
                <div
                  key={key}
                  className={`review-source-value${focused === key ? " selected" : ""}`}
                >
                  <dt>{fields[key as keyof A5Values]}</dt>
                  <dd>
                    {key.startsWith("tkdn")
                      ? d.sources.find((s) => s.field === key)?.quote ||
                      pct(value)
                      : money(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th>Harga</th>
                </tr>
              </thead>
              <tbody>
                {(d.priceItems || []).map((pair) => (
                  <tr key={pair.id}>
                    <td>
                      {pair.description}
                      <small>
                        {pair.category === "MATERIAL"
                          ? "Material"
                          : "Jasa"}{" "}
                        · {pair.unit}
                      </small>
                    </td>
                    <td>
                      {money(d.kind === "OE" ? pair.oe : pair.offer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {d.sources
            .filter((s) => d.kind !== "FORM_A5" || s.field === focused)
            .map((s, i) => (
              <div className="evidence" key={i}>
                <strong>{s.location}</strong>
                <p>{s.quote}</p>
              </div>
            ))}
        </div>
      )}
    </SourcePanel>
  );
}
