import type { UploadPanelProps } from "./input-models";
import { UploadPanelView } from "./UploadPanelView";
import { useUploadPanel } from "./useUploadPanel";
export function UploadPanel(props: UploadPanelProps) {
  const model = useUploadPanel(props);
  return <UploadPanelView {...model} />;
}
