export function percentInput(value: string) {
  const [w, f = ""] = value.split(".");
  const padded = f.padEnd(2, "0");
  const whole = (w + padded.slice(0, 2)).replace(/^0+(?=\d)/, "");
  const rest = padded.slice(2).replace(/0+$/, "");
  return (whole || "0") + (rest ? "." + rest : "");
}
export function ratioInput(value: string) {
  const v = value.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(v))
    throw new Error("Isi persentase dengan angka 0 hingga 100.");
  const [w, f = ""] = v.split(".");
  const digits = w.padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}${f}`;
}
