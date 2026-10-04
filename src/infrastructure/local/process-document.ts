import type { BinarySource } from "../../shared/kernel/binary-source";
import type { DocumentKind } from "../../modules/documents/domain/models";

import { recognizeFile } from "./file-registry";

// Local adapter: the registered file selects prepared candidates. These stages
// simulate processing latency; no parser, AI provider, or network call runs.
export async function processLocalDocument(
  file: BinarySource,
  kind: DocumentKind,
  onProgress: (label: string) => void,
) {
  onProgress("Memeriksa berkas");
  const fixture = await recognizeFile(file, kind);
  for (const label of ["Membaca isi dokumen", "Menyiapkan kandidat data", "Menyiapkan pemeriksaan"]) {
    onProgress(label);
    await new Promise<void>((resolve) => setTimeout(resolve, 450));
  }
  return fixture;
}
