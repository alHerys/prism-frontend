import type { OEAmount, OERow, OESheet } from "../../modules/documents/domain/owner-estimate";
import { columnName, columnNumber, decimalLexeme, elements, openOOXML, readCells } from "./ooxml";
import type { XMLCell } from "./ooxml";

interface Layout { headerRow: number; firstRow: number; no: number; descriptionEnd: number; material: number; services: number; }
const label = (text: string) => text.trim().toUpperCase().replace(/[.\s]+/g, " ");

function findLayouts(rows: Map<number, XMLCell[]>, merges: string[]): Layout[] {
  const layouts: Layout[] = [];
  for (const [row, cells] of rows) {
    const no = cells.find(c => /^NO\s*$/.test(label(c.text)));
    const description = cells.find(c => label(c.text) === "URAIAN PEKERJAAN");
    const amount = cells.find(c => label(c.text) === "JUMLAH HARGA");
    if (!no || !description || !amount) continue;
    // A detail table includes the source's Volume / Harga Satuan groups.
    if (!cells.some(c => /VOLUME|HARGA SATUAN/.test(label(c.text)))) continue;
    const group = merges.find(range => range.split(":")[0] === amount.address);
    const right = group ? columnNumber(group.split(":")[1]) : amount.column + 1;
    const headers = [row + 1, row + 2].flatMap(r => rows.get(r) ?? []).filter(c => c.column >= amount.column && c.column <= right);
    const material = headers.find(c => /^(MATERIAL|BARANG)$/.test(label(c.text)));
    const services = headers.find(c => label(c.text) === "JASA");
    if (!material || !services) continue;
    const descriptionMerge = merges.find(range => range.split(":")[0] === description.address);
    const end = descriptionMerge ? columnNumber(descriptionMerge.split(":")[1]) : Math.min(...cells.filter(c => c.column > description.column).map(c => c.column)) - 1;
    const headerEnd = Math.max(row + 1, ...merges.filter(range => range.startsWith(no.address + ":") || range.startsWith(description.address + ":") || range.startsWith(material.address + ":")).map(range => Number(range.split(":")[1].replace(/\D/g, ""))));
    layouts.push({ headerRow: row, firstRow: headerEnd + 1, no: no.column, descriptionEnd: end, material: material.column, services: services.column });
  }
  return layouts;
}

function amount(cell: XMLCell | undefined, address: string): OEAmount {
  const source = { cell: address, ...(cell?.formula !== undefined ? { formula: cell.formula } : {}) };
  if (!cell) return { ...source, state: "BLANK", value: null };
  if (cell.formula !== undefined && (!cell.cached || (cell.type !== "str" && !cell.raw))) return { ...source, state: "UNAVAILABLE", value: null };
  if (!cell.text.trim()) return { ...source, state: "BLANK", value: null };
  const value = cell.type === "n" || cell.type === "str" ? decimalLexeme(cell.raw ?? cell.text) : undefined;
  return { ...source, state: value === undefined ? "UNAVAILABLE" : "VALUE", value: value ?? null };
}

function parseRows(name: string, source: Map<number, XMLCell[]>, layout: Layout, lastRow = Infinity): OERow[] {
  const result: OERow[] = [];
  const stack: OERow[] = [];
  let alphabet = false;
  let numbered: OERow | undefined;
  let roman: OERow | undefined;
  let hasTotal = false;
  const descriptive = new Map<number, OERow>();
  for (const [r, cells] of source) {
    if (r < layout.firstRow || r > lastRow) continue;
    const texts = cells.filter(c => c.column >= layout.no && c.column <= layout.descriptionEnd && (c.text.trim() || c.formula !== undefined));
    const numbering = texts.find(c => c.column <= layout.no + 1 && /^(?:[IVX]+|[A-Z]|\d+(?:\.\d+)+)$/.test(c.text.trim()));
    const descriptions = texts.filter(c => c !== numbering && c.text.trim() !== "-");
    let missingDescription = descriptions.some(c => c.type === "e" || (c.formula !== undefined && !c.cached));
    const descriptionCells = descriptions.map(c => c.address);
    let description = descriptions.map(c => c.text.trim()).filter(Boolean).join(" ");
    if (!description && !missingDescription && !numbering) continue;
    const number = numbering?.text.trim() ?? "";
    const heading = descriptions[0];
    const material = amount(cells.find(c => c.column === layout.material), `${columnName(layout.material)}${r}`);
    const services = amount(cells.find(c => c.column === layout.services), `${columnName(layout.services)}${r}`);
    const isRoman = /^[IVX]+$/.test(number);
    const isAlphabet = /^[A-Z]$/.test(number) && !isRoman;
    const subtotal = /^SUBTOTAL\b/i.test(description);
    const total = /^(TOTAL\b|PEMBULATAN\b|KEUNTUNGAN\b)/i.test(description);
    const note = !total && (/^(TERBILANG\b|DIBUAT\b|DIPERIKSA\b)/i.test(description) || (!number && hasTotal));
    if (total) hasTotal = true;
    if (/^TERBILANG\b/i.test(description)) {
      const words = cells.find(c => c.column === layout.services);
      if (words?.text) description += " " + words.text;
      if (words && (words.text || words.formula !== undefined)) descriptionCells.push(words.address);
      if (words?.type === "e" || (words?.formula !== undefined && !words.cached)) missingDescription = true;
    }
    let level: number;
    if (isRoman || total || note) { level = 0; alphabet = false; }
    else if (isAlphabet) { level = 1; alphabet = true; }
    else if (subtotal) level = (roman?.level ?? -1) + 1;
    else if (number) level = Math.max(1, number.split(".").length - 1) + (alphabet ? 1 : 0);
    else {
      const column = heading?.column ?? layout.no + 1;
      const previous = [...descriptive].filter(([key]) => key < column).at(-1)?.[1];
      level = previous ? previous.level + 1 : (numbered?.level ?? 0) + 1;
    }
    while (stack.length && stack.at(-1)!.level >= level) stack.pop();
    const parent = subtotal ? roman : stack.at(-1);
    const kind = subtotal ? "SUBTOTAL" : total ? "TOTAL" : note ? "NOTE" : isRoman || isAlphabet || heading?.category ? "CATEGORY" : number ? "ITEM" : "NOTE";
    const scope = note ? "NONE" : total && material.state === "BLANK" ? "COMBINED" : "SPLIT";
    const row: OERow = { id: `${name}:r${r}`, sourceRow: r, ...(parent && !total && !note ? { parentId: parent.id } : {}), level,
      number, description, descriptionCells, descriptionUnavailable: missingDescription,
      kind, scope, material, services, ...(scope === "COMBINED" ? { combined: services } : {}) };
    result.push(row);
    if (isRoman) roman = row;
    if (numbering) { numbered = row; descriptive.clear(); }
    else if (!subtotal && !total && !note) {
      const column = heading?.column ?? layout.no + 1;
      for (const key of descriptive.keys()) if (key >= column) descriptive.delete(key);
      descriptive.set(column, row);
    }
    if (!subtotal) stack.push(row);
  }
  return result;
}

export async function parseOwnerEstimate(bytes: ArrayBuffer): Promise<OESheet[]> {
  try {
    const archive = await openOOXML(bytes);
    const workbook = (await archive.read("xl/workbook.xml"))!;
    const relations = (await archive.read("xl/_rels/workbook.xml.rels"))!;
    const strings = await archive.read("xl/sharedStrings.xml", true);
    const styles = await archive.read("xl/styles.xml", true);
    const shared = strings ? elements(strings, "si").map(si => elements(si, "t").map(t => t.textContent ?? "").join("")) : [];
    const sheets: OESheet[] = [];
    for (const sheet of elements(workbook, "sheet")) {
      if (sheet.getAttribute("state") === "hidden" || sheet.getAttribute("state") === "veryHidden") continue;
      const id = sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
      const relation = elements(relations, "Relationship").find(r => r.getAttribute("Id") === id);
      const target = relation?.getAttribute("Target") ?? "";
      const path = target.startsWith("/xl/") ? target.slice(1) : `xl/${target}`;
      if (!/^xl\/worksheets\/[\w.-]+\.xml$/.test(path) || relation?.getAttribute("TargetMode") === "External") continue;
      const xml = (await archive.read(path))!;
      const rows = readCells(xml, shared, styles);
      const layouts = findLayouts(rows, elements(xml, "mergeCell").map(c => c.getAttribute("ref") ?? ""));
      const name = sheet.getAttribute("name") ?? "OE";
      const external = [...rows.values()].flat().some(c => c.formula?.includes("["));
      layouts.forEach((layout, index) => {
        const parsed = parseRows(name, rows, layout, (layouts[index + 1]?.headerRow ?? Infinity) - 1);
        if (!parsed.length) return;
        const identity = layouts.length > 1 ? { id: `${name}:table${layout.headerRow}`, name: `${name} · baris ${layout.headerRow}`, sourceSheet: name } : { id: name, name };
        sheets.push({ ...identity, rows: parsed, warnings: external ? ["Workbook memakai tautan eksternal. Periksa nilai tersimpan terhadap sumber sebelum mengonfirmasi."] : [] });
      });
    }
    if (!sheets.length) throw new Error("Tabel detail OE belum dikenali. Gunakan struktur No., Uraian Pekerjaan, Volume, Harga Satuan dan Jumlah Harga Material/Jasa seperti referensi.");
    return sheets;
  } catch (error) {
    if (error instanceof Error && /Workbook|workbook|XLSX|XML|OE/.test(error.message)) throw error;
    throw new Error("Berkas XLSX tidak dapat dibaca. Periksa berkas dan unggah kembali.");
  }
}
