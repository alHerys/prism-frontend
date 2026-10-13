import type { PDPanelProps } from "./input-models";
import type { PDPanelModel } from "./view-models";
import { EmptyState } from "../../../shared/ui/empty-state";
import "../../../shared/styles/fernly-evaluation.css";

export function PDPanelView({ ResultView, p, chosen }: PDPanelModel & Pick<PDPanelProps, "ResultView">) {
  return <div className="evaluation-workflow price-workflow">
    {chosen ? <ResultView snapshot={chosen} procurement={p} /> :
      <section className="panel"><EmptyState title="Belum ada hasil Harga Timpang">Hasil evaluasi yang sudah tersimpan akan tampil di sini.</EmptyState></section>}
  </div>;
}
