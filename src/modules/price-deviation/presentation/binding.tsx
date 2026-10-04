import { createModuleBinding } from "../../../shared/ui/module-binding";
import type { PriceDeviationUseCases } from "../application/use-cases";
import type { PriceDeviationData } from "../application/queries";
const binding = createModuleBinding<PriceDeviationUseCases, PriceDeviationData>("PriceDeviation");
export const PriceDeviationProvider = binding.Provider;
export const usePriceDeviationCommands = binding.useCommands;
export const usePriceDeviationData = binding.useData;
