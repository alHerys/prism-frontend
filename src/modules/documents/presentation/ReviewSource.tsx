import { DataTable } from "../../../shared/ui/data-table";
import { ArrowsOut } from "@phosphor-icons/react/dist/csr/ArrowsOut";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { money, pct } from "../../../shared/formatting/display";
import type { A5Values, DocumentRecord } from "../domain/models";
import "../../../shared/styles/focus.css";
import { SourcePanel } from "../../../shared/ui/source-panel";
import { fields } from "./review-fields";
import type { ReviewModel } from "./view-models";
export function ReviewSource({ d, focused, p, vendor, source }: Pick<ReviewModel, "d" | "focused" | "p" | "vendor" | "source"> & { d: DocumentRecord }) {
  return (
    <SourcePanel
      id="review-source"
      className="review-source"
      title="Bukti sumber"
      action={
        source && (
          <a
            className="btn small"
            href={source.path}
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
      {d.kind === "FORM_A5" && source ? (
        <>
          <iframe
            className="review-pdf-preview"
            src={source.path}
            title={`Preview PDF ${d.name}`}
          />
        </>
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
            <div className="table-wrap" role="region" aria-label="Harga dari dokumen sumber" tabIndex={0}><DataTable rows={d.priceItems || []} label="Harga dari dokumen sumber" columns={[
  { label: "Komponen", value: pair => pair.description, filter: pair => pair.category === "MATERIAL" ? "Material" : "Jasa" },
  { label: "Harga", value: pair => d.kind === "OE" ? pair.oe : pair.offer, type: "decimal" },
]}>{(pair) => (
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
                )}</DataTable></div>
          )}
        </div>
      )}
    </SourcePanel>
  );
}
