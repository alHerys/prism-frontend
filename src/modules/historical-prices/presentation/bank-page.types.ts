
import type { Snapshot } from "../../../shared/model/session";
import "../../../shared/styles/bank.css";
export interface BankPageProps {
  onExport?: (snapshot: Snapshot) => Promise<void> | void;
}
