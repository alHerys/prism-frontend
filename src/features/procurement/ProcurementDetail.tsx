import { ProcurementDetailView } from "./ProcurementDetailView";
import { useProcurementDetail } from "./useProcurementDetail";
export function ProcurementDetail() {
  const model = useProcurementDetail();
  return <ProcurementDetailView {...model} />;
}
