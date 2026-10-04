import type { DocumentKind } from "../shared/model/session";

import registry from "../fixtures/file-registry.json";
export async function recognizeFile(file: File, kind: DocumentKind) {
  const extension = kind === "FORM_A5" ? ".pdf" : ".xlsx";
  if (!file.name.toLowerCase().endsWith(extension))
    throw new Error(
      `Pilih berkas ${extension.toUpperCase()} untuk jenis dokumen ini.`,
    );
  if (!file.size || file.size > 10 * 1024 * 1024)
    throw new Error("Ukuran dokumen harus lebih dari 0 dan maksimal 10 MiB.");
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
    ),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  const fixture = registry.find((f) => f.sha256 === hash && f.kind === kind);
  if (!fixture) throw new Error("Format dokumen ini belum didukung.");
  return fixture;
}
export const availableDocuments = () =>
  registry.map(({ id, name, path, kind }) => ({ id, name, path, kind }));
