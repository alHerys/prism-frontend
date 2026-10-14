import JSZip from "jszip";

const MAX_XML_BYTES = 50 * 1024 * 1024;
export const elements = (node: Document | Element, name: string) => [...node.getElementsByTagNameNS("*", name)];
export const child = (node: Element, name: string) => [...node.children].find(element => element.localName === name);

export async function openOOXML(bytes: ArrayBuffer) {
  const zip = await JSZip.loadAsync(bytes);
  if (Object.keys(zip.files).length > 2000) throw new Error("Workbook memiliki terlalu banyak bagian.");
  let expanded = 0;
  const read = async (path: string, optional = false): Promise<Document | undefined> => {
    const entry = zip.file(path);
    if (!entry) {
      if (optional) return undefined;
      throw new Error("Struktur XLSX tidak lengkap.");
    }
    const data = await new Promise<Uint8Array>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let length = 0;
      // Public JSZip API omitted from its bundled ZipObject declaration:
      // https://stuk.github.io/jszip/documentation/api_zipobject/internal_stream.html
      const streamingEntry = entry as JSZip.JSZipObject & { internalStream(type: "uint8array"): JSZip.JSZipStreamHelper<Uint8Array> };
      const stream = streamingEntry.internalStream("uint8array");
      stream.on("data", chunk => {
        length += chunk.length; expanded += chunk.length;
        if (expanded > MAX_XML_BYTES) { stream.pause(); reject(new Error("Isi workbook melebihi kapasitas pembacaan 50 MiB.")); return; }
        chunks.push(chunk);
      }).on("error", reject).on("end", () => {
        const result = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
        resolve(result);
      }).resume();
    });
    const text = new TextDecoder().decode(data);
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("Deklarasi eksternal XML tidak didukung.");
    const parsed = new DOMParser().parseFromString(text, "application/xml");
    if (elements(parsed, "parsererror").length) throw new Error("Isi XML workbook tidak valid.");
    return parsed;
  };
  return { read };
}

export function columnNumber(address: string): number {
  let result = 0;
  for (const letter of address.replace(/[^A-Z]/g, "")) result = result * 26 + letter.charCodeAt(0) - 64;
  return result;
}
export function columnName(column: number): string {
  let result = "";
  while (column > 0) { column--; result = String.fromCharCode(65 + column % 26) + result; column = Math.floor(column / 26); }
  return result;
}

/** Expand XML numeric lexemes exactly; exponent arithmetic is positional only. */
export function decimalLexeme(raw: string): string | undefined {
  const match = /^\+?(\d+)(?:\.(\d*))?(?:[Ee]([+-]?\d+))?$/.exec(raw);
  if (!match || raw.length > 100) return undefined;
  const exponent = Number(match[3] ?? 0);
  if (!Number.isInteger(exponent) || Math.abs(exponent) > 80) return undefined;
  const digits = match[1] + (match[2] ?? "");
  const point = match[1].length + exponent;
  const value = point <= 0 ? `0.${"0".repeat(-point)}${digits}`
    : point >= digits.length ? digits + "0".repeat(point - digits.length) : `${digits.slice(0, point)}.${digits.slice(point)}`;
  return value.length <= 80 ? value.replace(/^0+(?=\d)/, "") : undefined;
}

export interface XMLCell { address: string; column: number; text: string; raw?: string; formula?: string; type: string; cached: boolean; bold: boolean; category: boolean; }
export function readCells(xml: Document, shared: string[], styles?: Document) {
  const fonts = styles ? elements(styles, "fonts")[0]?.children : undefined;
  const fills = styles ? elements(styles, "fills")[0]?.children : undefined;
  const formats = styles ? elements(styles, "cellXfs")[0]?.children : undefined;
  const rows = new Map<number, XMLCell[]>();
  let cellCount = 0;
  for (const node of elements(xml, "row")) {
    const rowNumber = Number(node.getAttribute("r"));
    if (!Number.isInteger(rowNumber) || rowNumber < 1 || rowNumber > 10000 || rows.has(rowNumber)) throw new Error("Workbook mendukung maksimal 10.000 baris unik.");
    const cells = [...node.children].filter(c => c.localName === "c").map(c => {
      const address = c.getAttribute("r") ?? "";
      if (++cellCount > 200000 || !/^[A-Z]{1,3}[1-9]\d{0,4}$/.test(address) || columnNumber(address) > 16384 || Number(address.replace(/\D/g, "")) !== rowNumber)
        throw new Error("Struktur sel XLSX tidak valid atau melebihi kapasitas pembacaan.");
      const type = c.getAttribute("t") ?? "n";
      const value = child(c, "v");
      const raw = value?.textContent ?? undefined;
      const formula = child(c, "f")?.textContent ?? undefined;
      const style = formats?.[Number(c.getAttribute("s") ?? 0)];
      const font = fonts?.[Number(style?.getAttribute("fontId") ?? 0)];
      const fill = fills?.[Number(style?.getAttribute("fillId") ?? 0)];
      const solid = fill && elements(fill, "patternFill")[0]?.getAttribute("patternType") === "solid";
      const theme = fill && elements(fill, "fgColor")[0]?.getAttribute("theme");
      let text = type === "s" ? shared[Number(raw)] ?? "" : type === "inlineStr" ? elements(c, "t").map(t => t.textContent ?? "").join("") : raw ?? "";
      if (type === "n" && [9, 10].includes(Number(style?.getAttribute("numFmtId"))) && raw) {
        const canonical = decimalLexeme(raw);
        if (canonical) {
          const [whole, fraction = ""] = canonical.split(".");
          text = `${(whole + fraction.padEnd(2, "0").slice(0, 2)).replace(/^0+(?=\d)/, "")}${fraction.slice(2) ? "," + fraction.slice(2) : ""}%`;
        }
      }
      return { address, column: columnNumber(address), type, raw, text, formula, cached: !!value,
        bold: !!font && !!child(font, "b"), category: !!solid && theme === "6" };
    });
    rows.set(rowNumber, cells);
  }
  return new Map([...rows].sort(([a], [b]) => a - b));
}
