import { ResultPanelView } from "./ResultPanelView";
import { useResultPanel } from "./useResultPanel";
export function ResultPanel(props: Parameters<typeof useResultPanel>[0]) {
  const model = useResultPanel(props);
  return <ResultPanelView {...model} />;
}
