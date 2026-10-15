export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
export const copy = <T>(value: T): T => structuredClone(value);
export const normalize = (s: string) =>
  s
    .trim()
    .replace(/^\./, "0.")
    .replace(/^0+(?=\d)/, "")
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
export const equalValues = (a: object, b: object) => {
  const values = a as Record<string, string>;
  return Object.entries(b).every(
    ([key, value]) => normalize(values[key] ?? "") === normalize(value),
  );
};
export const requireText = (text: string, label: string) => {
  if (!text.trim()) throw new DomainError("REQUIRED", `${label} wajib diisi.`);
};
export const decimal = (text: string, ratio = false) => {
  if (
    typeof text !== "string" || text.length > 80 ||
    !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(text.trim()) ||
    (ratio && !/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(normalize(text)))
  )
    throw new DomainError(
      "INVALID_VALUE",
      ratio
        ? "Persentase harus berupa rasio 0 hingga 1."
        : "Nilai harus berupa angka desimal non-negatif.",
    );
};
