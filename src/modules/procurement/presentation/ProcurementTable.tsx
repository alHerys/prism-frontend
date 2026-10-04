import { ProcurementTableView } from "./ProcurementTableView";
import { useProcurementTable } from "./useProcurementTable";
export function ProcurementTable(props: Parameters<typeof useProcurementTable>[0]) {
  const model = useProcurementTable(props);
  return <ProcurementTableView {...model} />;
}
