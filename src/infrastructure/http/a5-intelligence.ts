import type { A5Candidate } from "../../modules/documents/domain/intake";
import type { A5ExtractionPort } from "../../modules/documents/application/intake-ports";
import type { BinarySource } from "../../shared/kernel/binary-source";
import { DomainError } from "../../shared/kernel/validation";

const messages: Record<string, string> = {
  PROVIDER_NOT_CONFIGURED: "Layanan ekstraksi belum dikonfigurasi. API key dan model perlu disiapkan di backend.",
  PROVIDER_UNAVAILABLE: "Layanan ekstraksi sedang tidak tersedia. Coba lagi nanti.",
  INVALID_EXTRACTION: "Hasil ekstraksi tidak valid. Coba ulangi atau tambahkan vendor secara manual.",
  DOCUMENT_TOO_LARGE: "Ukuran PDF maksimal 10 MiB.",
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid response");
  return value as Record<string, unknown>;
}
export function readCandidate(data: unknown): A5Candidate {
  const root = object(data), c = object(root.candidate);
  if (typeof root.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(root.sha256)) throw new Error("Invalid source hash");
  if (c.vendor_name !== null && (typeof c.vendor_name !== "string" || c.vendor_name.length > 200)) throw new Error("Invalid identity");
  if (c.vendor_quote !== null && (typeof c.vendor_quote !== "string" || c.vendor_quote.length > 500)) throw new Error("Invalid identity evidence");
  const values = {} as A5Candidate["values"];
  const sources: A5Candidate["sources"] = [];
  for (const key of ["hpb", "hpj", "knb", "tkdn_barang", "tkdn_jasa"] as const) {
    const field = object(c[key]);
    if (field.value !== null && (typeof field.value !== "string" || !/^[0-9]{1,24}(\.[0-9]{1,12})?$/.test(field.value) || (key.startsWith("tkdn") && Number(field.value) > 1))) throw new Error("Invalid value");
    if (field.quote !== null && (typeof field.quote !== "string" || field.quote.length > 500)) throw new Error("Invalid evidence");
    if (field.page !== null && (!Number.isInteger(field.page) || Number(field.page) < 1 || Number(field.page) > 500)) throw new Error("Invalid page");
    values[key] = field.value as string | null ?? "";
    sources.push({ field: key, location: field.page ? `Halaman ${field.page}` : "Lokasi perlu diperiksa", quote: field.quote as string | null ?? "" });
  }
  if (!Array.isArray(root.warnings) || root.warnings.some(w => typeof w !== "string")) throw new Error("Invalid warnings");
  sources.push({ field: "vendor_name", location: "Identitas vendor pada Form A5", quote: c.vendor_quote as string | null ?? "" });
  return { sha256: root.sha256, vendorName: c.vendor_name as string | null ?? "", values, sources, warnings: root.warnings };
}
export function createA5Intelligence(baseUrl = "/api", request = fetch): A5ExtractionPort {
  const controllers = new Map<string, AbortController>();
  return {
    cancel: requestId => controllers.get(requestId)?.abort(),
    extract: async (file: BinarySource, requestId: string) => {
      const controller = new AbortController();
      controllers.set(requestId, controller);
      let timedOut = false;
      const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
      try {
        const bytes = await file.arrayBuffer();
        if (controller.signal.aborted) throw new Error("Cancelled");
        const response = await request(`${baseUrl.replace(/\/$/, "")}/form-a5/extractions`, {
          method: "POST", headers: { "Content-Type": "application/pdf", "X-Document-Filename": encodeURIComponent(file.name) },
          body: bytes, signal: controller.signal,
        });
        if (!response.ok) {
          const error = object(await response.json().catch(() => ({})));
          const code = error.error ? object(error.error).code : "";
          throw new DomainError("EXTRACTION_FAILED", messages[String(code)] ?? "PDF belum dapat dibaca. Periksa berkas lalu coba lagi.");
        }
        const raw: unknown = await response.json().catch(() => { throw new DomainError("INVALID_EXTRACTION", "Hasil ekstraksi tidak valid. Coba lagi."); });
        try { return readCandidate(raw); }
        catch { throw new DomainError("INVALID_EXTRACTION", "Hasil ekstraksi tidak valid. Coba lagi atau gunakan tambah vendor manual."); }
      } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("EXTRACTION_FAILED", timedOut ? "Pembacaan PDF melewati batas waktu. Coba lagi." : "Ekstraksi belum berhasil. Pastikan backend aktif lalu coba lagi.");
      } finally { clearTimeout(timeout); controllers.delete(requestId); }
    },
  };
}
