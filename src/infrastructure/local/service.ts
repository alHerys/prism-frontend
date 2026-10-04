import type {
  A5Values,
  HistoricalStatistics,
  Preferences,
  PricePair,
  UploadInput
} from "../../shared/model/session";
import type { SessionService } from "../../services/session-service";
import { confirmDocument, reviewDocument, uploadRegisteredDocument } from "./documents";
import { confirmPreferences, evaluateHEA, setPreferences } from "./hea";
import { createBankSnapshot, estimate, getPreparedStatistics, publishHistory, setComparable, setHistoricalMetadata } from "./historical";
import { confirmPairs, evaluateDeviation, reviewPairs, selectGroup } from "./price-deviation";
import { addVendor, createProcurement } from "./procurement";
import { initializeSession } from "./seed";
import { recordExport } from "./snapshots";
import { LocalStore } from "./store";
export { DomainError } from "./validation";
export class LocalSession implements SessionService {
  private readonly store: LocalStore;
  constructor(seed = true, prepared = false) { this.store = new LocalStore(); initializeSession(this.store, seed, prepared); }
  getState = () => this.store.getState();
  subscribe = (listener: () => void) => this.store.subscribe(listener);
  async createProcurement(input: {
    name: string;
    number: string;
    functionName: string;
  }) { return createProcurement(this.store, input); }
  async addVendor(procurementId: string, name: string) { return addVendor(this.store, procurementId, name); }
  async uploadRegisteredDocument(input: UploadInput) { return uploadRegisteredDocument(this.store, input); }
  async reviewDocument(id: string, values: A5Values, expectedRevision: number) { return reviewDocument(this.store, id, values, expectedRevision); }
  async confirmDocument(id: string, expectedRevision: number, acknowledged = false) { return confirmDocument(this.store, id, expectedRevision, acknowledged); }
  async setPreferences(procurementId: string, values: Preferences, expectedRevision: number) { return setPreferences(this.store, procurementId, values, expectedRevision); }
  async confirmPreferences(procurementId: string, expectedRevision: number) { return confirmPreferences(this.store, procurementId, expectedRevision); }
  async evaluateHEA(procurementId: string, documentIds: string[]) { return evaluateHEA(this.store, procurementId, documentIds); }
  async selectGroup(id: string, group: string, expectedRevision: number) { return selectGroup(this.store, id, group, expectedRevision); }
  async reviewPairs(id: string, pairs: PricePair[], expectedRevision: number) { return reviewPairs(this.store, id, pairs, expectedRevision); }
  async confirmPairs(id: string, expectedRevision: number, acknowledged = false) { return confirmPairs(this.store, id, expectedRevision, acknowledged); }
  async evaluateDeviation(procurementId: string, oeId: string, offerId: string) { return evaluateDeviation(this.store, procurementId, oeId, offerId); }
  async setHistoricalMetadata(id: string, input: {
    functionName: string;
    period: string;
  }, expectedRevision: number) { return setHistoricalMetadata(this.store, id, input, expectedRevision); }
  async publishHistory(id: string, expectedRevision: number) { return publishHistory(this.store, id, expectedRevision); }
  async setComparable(id: string, value: boolean) { return setComparable(this.store, id, value); }
  async estimate(input: { description: string; unit: string; quantity: string; referenceIds: string[] }) { return estimate(this.store, input); }
  getPreparedStatistics(referenceIds: string[]): HistoricalStatistics | undefined { return getPreparedStatistics(this.store, referenceIds); }
  async createBankSnapshot(referenceIds: string[]) { return createBankSnapshot(this.store, referenceIds); }
  async recordExport(snapshotId: string) { return recordExport(this.store, snapshotId); }
  getHistoricalStatistics = (referenceIds: string[]) => this.getPreparedStatistics(referenceIds);
}
export const createLocalSession = (seed = true, prepared = false) => new LocalSession(seed, prepared);
