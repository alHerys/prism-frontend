import type { SessionService } from "../../services/session-service";
import type { Snapshot } from "../../shared/model/session";
import "../../shared/styles/bank.css";
export interface BankPageProps {
  service?: SessionService;
  onExport?: (snapshot: Snapshot) => Promise<void> | void;
}
