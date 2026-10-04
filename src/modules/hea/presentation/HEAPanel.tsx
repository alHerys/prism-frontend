import type { HEAPanelProps } from "./input-models";
import { HEAPanelView } from "./HEAPanelView";
import { useHEAPanel } from "./useHEAPanel";
export function HEAPanel({ ResultView, ...props }: HEAPanelProps) {
  const model = useHEAPanel(props);
  return <HEAPanelView {...model} ResultView={ResultView} />;
}
