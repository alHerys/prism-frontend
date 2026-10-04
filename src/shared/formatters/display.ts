export const money = (s: string | undefined) => {
  if (!s) return "—";
  const [whole, fraction] = s.split(".");
  try {
    return (
      "Rp" +
      BigInt(whole).toLocaleString("id-ID") +
      (fraction ? "," + fraction : "")
    );
  } catch {
    return s;
  }
};
export const roundedMoney = (s: string | undefined) => {
  if (!s) return "—";
  const [whole, fraction = ""] = s.split(".");
  return money(
    (BigInt(whole) + (fraction[0] && fraction[0] >= "5" ? 1n : 0n)).toString(),
  );
};
export const pct = (s: string) => {
  const [w, f = ""] = s.split(".");
  const digits = w + f.padEnd(2, "0");
  const idx = digits.length - Math.max(0, f.length - 2);
  return `${digits.slice(0, idx).replace(/^0+(?=\d)/, "") || "0"}${digits.slice(idx).replace(/0+$/, "") ? "," + digits.slice(idx).replace(/0+$/, "") : ""}%`;
};
export const date = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const dateTime = (s: string) =>
  new Date(s).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
export const kindLabel: Record<string, string> = {
  FORM_A5: "Form A5",
  OE: "Owner Estimate",
  OFFER: "Penawaran vendor",
  HISTORICAL_OE: "OE historis",
};

export const bankMoney = (value: string) =>
  `Rp ${value.split(".")[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
export const historyTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const exactMoney = (value?: string) => {
  if (value === undefined) return "—";
  const [whole, fraction] = value.split(".");
  return `Rp ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${fraction ? "," + fraction : ""}`;
};
