import type { HEAPanelProps } from "./input-models";
import type { HEAPanelModel } from "./view-models";
import { HEAPreferences } from "./HEAPreferences";
import "../../../shared/styles/fernly-evaluation.css";

export function HEAPanelView({ ResultView, ...model }: HEAPanelModel & Pick<HEAPanelProps, "ResultView">) {
  return <div className="evaluation-workflow hea-workflow">
    {model.chosen && <ResultView snapshot={model.chosen} procurement={model.p} />}
    <HEAPreferences {...model} />
  </div>;
}
