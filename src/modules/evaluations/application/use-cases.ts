import type { EvaluationsGateway, SnapshotExporter } from "./ports";
import type { ProcurementQueries } from "../../procurement/application/queries";
import type { Snapshot } from "../domain/models";
export function createEvaluationsUseCases(gateway: EvaluationsGateway, procurements: ProcurementQueries, exporter: SnapshotExporter) {
  return {
    previewHEA: async (snapshot: Snapshot) => {
      if (snapshot.module !== "HEA" || !exporter.previewHEA) throw new Error("Pratinjau laporan HEA belum tersedia.");
      const procurement = procurements.getSnapshot().procurements.find(p => p.id === snapshot.procurementId);
      return exporter.previewHEA(snapshot, procurement ?? { name: "Pengadaan", number: snapshot.procurementId });
    },
    exportSnapshot: async (snapshot: Snapshot) => {
      const procurement = procurements.getSnapshot().procurements.find((p) => p.id === snapshot.procurementId);
      await exporter.download(snapshot, procurement ?? { name: "Bank Data OE", number: "OE-HISTORIS" });
      await gateway.recordExport(snapshot.id);
    },
  };
}
export type EvaluationsUseCases = ReturnType<typeof createEvaluationsUseCases>;
