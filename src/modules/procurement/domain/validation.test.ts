// @vitest-environment node
import { expect, it } from "vitest";
import { validateProcurement, validateVendor } from "./validation";
it("checks required fields before duplicates and compares vendor names without changing the input", () => {
  const input = { name: "", number: "T-1", functionName: "" };
  expect(() => validateProcurement(input, ["T-1"])).toThrow("Nama pengadaan wajib diisi.");
  expect(() => validateProcurement({ ...input, name: "Test", functionName: "Maintenance" }, ["T-1"])).toThrow("Nomor pengadaan sudah digunakan.");
  expect(() => validateVendor("  Vendor  ", ["vendor"])).toThrow("Vendor sudah terdaftar.");
  expect(() => validateVendor("Other", ["vendor"])).not.toThrow();
});
