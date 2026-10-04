import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
import { createTestSession } from "./test-session";

it("preserves all seeded values, IDs, event order and prepared snapshots from the original service", () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date("2026-10-02T02:00:00Z"));
    const states = [createTestSession(false).getState(), createTestSession().getState(), createTestSession(true, true).getState()];
    // Captured from the implementation before modularization with the same clock.
    expect(createHash("sha256").update(JSON.stringify(states)).digest("hex")).toBe("43313f64f1dbd55a1ea839b6bb34ba2ffaea40ec9e13587ce568bcb127db1c80");
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
