import type { DocumentRecord, UploadInput } from "./models";
import { DomainError } from "../../../shared/kernel/validation";

export function ensureCurrentDocument(document: Pick<DocumentRecord, "supersededBy" | "removedAt">) {
  if (document.removedAt) {
    throw new DomainError("DOCUMENT_REMOVED", "Dokumen ini telah dihapus. Unggah dokumen baru untuk melanjutkan evaluasi.");
  }
  if (document.supersededBy) {
    throw new DomainError("DOCUMENT_REPLACED", "Dokumen ini telah diganti. Buka dokumen terbaru.");
  }
}

export function validateOwnerEstimateReplacement(
  current: Pick<DocumentRecord, "id" | "revision"> | undefined,
  replacement: UploadInput["replacement"],
) {
  if (current && !replacement) {
    throw new DomainError("OWNER_ESTIMATE_EXISTS", "Pengadaan ini sudah memiliki OE. Gunakan Ganti OE untuk memperbaruinya.");
  }
  if (replacement && (current?.id !== replacement.id || current.revision !== replacement.revision)) {
    throw new DomainError("STALE_REVISION", "OE telah berubah. Buka kembali dokumen terbaru sebelum menggantinya.");
  }
}
