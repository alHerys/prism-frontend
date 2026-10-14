import type { DocumentRecord } from "../../domain/models";

export function spreadsheetReturnTo(document: DocumentRecord, origin: unknown): string {
  const path = `/pengadaan/${document.procurementId}`;
  if (typeof origin === "string" && origin.split("?")[0] === path
    && ["hea", "harga"].includes(new URLSearchParams(origin.split("?")[1]).get("tab") ?? "")) return origin;
  return `${path}?tab=ringkasan${document.vendorId ? `&vendor=${encodeURIComponent(document.vendorId)}` : ""}`;
}
