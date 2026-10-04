import type { PDPanelProps } from "./input-models";
import { PDPanelView } from "./PDPanelView";
import { usePDPanel } from "./usePDPanel";
export function PDPanel({ ResultView, ...props }: PDPanelProps) {
  const model = usePDPanel(props);
  return <PDPanelView {...model} ResultView={ResultView} />;
}
