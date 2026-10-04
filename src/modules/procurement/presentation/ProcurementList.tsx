import { ProcurementListView } from "./ProcurementListView";
import { useProcurementList } from "./useProcurementList";
export function ProcurementList() {
  const model = useProcurementList();
  return <ProcurementListView {...model} />;
}
