import type { BinarySource } from "../../shared/kernel/binary-source";
import type { IntakeAssets } from "../../modules/documents/application/intake-ports";
import type { IntakeSource } from "../../modules/documents/domain/intake";

export function createIntakeAssets(): IntakeAssets & { sources(): IntakeSource[] } {
  let sequence = 0;
  const sources = new Map<string, { metadata: IntakeSource; file: BinarySource }>();
  return {
    prepare: async file => {
      if (!file.name.toLowerCase().endsWith(".pdf") || file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error("Pilih PDF Form A5 dengan ukuran maksimal 10 MiB.");
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength !== file.size || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("Berkas bukan PDF yang valid.");
      const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(b => b.toString(16).padStart(2, "0")).join("");
      const id = `import-source-${++sequence}`;
      const metadata = { id, name: file.name, sha256: hash, path: URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })) };
      sources.set(id, { metadata, file: { name: file.name, size: bytes.byteLength, arrayBuffer: async () => bytes } });
      return metadata;
    },
    file: id => { const source = sources.get(id); if (!source) throw new Error("PDF sesi tidak ditemukan. Unggah kembali."); return source.file; },
    sources: () => [...sources.values()].map(source => ({ ...source.metadata })),
    release: id => { const source = sources.get(id); if (source) { URL.revokeObjectURL(source.metadata.path); sources.delete(id); } },
  };
}
