import { HEAPanelView } from "./HEAPanelView";
import { useHEAPanel } from "./useHEAPanel";
export function HEAPanel(props: Parameters<typeof useHEAPanel>[0]) {
  const model = useHEAPanel(props);
  return <HEAPanelView {...model} />;
}
