import type { DocumentRecord } from "../domain/models";
import { useDocumentsCommands } from "./binding";
import { useSpreadsheetImport } from "./useSpreadsheetImport";
export function useOwnerEstimateImport(procurementId: string, current?: DocumentRecord) {
  const commands = useDocumentsCommands();
  return useSpreadsheetImport({ prepare: commands.prepareOwnerEstimate, release: commands.releaseOwnerEstimate,
    publish: (pendingId, sheetId) => commands.publishOwnerEstimate({ pendingId, sheetId, procurementId, replacement: current ? { id: current.id, revision: current.revision } : undefined }),
    successMessage: commands.reviewWorkflow === "SAVE_CONFIRMS" ? "Tabel OE selesai dibaca. Periksa lalu simpan data." : "Tabel OE selesai dibaca. Periksa data sebelum konfirmasi.",
  });
}
