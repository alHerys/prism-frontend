import { pct } from "./display";
export function toPercent(s: string) {
  return pct(s).replace("%", "").replace(",", ".");
}
export function toRatio(s: string) {
  const text = s.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text))
    throw new Error("Masukkan persentase berupa angka 0 hingga 100.");
  const [w, f = ""] = text.split(".");
  const digits = w.padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}${f}`;
}
