import { UploadPanelView } from "./UploadPanelView";
import { useUploadPanel } from "./useUploadPanel";
export function UploadPanel(props: Parameters<typeof useUploadPanel>[0]) {
  const model = useUploadPanel(props);
  return <UploadPanelView {...model} />;
}
