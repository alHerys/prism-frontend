import type { DocumentKind } from "../shared/model/session";

import { recognizeFile } from "./registry";

// Offline demo: the registered file selects prepared candidates. These stages
// simulate processing latency; no parser, AI provider, or network call runs.
export async function processDemoDocument(
  file: File,
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
