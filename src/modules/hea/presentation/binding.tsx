import { createModuleBinding } from "../../../shared/ui/module-binding";
import type { HEAUseCases } from "../application/use-cases";
import type { HEAData } from "../application/queries";
const binding = createModuleBinding<HEAUseCases, HEAData>("HEA");
export const HEAProvider = binding.Provider;
export const useHEACommands = binding.useCommands;
export const useHEAData = binding.useData;
