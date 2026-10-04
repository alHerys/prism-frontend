import { createModuleBinding } from "../../../shared/ui/module-binding";
import type { HistoricalPricesUseCases } from "../application/use-cases";
import type { HistoricalPricesData } from "../application/queries";
const binding = createModuleBinding<HistoricalPricesUseCases, HistoricalPricesData>("HistoricalPrices");
export const HistoricalPricesProvider = binding.Provider;
export const useHistoricalPricesCommands = binding.useCommands;
export const useHistoricalPricesData = binding.useData;
