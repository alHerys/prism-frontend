import { createModuleBinding } from "../../../shared/ui/module-binding";
import type { EvaluationsUseCases } from "../application/use-cases";
import type { EvaluationsData } from "../application/queries";
const binding = createModuleBinding<EvaluationsUseCases, EvaluationsData>("Evaluations");
export const EvaluationsProvider = binding.Provider;
export const useEvaluationsCommands = binding.useCommands;
export const useEvaluationsData = binding.useData;
