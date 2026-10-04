import { useSessionState } from "../../services/session-context";

export function useDashboard() {
  const state = useSessionState();
  const pending = state.documents.filter((d) => d.status !== "CONFIRMED");
  return { state, pending };
}
