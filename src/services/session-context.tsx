import type { ReactNode } from "react";
import { createContext, use, useSyncExternalStore } from "react";
import type { SessionService } from "./session-service";
const SessionContext = createContext<SessionService | null>(null);
export function SessionProvider({ service, children }: { service: SessionService; children: ReactNode }) {
  return <SessionContext value={service}>{children}</SessionContext>;
}
export function useSessionService(override?: SessionService): SessionService {
  const context = use(SessionContext);
  const service = override ?? context;
  if (!service) throw new Error("SessionProvider is required.");
  return service;
}
export function useSessionState(override?: SessionService) {
  const service = useSessionService(override);
  return useSyncExternalStore(service.subscribe, service.getState);
}
