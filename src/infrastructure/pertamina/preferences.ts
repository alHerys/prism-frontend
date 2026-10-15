import type { HEAGateway } from "../../modules/hea/application/ports";
import { reviewedPreferences } from "../../modules/hea/domain/preferences";
import type { EvaluationCoordinator } from "./evaluations";
import type { LocalStore } from "../local/store";
import { copy, DomainError } from "../../shared/kernel/validation";

export function createCalculatingHEA(store: LocalStore, evaluations: EvaluationCoordinator): HEAGateway {
  return {
    setPreferences: async (id, values, revision) => store.transaction(() => {
      const p = store.proc(id); store.check(p.preferenceRevision, revision);
      const updated = reviewedPreferences(p, values);
      if (updated) Object.assign(p, updated);
      if (updated || !p.preferenceConfirmed) {
        p.preferenceConfirmed = true;
        store.event({ procurementId: id, module: "HEA", type: "CONFIRMED", summary: "Preferensi pengadaan disimpan" });
        evaluations.refreshHEA(id); store.emit();
      }
      return copy(p);
    }),
    confirmPreferences: async (id, revision) => {
      const p = store.proc(id); store.check(p.preferenceRevision, revision);
      if (!p.preferences) throw new DomainError("PREFERENCES_REQUIRED", "Isi preferensi barang dan jasa.");
      return copy(p);
    },
    evaluateHEA: async id => store.transaction(() => {
      const result = evaluations.refreshHEA(id);
      if (!result) throw new DomainError("INPUT_REQUIRED", "Simpan preferensi dan minimal satu Form A5 sebelum evaluasi.");
      return copy(result);
    }),
  };
}
