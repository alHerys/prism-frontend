import { PDPanelView } from "./PDPanelView";
import { usePDPanel } from "./usePDPanel";
export function PDPanel(props: Parameters<typeof usePDPanel>[0]) {
  const model = usePDPanel(props);
  return <PDPanelView {...model} />;
}
