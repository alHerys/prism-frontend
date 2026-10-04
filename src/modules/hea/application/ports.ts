import type { Procurement } from "../../procurement/domain/models";
import type { Preferences } from "../domain/models";
import type { Snapshot } from "../../evaluations/domain/models";

export interface HEAGateway {
  setPreferences(procurementId: string, values: Preferences, expectedRevision: number): Promise<Procurement>;
  confirmPreferences(procurementId: string, expectedRevision: number): Promise<Procurement>;
  evaluateHEA(procurementId: string, documentIds: string[]): Promise<Snapshot>;
}
