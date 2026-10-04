import { DashboardView } from "./DashboardView";
import { useDashboard } from "./useDashboard";
export function Dashboard() {
  const model = useDashboard();
  return <DashboardView {...model} />;
}
