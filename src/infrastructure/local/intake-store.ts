import type { IntakeStore } from "../../modules/documents/application/intake-ports";
import type { IntakeData } from "../../modules/documents/domain/intake";

export function createIntakeStore(): IntakeStore {
  let snapshot: IntakeData = Object.freeze({ batches: [] });
  const listeners = new Set<() => void>();
  const freeze = (value: unknown): void => {
    if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    replace: data => { snapshot = structuredClone(data); freeze(snapshot); listeners.forEach(listener => listener()); },
  };
}
