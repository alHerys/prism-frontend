import type { BinarySource } from "../../shared/kernel/binary-source";
import type { DocumentKind } from "../../modules/documents/domain/models";
import type { A5ExtractionPort } from "../../modules/documents/application/intake-ports";
import type { PertaminaCatalog } from "./catalog";
import { copy } from "../../shared/kernel/validation";

export async function recognizeSource(catalog: PertaminaCatalog, file: BinarySource, kind: DocumentKind) {
  const extension = kind === "FORM_A5" ? ".pdf" : ".xlsx";
  if (!file.name.toLowerCase().endsWith(extension) || !file.size || file.size > 10 * 1024 * 1024) throw new Error(`Pilih ${extension.toUpperCase()} berukuran maksimal 10 MiB.`);
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength !== file.size) throw new Error("Ukuran sumber tidak sesuai.");
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join("");
  const source = catalog.sources.find(s => s.sha256 === hash && s.kind === kind);
  if (!source) throw new Error("Format dokumen ini belum didukung.");
  return { source, file: { name: file.name, size: bytes.byteLength, arrayBuffer: async () => bytes } };
}

export function createPreparedA5Extraction(catalog: PertaminaCatalog): A5ExtractionPort {
  const requests = new Map<string, { cancelled: boolean }>();
  return {
    async extract(file, requestId) {
      const request = { cancelled: false }; requests.set(requestId, request);
      try {
        const { source } = await recognizeSource(catalog, file, "FORM_A5");
        const entry = catalog.a5.find(a5 => a5.sourceId === source.id);
        if (!entry || request.cancelled) throw new Error("Pembacaan dokumen dibatalkan.");
        return copy(entry.candidate);
      } finally { requests.delete(requestId); }
    },
    cancel: id => { const request = requests.get(id); if (request) request.cancelled = true; },
  };
}
