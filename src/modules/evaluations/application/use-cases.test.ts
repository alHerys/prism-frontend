// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createEvaluationsUseCases } from "./use-cases";
import type { Snapshot } from "../domain/models";
const snapshot: Snapshot = { id: "old-result", procurementId: "proc", module: "HEA", createdAt: "", status: "PARTIAL", rows: [], excluded: ["Unconfirmed"], inputs: { decimal: "1.0001" }, policy: "Original" };
const procurement = { id: "proc", name: "Procurement", number: "P-1", functionName: "Maintenance", createdAt: "", preferenceRevision: 0, preferenceConfirmed: false };
it("awaits the original snapshot download before recording export", async () => {
  const calls: string[] = [];
  let finish: () => void = () => {};
  const download = vi.fn(async () => { calls.push("download"); await new Promise<void>((resolve) => { finish = resolve; }); });
  const recordExport = vi.fn(async () => { calls.push("record"); });
  const commands = createEvaluationsUseCases({ recordExport }, { getSnapshot: () => ({ procurements: [procurement], vendors: [], documents: [], snapshots: [], events: [] }), subscribe: () => () => {} }, { download });
  const pending = commands.exportSnapshot(snapshot);
  expect(calls).toEqual(["download"]);
  expect(download).toHaveBeenCalledWith(snapshot, procurement);
  finish();
  await pending;
  expect(calls).toEqual(["download", "record"]);
  expect(recordExport).toHaveBeenCalledWith("old-result");
});
it("preserves the Bank fallback and does not record a failed download", async () => {
  const recordExport = vi.fn();
  const error = new Error("Download failed");
  const download = vi.fn(async () => { throw error; });
  const commands = createEvaluationsUseCases({ recordExport }, { getSnapshot: () => ({ procurements: [], vendors: [], documents: [], snapshots: [], events: [] }), subscribe: () => () => {} }, { download });
  await expect(commands.exportSnapshot(snapshot)).rejects.toBe(error);
  expect(download).toHaveBeenCalledWith(snapshot, { name: "Bank Data OE", number: "OE-HISTORIS" });
  expect(recordExport).not.toHaveBeenCalled();
});
