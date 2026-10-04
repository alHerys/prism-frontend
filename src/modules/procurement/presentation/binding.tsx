import { createModuleBinding } from "../../../shared/ui/module-binding";
import type { ProcurementUseCases } from "../application/use-cases";
import type { ProcurementData } from "../application/queries";
const binding = createModuleBinding<ProcurementUseCases, ProcurementData>("Procurement");
export const ProcurementProvider = binding.Provider;
export const useProcurementCommands = binding.useCommands;
export const useProcurementData = binding.useData;
