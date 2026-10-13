import { vendorNameKey } from "../../../shared/kernel/vendor-name";
import { DomainError, requireText } from "../../../shared/kernel/validation";

export function validateProcurement(input: { name: string; number: string; functionName: string }, existingNumbers: readonly string[]) {
  requireText(input.name, "Nama pengadaan");
  requireText(input.number, "Nomor pengadaan");
  requireText(input.functionName, "Fungsi");
  if (existingNumbers.includes(input.number.trim()))
    throw new DomainError("DUPLICATE", "Nomor pengadaan sudah digunakan.");
}
export function validateVendor(name: string, existingNames: readonly string[]) {
  requireText(name, "Nama vendor");
  if (existingNames.some((existing) => vendorNameKey(existing) === vendorNameKey(name)))
    throw new DomainError("DUPLICATE", "Vendor sudah terdaftar.");
}
