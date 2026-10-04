import type { HistoryPageProps } from "./history-page.types";
import { HistoryPageView } from "./HistoryPageView";
import { useHistoryPage } from "./useHistoryPage";
export function HistoryPage(props: HistoryPageProps) {
  const model = useHistoryPage(props);
  return <HistoryPageView {...model} />;
}

export default HistoryPage;
export type { HistoryPageProps } from "./history-page.types.ts";
