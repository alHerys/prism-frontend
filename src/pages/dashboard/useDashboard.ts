import { useProcurementData } from "../../modules/procurement/presentation/binding";

export function useDashboard() {
  const state = useProcurementData();
  const pending = state.documents.filter((d) => d.status !== "CONFIRMED");
  return { state, pending };
}
