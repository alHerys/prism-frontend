import type { ProcurementTableProps } from "./input-models";
import { ProcurementTableView } from "./ProcurementTableView";
import { useProcurementTable } from "./useProcurementTable";
export function ProcurementTable({ children, ...props }: ProcurementTableProps) {
  const model = useProcurementTable(props);
  return <ProcurementTableView {...model}>{children}</ProcurementTableView>;
}
