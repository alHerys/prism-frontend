import type { A5Values, DemoState, DocumentRecord, Estimate, HistoricalStatistics, Preferences, PricePair, Procurement, Snapshot, UploadInput } from "../shared/model/session";

export interface SessionService {
  getState: () => DemoState;
  subscribe: (listener: () => void) => () => void;
  createProcurement(input: {
    name: string;
    number: string;
    functionName: string;
  }): Promise<Procurement>;
  addVendor(procurementId: string, name: string): Promise<{
    id: string;
    procurementId: string;
    name: string;
  }>;
  uploadRegisteredDocument(input: UploadInput): Promise<DocumentRecord>;
  reviewDocument(id: string, values: A5Values, expectedRevision: number): Promise<DocumentRecord>;
  confirmDocument(id: string, expectedRevision: number, acknowledged?: boolean): Promise<DocumentRecord>;
  setPreferences(procurementId: string, values: Preferences, expectedRevision: number): Promise<Procurement>;
  confirmPreferences(procurementId: string, expectedRevision: number): Promise<Procurement>;
  evaluateHEA(procurementId: string, documentIds: string[]): Promise<Snapshot>;
  selectGroup(id: string, group: string, expectedRevision: number): Promise<DocumentRecord>;
  reviewPairs(id: string, pairs: PricePair[], expectedRevision: number): Promise<DocumentRecord>;
  confirmPairs(id: string, expectedRevision: number, acknowledged?: boolean): Promise<DocumentRecord>;
  evaluateDeviation(procurementId: string, oeId: string, offerId: string): Promise<Snapshot>;
  setHistoricalMetadata(id: string, input: {
    functionName: string;
    period: string;
  }, expectedRevision: number): Promise<DocumentRecord>;
  publishHistory(id: string, expectedRevision: number): Promise<DocumentRecord>;
  setComparable(id: string, value: boolean): Promise<void>;
  estimate(input: {
    description: string;
    unit: string;
    quantity: string;
    referenceIds: string[];
  }): Promise<Estimate>;
  getPreparedStatistics(referenceIds: string[]): HistoricalStatistics | undefined;
  getHistoricalStatistics: (referenceIds: string[]) => HistoricalStatistics | undefined;
  createBankSnapshot(referenceIds: string[]): Promise<Snapshot>;
  recordExport(snapshotId: string): Promise<void>;
}
