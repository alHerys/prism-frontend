import type { ResultPanelProps } from "./input-models";
import { ResultPanelView } from "./ResultPanelView";
import { useResultPanel } from "./useResultPanel";
export function ResultPanel(props: ResultPanelProps) {
  const model = useResultPanel(props);
  return <ResultPanelView {...model} />;
}
