import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import JSZip from "jszip";
import { expect, it } from "vitest";
import { parseOfferSpreadsheet } from "./offer-parser";
import { spreadsheetIssues } from "../../modules/documents/domain/spreadsheet";
import fixture from "../local/fixtures/offer-review.json";
const bytes = () => new Uint8Array(readFileSync("public/files/Penawaran-Nusa.xlsx")).buffer;

it("preserves source styles, blank separators, numbering and totals while excluding signatures", async () => {
  const [table] = await parseOfferSpreadsheet(bytes());
  expect(table).toEqual(fixture["bid-nusa"]);
  expect(table.headerBackground).toBe("#99dff3");
  expect(table.rows).toHaveLength(17);
  expect(table.rows.find(r => r.sourceRow === 19)?.kind).toBe("EMPTY");
  expect(table.rows.find(r => r.sourceRow === 11)?.appearance).toMatchObject({ background: "#d1d1d1", underline: true });
  expect(table.rows.find(r => r.sourceRow === 20)?.appearance?.background).toBe("#ffff00");
  expect(table.rows.find(r => r.sourceRow === 15)?.numberSource).toEqual({ cell: "B15", position: "CHILD" });
  expect(table.rows.find(r => r.sourceRow === 14)?.bullet).toEqual({ cell: "B14", value: "-" });
  expect(table.rows.find(r => r.sourceRow === 23)?.services).toMatchObject({ state: "VALUE", value: "0", format: { zeroAsDash: true, decimalPlaces: 0 } });
  expect(table.rows.find(r => r.sourceRow === 26)?.scope).toBe("COMBINED");
  expect(table.rows.at(-1)?.sourceRow).toBe(27);
  expect(spreadsheetIssues(table)).toEqual([]);
});

it("keeps exact decimals, formula-empty and unavailable caches distinct", async () => {
  const zip = await JSZip.loadAsync(bytes());
  let xml = await zip.file("xl/worksheets/sheet2.xml")!.async("string");
  const replace = (address: string, content: string) => { xml = xml.replace(new RegExp(`<x:c\\b[^>]*r="${address}"[^>]*>[\\s\\S]*?<\\/x:c>`), content); };
  replace("P13", '<x:c r="P13"><x:v>1234567890123456.123456789</x:v></x:c>');
  replace("Q12", '<x:c r="Q12" t="str"><x:f>IF(A1="","",A1)</x:f><x:v></x:v></x:c>');
  replace("Q16", '<x:c r="Q16"><x:f>SUM(A1:A2)</x:f></x:c>');
  zip.file("xl/worksheets/sheet2.xml", xml);
  const [table] = await parseOfferSpreadsheet(await zip.generateAsync({ type: "arraybuffer" }));
  expect(table.rows.find(r => r.sourceRow === 13)?.material.value).toBe("1234567890123456.123456789");
  expect(table.rows.find(r => r.sourceRow === 12)?.services.state).toBe("BLANK");
  expect(table.rows.find(r => r.sourceRow === 16)?.services.state).toBe("UNAVAILABLE");
});

it("offers multiple actual detail sheets and rejects corrupt input without a demo fallback", async () => {
  const zip = await JSZip.loadAsync(bytes());
  const wb = await zip.file("xl/workbook.xml")!.async("string");
  const rel = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  zip.file("xl/workbook.xml", wb.replace('</x:sheets>', '<x:sheet name="Pilihan kedua" sheetId="3" r:id="rIdExtra" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></x:sheets>'));
  zip.file("xl/_rels/workbook.xml.rels", rel.replace('</Relationships>', '<Relationship Id="rIdExtra" Target="worksheets/sheet3.xml"/></Relationships>'));
  zip.file("xl/worksheets/sheet3.xml", await zip.file("xl/worksheets/sheet2.xml")!.async("string"));
  expect(await parseOfferSpreadsheet(await zip.generateAsync({ type: "arraybuffer" }))).toHaveLength(2);
  await expect(parseOfferSpreadsheet(new Uint8Array([1, 2]).buffer)).rejects.toThrow("XLSX");
  for (const path of ["xl/worksheets/sheet2.xml", "xl/worksheets/sheet3.xml"]) {
    zip.file(path, (await zip.file(path)!.async("string")).replace('<x:v>NO.</x:v>', '<x:v>KODE</x:v>'));
  }
  await expect(parseOfferSpreadsheet(await zip.generateAsync({ type: "arraybuffer" }))).rejects.toThrow("Tabel detail penawaran");
});

if (process.env.PRISM_OFFER_REFERENCE) it("locally verifies reference layout and source integrity without copying contents", async () => {
  const path = process.env.PRISM_OFFER_REFERENCE!;
  const before = readFileSync(path);
  const hash = createHash("sha256").update(before).digest("hex");
  const [table] = await parseOfferSpreadsheet(new Uint8Array(before).buffer);
  expect(table.name).toBe("BOQ Nego");
  expect(table.headerBackground).toBe("#96dcf8");
  expect(table.rows.find(r => r.sourceRow === 35)?.appearance?.background).toBe("#c2f1c8");
  expect(table.rows[0].sourceRow).toBe(11);
  expect(table.rows.at(-1)?.sourceRow).toBe(235);
  expect(table.rows).toHaveLength(225);
  expect(table.rows.find(r => r.sourceRow === 36)?.numberSource?.position).toBe("CHILD");
  expect(table.rows.find(r => r.sourceRow === 33)?.appearance?.background).toBe("#ffff00");
  expect(table.rows.find(r => r.sourceRow === 231)?.scope).toBe("COMBINED");
  expect(createHash("sha256").update(readFileSync(path)).digest("hex")).toBe(hash);
});
