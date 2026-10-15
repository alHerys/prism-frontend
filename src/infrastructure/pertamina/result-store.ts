import type { ReadStore } from "../../shared/kernel/read-store";
import type { Snapshot } from "../../modules/evaluations/domain/models";

/** Current procurement views exclude obsolete results; history keeps the full store. */
export function currentResultStore<T extends { snapshots: readonly Snapshot[] }>(source: ReadStore<T>, visible: (snapshot: Snapshot) => boolean): ReadStore<T> {
  let parent: T | undefined, value: T;
  return {
    subscribe: source.subscribe,
    getSnapshot() {
      const next = source.getSnapshot();
      if (next !== parent) { parent = next; value = Object.freeze({ ...next, snapshots: Object.freeze(next.snapshots.filter(visible)) }); }
      return value;
    },
  };
}
