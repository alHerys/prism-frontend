import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
import { createTestSession } from "./test-session";

it("preserves all seeded values, IDs, event order and prepared snapshots from the original service", () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date("2026-10-02T02:00:00Z"));
    const states = [createTestSession(false).getState(), createTestSession().getState(), createTestSession(true, true).getState()];
    // Updated for the approved showcase name without the "Siap Evaluasi" suffix.
    expect(states[2].procurements.find(procurement => procurement.id === "proc-showcase")?.name).toBe("Penggantian Jalur Pipa");
    // The report adds optional intermediate values; protect every original field
    // with the original fingerprint rather than replacing its baseline.
    const withoutOE = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(withoutOE);
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "ownerEstimate" && key !== "offerSpreadsheet").map(([key, child]) => [key, withoutOE(child)]));
      return value;
    };
    const originalShape = states.map(state => ({ ...state, snapshots: state.snapshots.map(snapshot => ({
      ...snapshot, rows: snapshot.rows.map(row => {
        const original = { ...row };
        delete original.calculation;
        return original;
      }),
    })) }));
    expect(createHash("sha256").update(JSON.stringify(withoutOE(originalShape))).digest("hex")).toBe("14203add233410aea0a99d29ad4f6b61f80c13ca7447f2909021ca8ae3f5622d");
  } finally {
    vi.useRealTimers();
  }
});
it("notifies only its subscribers, keeps stable views between mutations and stops after unsubscribe", async () => {
  const service = createTestSession(false);
  const other = createTestSession(false);
  const listener = vi.fn();
  const isolatedListener = vi.fn();
  const stop = service.subscribe(listener);
  other.subscribe(isolatedListener);
  const before = service.getState();
  expect(service.getState()).toBe(before);
  await service.createProcurement({ name: "Synthetic", number: "TEST-1", functionName: "Maintenance" });
  expect(service.getState()).not.toBe(before);
  expect(before.procurements).toEqual([]);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(isolatedListener).not.toHaveBeenCalled();
  stop();
  await service.addVendor(service.getState().procurements[0].id, "Vendor");
  expect(listener).toHaveBeenCalledTimes(1);
});
it("rejects an invalid command without changing views, events or the next allocated identity", async () => {
  const service = createTestSession(false);
  const control = createTestSession(false);
  const listener = vi.fn();
  service.subscribe(listener);
  const before = service.getState();
  await expect(service.addVendor("absent", "Vendor")).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(service.getState()).toBe(before);
  expect(listener).not.toHaveBeenCalled();
  const input = { name: "Regression", number: "TEST-2", functionName: "Maintenance" };
  expect((await service.createProcurement(input)).id).toBe((await control.createProcurement(input)).id);
});
