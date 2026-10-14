import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import JSZip from "jszip";
import { parseOwnerEstimate } from "./parser";
import { decimalLexeme } from "./ooxml";
import fixture from "../local/fixtures/oe-review.json";

const file = () => new Uint8Array(readFileSync("public/files/OE-Terminal.xlsx")).buffer;

it("reads the synthetic detail sheet without changing legacy unit-price cells", async () => {
  const sheets = await parseOwnerEstimate(file());
  expect(sheets).toHaveLength(1);
  expect(sheets[0]).toEqual(fixture);
  const rows = sheets[0].rows;
  expect(rows.filter(row => row.number === "1.1")).toHaveLength(2);
  expect(rows.find(row => row.sourceRow === 15)?.parentId).toBe("Rincian OE:r14");
  expect(rows.find(row => row.sourceRow === 13)?.material.state).toBe("BLANK");
  expect(rows.find(row => row.sourceRow === 21)?.services.value).toBe("0");
  expect(rows.find(row => row.sourceRow === 24)?.scope).toBe("COMBINED");
  expect(rows.find(row => row.sourceRow === 14)?.numberSource).toEqual({ cell: "A14", position: "NO" });
  expect(rows.find(row => row.sourceRow === 15)?.bullet).toEqual({ cell: "B15", value: "-" });
});

it("preserves numbering and bullets by source column rather than numeric depth", async () => {
  const zip = await JSZip.loadAsync(file());
  const xml = new DOMParser().parseFromString(await zip.file("xl/worksheets/sheet2.xml")!.async("string"), "application/xml");
  const cells = [...xml.getElementsByTagNameNS("*", "c")];
  function text(address: string, value: string) {
    const cell = cells.find(cell => cell.getAttribute("r") === address)!;
    cell.setAttribute("t", "inlineStr");
    cell.innerHTML = `<x:is><x:t>${value}</x:t></x:is>`;
  }
  text("A13", "2.1.3.1");
  text("A20", "A");
  text("B15", "1.2.1");
  text("B17", "2.1.3.1");
  zip.file("xl/worksheets/sheet2.xml", new XMLSerializer().serializeToString(xml));
  const [sheet] = await parseOwnerEstimate(await zip.generateAsync({ type: "arraybuffer" }));
  for (const [sourceRow, number, position, cell] of [[13, "2.1.3.1", "NO", "A13"], [20, "A", "NO", "A20"], [15, "1.2.1", "CHILD", "B15"], [17, "2.1.3.1", "CHILD", "B17"]] as const) {
    expect(sheet.rows.find(row => row.sourceRow === sourceRow)).toMatchObject({ number, numberSource: { position, cell } });
  }
  expect(sheet.rows.find(row => row.sourceRow === 15)?.description).toBe(fixture.rows[3].description);
  text("B15", "");
  zip.file("xl/worksheets/sheet2.xml", new XMLSerializer().serializeToString(xml));
  const [unmarked] = await parseOwnerEstimate(await zip.generateAsync({ type: "arraybuffer" }));
  expect(unmarked.rows.find(row => row.sourceRow === 15)?.bullet).toBeUndefined();
  expect(unmarked.rows.find(row => row.sourceRow === 15)?.number).toBe("");
});

it("keeps cached blanks, unavailable formulas, exact decimals and renamed sheets distinct", async () => {
  const zip = await JSZip.loadAsync(file());
  let xml = await zip.file("xl/worksheets/sheet2.xml")!.async("string");
  xml = xml.replace(/<x:c\b[^>]*r="P14"[^>]*>[\s\S]*?<\/x:c>/, '<x:c r="P14"><x:f t="shared" si="1"/></x:c>');
  xml = xml.replace(/<x:c\b[^>]*r="Q13"[^>]*>[\s\S]*?<\/x:c>/, '<x:c r="Q13" t="str"><x:f>IF(A1="","",A1)</x:f><x:v></x:v></x:c>');
  xml = xml.replace(/<x:c\b[^>]*r="P18"[^>]*>[\s\S]*?<\/x:c>/, '<x:c r="P18"><x:v>1234567890123456.123456789</x:v></x:c>');
  zip.file("xl/worksheets/sheet2.xml", xml);
  const wb = await zip.file("xl/workbook.xml")!.async("string");
  zip.file("xl/workbook.xml", wb.replace('name="Rincian OE"', 'name="Detail pengadaan"'));
  const [sheet] = await parseOwnerEstimate(await zip.generateAsync({ type: "arraybuffer" }));
  expect(sheet.name).toBe("Detail pengadaan");
  expect(sheet.rows.find(row => row.sourceRow === 14)?.material.state).toBe("UNAVAILABLE");
  expect(sheet.rows.find(row => row.sourceRow === 13)?.services.state).toBe("BLANK");
  expect(sheet.rows.find(row => row.sourceRow === 18)?.material.value).toBe("1234567890123456.123456789");
});

it("exposes multiple detail sheets for explicit selection and rejects malformed workbooks", async () => {
  const zip = await JSZip.loadAsync(file());
  const wb = await zip.file("xl/workbook.xml")!.async("string");
  const relationships = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  zip.file("xl/workbook.xml", wb.replace('</x:sheets>', '<x:sheet name="Pilihan kedua" sheetId="3" r:id="rIdExtra" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></x:sheets>'));
  zip.file("xl/_rels/workbook.xml.rels", relationships.replace('</Relationships>', '<Relationship Id="rIdExtra" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/></Relationships>'));
  zip.file("xl/worksheets/sheet3.xml", await zip.file("xl/worksheets/sheet2.xml")!.async("string"));
  expect(await parseOwnerEstimate(await zip.generateAsync({ type: "arraybuffer" }))).toHaveLength(2);
  await expect(parseOwnerEstimate(new Uint8Array([1, 2, 3]).buffer)).rejects.toThrow("XLSX");
  zip.file("xl/worksheets/sheet2.xml", '<!DOCTYPE test [<!ENTITY data SYSTEM "file:///private">]><worksheet/>');
  await expect(parseOwnerEstimate(await zip.generateAsync({ type: "arraybuffer" }))).rejects.toThrow("XML");
});

it("expands numeric lexemes as exact strings without floating point", () => {
  expect(decimalLexeme("1.234567890123456789E+4")).toBe("12345.67890123456789");
  expect(decimalLexeme("1.2345E-5")).toBe("0.000012345");
  expect(decimalLexeme("-100")).toBeUndefined();
  expect(decimalLexeme("1E100000")).toBeUndefined();
});

it("bounds XML decompression and workbook row counts", async () => {
  const zip = await JSZip.loadAsync(file());
  zip.file("xl/workbook.xml", " ".repeat(51 * 1024 * 1024));
  await expect(parseOwnerEstimate(await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" }))).rejects.toThrow("50 MiB");
  const rows = await JSZip.loadAsync(file());
  const xml = await rows.file("xl/worksheets/sheet2.xml")!.async("string");
  rows.file("xl/worksheets/sheet2.xml", xml.replace('<x:row r="12"', '<x:row r="10001"'));
  await expect(parseOwnerEstimate(await rows.generateAsync({ type: "arraybuffer" }))).rejects.toThrow("10.000");
});

it("detects separate detail tables in the same sheet, including headers below row 40", async () => {
  const zip = await JSZip.loadAsync(file());
  const xml = new DOMParser().parseFromString(await zip.file("xl/worksheets/sheet2.xml")!.async("string"), "application/xml");
  const data = xml.getElementsByTagNameNS("*", "sheetData")[0];
  for (const original of [...data.children]) {
    if (Number(original.getAttribute("r")) < 9) continue;
    const row = original.cloneNode(true) as Element;
    row.setAttribute("r", String(Number(row.getAttribute("r")) + 70));
    for (const cell of [...row.children]) cell.setAttribute("r", cell.getAttribute("r")!.replace(/\d+/, n => String(Number(n) + 70)));
    data.appendChild(row);
  }
  const merges = xml.getElementsByTagNameNS("*", "mergeCells")[0];
  for (const original of [...merges.children]) {
    const merge = original.cloneNode(true) as Element;
    merge.setAttribute("ref", merge.getAttribute("ref")!.replace(/\d+/g, n => String(Number(n) + 70)));
    merges.appendChild(merge);
  }
  zip.file("xl/worksheets/sheet2.xml", new XMLSerializer().serializeToString(xml));
  const sheets = await parseOwnerEstimate(await zip.generateAsync({ type: "arraybuffer" }));
  expect(sheets.map(sheet => sheet.id)).toEqual(["Rincian OE:table9", "Rincian OE:table79"]);
  expect(sheets[0].rows).toHaveLength(14);
  expect(sheets[1].rows).toHaveLength(14);
  expect(sheets[1].rows[2].id).toBe("Rincian OE:r84");
  expect(sheets[1].sourceSheet).toBe("Rincian OE");
});

if (process.env.PRISM_OE_REFERENCE) it("locally verifies reference structure without altering or copying the source", async () => {
  const path = process.env.PRISM_OE_REFERENCE!;
  const bytes = readFileSync(path);
  const before = createHash("sha256").update(bytes).digest("hex");
  const sheets = await parseOwnerEstimate(new Uint8Array(bytes).buffer);
  const detail = sheets.find(sheet => sheet.name === "Sheet4")!;
  expect(detail).toBeTruthy();
  expect(detail.rows.find(row => row.sourceRow === 16)?.parentId).toBe("Sheet4:r15");
  expect(detail.rows.find(row => row.sourceRow === 105)?.parentId).toBe("Sheet4:r104");
  expect(detail.rows.find(row => row.sourceRow === 237)?.scope).toBe("COMBINED");
  expect(detail.rows.find(row => row.sourceRow === 241)?.scope).toBe("NONE");
  expect(detail.rows.find(row => row.sourceRow === 37)?.numberSource).toEqual({ cell: "A37", position: "NO" });
  expect(detail.rows.find(row => row.sourceRow === 38)?.numberSource).toEqual({ cell: "B38", position: "CHILD" });
  expect(detail.rows.find(row => row.sourceRow === 16)?.bullet).toEqual({ cell: "B16", value: "-" });
  expect(detail.rows.length).toBeGreaterThan(200);
  expect(createHash("sha256").update(readFileSync(path)).digest("hex")).toBe(before);
});
