import type { BinarySource } from "../../../shared/kernel/binary-source";
import type { ReadStore } from "../../../shared/kernel/read-store";
import type { A5Candidate, ExistingA5Vendor, IntakeData, IntakeItem, IntakeSource } from "../domain/intake";

export interface A5ExtractionPort {
  extract(file: BinarySource, requestId: string): Promise<A5Candidate>;
  cancel(requestId: string): void;
}
export interface IntakeAssets {
  prepare(file: BinarySource): Promise<IntakeSource>;
  file(sourceId: string): BinarySource;
  release(sourceId: string): void;
}
export interface A5PublicationPort {
  existing(procurementId: string): ExistingA5Vendor[];
  publish(procurementId: string, item: IntakeItem): Promise<{ documentId: string }>;
}
export interface IntakeStore extends ReadStore<IntakeData> { replace(data: IntakeData): void; }
