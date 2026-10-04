import type { EvaluationsGateway } from "./ports";

export function createEvaluationsUseCases(gateway: EvaluationsGateway) {
  return {
    recordExport: (...args: Parameters<EvaluationsGateway["recordExport"]>) => gateway.recordExport(...args),
  };
}
export type EvaluationsUseCases = ReturnType<typeof createEvaluationsUseCases>;
