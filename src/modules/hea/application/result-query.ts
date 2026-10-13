import type { Snapshot } from "../../evaluations/domain/models";
import type { Procurement } from "../../procurement/domain/models";

export function usesCurrentPreferences(snapshot: Snapshot, procurement: Procurement) {
  if (!snapshot.inputs || typeof snapshot.inputs !== "object" || !("procurement" in snapshot.inputs)) return false;
  const input = snapshot.inputs.procurement;
  return !!input && typeof input === "object" && "preferenceRevision" in input && input.preferenceRevision === procurement.preferenceRevision;
}
