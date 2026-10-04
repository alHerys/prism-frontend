import { HistoryPageView } from "./HistoryPageView";
import { useHistoryPage } from "./useHistoryPage";
export function HistoryPage(props: Parameters<typeof useHistoryPage>[0]) {
  const model = useHistoryPage(props);
  return <HistoryPageView {...model} />;
}

export default HistoryPage;
export type { HistoryPageProps } from "./history-page.types.ts";
