import { createModuleBinding } from "../../../shared/ui/module-binding";
import type { DocumentsUseCases } from "../application/use-cases";
import type { DocumentsData } from "../application/queries";
const binding = createModuleBinding<DocumentsUseCases, DocumentsData>("Documents");
export const DocumentsProvider = binding.Provider;
export const useDocumentsCommands = binding.useCommands;
export const useDocumentsData = binding.useData;
