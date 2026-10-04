import type { HEAGateway } from "./ports";
import type { Delay } from "../../../shared/kernel/binary-source";

export function createHEAUseCases(gateway: HEAGateway, delay: Delay) {
  return {
    setPreferences: (...args: Parameters<HEAGateway["setPreferences"]>) => gateway.setPreferences(...args),
    confirmPreferences: (...args: Parameters<HEAGateway["confirmPreferences"]>) => gateway.confirmPreferences(...args),
    evaluateHEA: async (...args: Parameters<HEAGateway["evaluateHEA"]>) => { await delay(450); return gateway.evaluateHEA(...args); },
  };
}
export type HEAUseCases = ReturnType<typeof createHEAUseCases>;
