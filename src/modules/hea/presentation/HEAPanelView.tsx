import type { HEAPanelProps } from "./input-models";
import type { HEAPanelModel } from "./view-models";
import { HEAPreferences } from "./HEAPreferences";
import { WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import "../../../shared/styles/fernly-evaluation.css";

export function HEAPanelView({ ResultView, ...model }: HEAPanelModel & Pick<HEAPanelProps, "ResultView">) {
  return <div className="evaluation-workflow hea-workflow">
    <HEAPreferences {...model} />
    {model.chosen ? <ResultView snapshot={model.chosen} procurement={model.p} /> :
      <section className="panel hea-result-empty" aria-label="Leaderboard HEA belum tersedia">
        <WarningCircle size={36} aria-hidden="true" />
        <h2>Leaderboard belum tersedia</h2>
        <p>Isi preferensi barang dan jasa, lalu tekan Evaluasi HEA untuk menghitung leaderboard.</p>
        {!model.eligibleDocumentIds.length && <p>Konfirmasikan Form A5 vendor sebelum melakukan evaluasi.</p>}
      </section>}
  </div>;
}
