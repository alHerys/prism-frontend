import { HistoryPageView } from "./HistoryPageView";
import { useHistoryPage } from "./useHistoryPage";
export function HistoryPage() {
  const model = useHistoryPage();
  return <HistoryPageView {...model} />;
}

export default HistoryPage;
