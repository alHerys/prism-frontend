import type { DocumentRecord } from "../../documents/domain/models";
import type { PricePair } from "../domain/models";
import type { Snapshot } from "../../evaluations/domain/models";

export interface PriceDeviationGateway {
  selectGroup(id: string, group: string, expectedRevision: number): Promise<DocumentRecord>;
  reviewPairs(id: string, pairs: PricePair[], expectedRevision: number): Promise<DocumentRecord>;
  confirmPairs(id: string, expectedRevision: number, acknowledged?: boolean): Promise<DocumentRecord>;
  evaluateDeviation(procurementId: string, oeId: string, offerId: string): Promise<Snapshot>;
}
