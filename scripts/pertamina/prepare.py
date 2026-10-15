"""Prepare the private local catalog. Source bytes and verified values stay outside Git."""
import hashlib
import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[3]
DATA = ROOT / "data-pertamina"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def registered_sources():
    register = (DATA / "source-register.local.md").read_text()
    paths = dict(re.findall(r"\|\s*((?:PD|HEA)-\d+)\s*\|\s*((?:raw|reference)/[^|]+?)\s*\|", register))
    hashes = dict(re.findall(r"\|\s*((?:PD|HEA)-\d+)(?:[^|]*)\|\s*`([a-f0-9]{64})`", register))
    sources = {}
    for ident in ["PD-001", "PD-002", "PD-003", "HEA-001", "HEA-002"]:
        path = DATA / paths[ident]
        if hashlib.sha256(path.read_bytes()).hexdigest() != hashes[ident]:
            raise ValueError(f"Hash sumber {ident} tidak sesuai register.")
        sources[ident] = {"id": ident, "name": path.name, "sha256": hashes[ident], "relativePath": paths[ident]}
    return sources


def workbook_cells(path, sheet_name):
    with ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = ["".join(t.text or "" for t in si.findall(".//s:t", NS)) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        relations = {r.get("Id"): r.get("Target") for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
        for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("s:sheets/s:sheet", NS):
            if sheet.get("name") != sheet_name:
                continue
            target = relations[sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")]
            target = target.lstrip("/") if target.startswith("/") else "xl/" + target
            cells = {}
            for cell in ET.fromstring(archive.read(target)).findall("s:sheetData/s:row/s:c", NS):
                value = cell.findtext("s:v", namespaces=NS)
                if cell.get("t") == "s" and value is not None:
                    value = shared[int(value)]
                elif cell.get("t") == "inlineStr":
                    value = "".join(t.text or "" for t in cell.findall(".//s:t", NS))
                cells[cell.get("r")] = value
            return cells
    raise ValueError("Sheet sumber tidak tersedia.")


def a5_candidates(sources):
    evidence = json.loads((DATA / "verification/hea-package6a/verification.json").read_text())
    results = []
    for original in evidence["sources"]:
        ident = original["source_id"]
        source = sources[ident]
        if original["source_sha256"] != source["sha256"]:
            raise ValueError("Kandidat A5 tidak sesuai versi sumber.")
        review = next(r for r in evidence["evaluation"]["reviews"] if r["candidate"]["source_document_id"] == original["extraction_run"]["document_id"])
        payload = review["candidate"]["payload"]
        vendor = payload["detected_vendor_name"]
        if ident == "HEA-002":
            # The PDF text has joined words; use its already verified identity.
            vendor = review["candidate"]["vendor_name"].replace("PT ", "PT. ", 1)
        fields = [{"field": key, "location": f"Halaman {payload[key]['source']['page']}", "quote": payload[key]["source"]["raw_text"]} for key in original["values"]]
        fields.append({"field": "vendor_name", "location": "Halaman 1", "quote": vendor})
        warnings = ["Subtotal pada dokumen berbeda dari penjumlahan komponennya. Periksa nilai sumber sebelum menyimpan."] if original["notes"] else []
        results.append({"sourceId": ident, "candidate": {"sha256": source["sha256"], "vendorName": vendor, "values": original["values"], "sources": fields, "warnings": warnings}})
    return results, evidence["preferences"]


def price_results(source):
    cells = workbook_cells(DATA / source["relativePath"], "Rekap File Harga Timpang")
    rows = []
    classes = {"Harga Timpang": "TIMPANG", "Harga Tidak Timpang": "TIDAK_TIMPANG"}
    for number in range(10, 232):
        description = " ".join((cells.get(f"{col}{number}") or "").strip() for col in "BCDEFGHIJK").strip()
        for category, oe_col, offer_col, ratio_col, class_col in [("MATERIAL", "N", "V", "Z", "AB"), ("SERVICE", "O", "W", "AA", "AC")]:
            classification = classes.get((cells.get(f"{class_col}{number}") or "").strip())
            if not classification:
                continue
            values = [cells.get(f"{col}{number}") for col in [oe_col, offer_col, ratio_col]]
            if not description or any(v is None or not re.fullmatch(r"\d+(?:\.\d+)?", v) for v in values):
                raise ValueError("Hasil Harga Timpang sumber tidak lengkap.")
            rows.append({"description": description, "category": category, "unit": cells.get(f"M{number}") or "", "oe": values[0], "offer": values[1], "percentageAgainstOE": values[2], "classification": classification, "source": f"Rekap File Harga Timpang · {oe_col}{number}/{offer_col}{number}/{class_col}{number}"})
    if not rows:
        raise ValueError("Hasil Harga Timpang belum tersedia.")
    return rows


def prepare():
    sources = registered_sources()
    a5, preferences = a5_candidates(sources)
    oe = workbook_cells(DATA / sources["PD-001"]["relativePath"], "Sheet4")
    assets = [{**source, "kind": {"PD-001": "OE", "PD-002": "OFFER", "HEA-001": "FORM_A5", "HEA-002": "FORM_A5"}[ident], "path": f"/_pertamina/source/{ident}"} for ident, source in sources.items() if ident != "PD-003"]
    catalog = {"version": 1, "procurementName": oe["E4"], "functionName": oe["E3"], "preferences": preferences, "sources": assets, "a5": a5, "priceRows": price_results(sources["PD-003"]), "referenceHash": sources["PD-003"]["sha256"]}
    folder = DATA / "demo/pertamina-v1"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    print("Paket lokal terverifikasi: 4 sumber; dokumen asli tidak diubah.")


if __name__ == "__main__":
    prepare()
