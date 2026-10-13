// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createHEAUseCases } from "./use-cases";
import type { HEAGateway } from "./ports";
import type { Procurement } from "../../procurement/domain/models";
import type { Snapshot } from "../../evaluations/domain/models";

const input = { procurementId: "proc", expectedRevision: 1, preferences: { preferensi_barang: "0.15", preferensi_jasa: "0.075" }, documentIds: ["a5"] };
function setup() {
  const saved = { id: "proc", preferenceRevision: 2 } as Procurement;
  const gateway: HEAGateway = { setPreferences: vi.fn(async () => saved), confirmPreferences: vi.fn(async () => saved), evaluateHEA: vi.fn(async () => ({ id: "result" }) as Snapshot) };
  return { gateway, commands: createHEAUseCases(gateway, async () => {}) };
}
it("saves and confirms the returned revision before evaluation", async () => {
  const { gateway, commands } = setup();
  await expect(commands.evaluateWithPreferences(input)).resolves.toMatchObject({ id: "result" });
  expect(gateway.setPreferences).toHaveBeenCalledWith("proc", input.preferences, 1);
  expect(gateway.confirmPreferences).toHaveBeenCalledWith("proc", 2);
  expect(gateway.evaluateHEA).toHaveBeenCalledWith("proc", ["a5"]);
  expect(vi.mocked(gateway.confirmPreferences).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(gateway.evaluateHEA).mock.invocationCallOrder[0]);
});
it.each(["setPreferences", "confirmPreferences"] as const)("never evaluates after %s rejects", async step => {
  const { gateway, commands } = setup();
  vi.mocked(gateway[step]).mockRejectedValueOnce(new Error("Rejected"));
  await expect(commands.evaluateWithPreferences(input)).rejects.toThrow("Rejected");
  expect(gateway.evaluateHEA).not.toHaveBeenCalled();
});
