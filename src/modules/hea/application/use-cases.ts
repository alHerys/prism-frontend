import type { HEAGateway } from "./ports";
import type { Delay } from "../../../shared/kernel/binary-source";
import type { Preferences } from "../domain/models";

export function createHEAUseCases(gateway: HEAGateway, delay: Delay) {
  return {
    setPreferences: (...args: Parameters<HEAGateway["setPreferences"]>) => gateway.setPreferences(...args),
    confirmPreferences: (...args: Parameters<HEAGateway["confirmPreferences"]>) => gateway.confirmPreferences(...args),
    evaluateHEA: async (...args: Parameters<HEAGateway["evaluateHEA"]>) => { await delay(450); return gateway.evaluateHEA(...args); },
    evaluateWithPreferences: async (input: { procurementId: string; preferences: Preferences; expectedRevision: number; documentIds: string[] }) => {
      const saved = await gateway.setPreferences(input.procurementId, input.preferences, input.expectedRevision);
      await gateway.confirmPreferences(saved.id, saved.preferenceRevision);
      await delay(450);
      return gateway.evaluateHEA(saved.id, input.documentIds);
    },
  };
}
export type HEAUseCases = ReturnType<typeof createHEAUseCases>;
