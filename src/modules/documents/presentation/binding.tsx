import { createModuleBinding } from "../../../shared/ui/module-binding";
import type { DocumentsUseCases } from "../application/use-cases";
import type { DocumentsData } from "../application/queries";
const binding = createModuleBinding<DocumentsUseCases, DocumentsData>("Documents");
export const DocumentsProvider = binding.Provider;
export const useDocumentsCommands = binding.useCommands;
export const useDocumentsData = binding.useData;

import type { A5IntakeUseCases } from "../application/intake-use-cases";
import type { IntakeData } from "../domain/intake";
const intake = createModuleBinding<A5IntakeUseCases, IntakeData>("A5 intake");
export const A5IntakeProvider = intake.Provider;
export const useA5IntakeCommands = intake.useCommands;
export const useA5IntakeData = intake.useData;
