import { makeDocument } from "./documents";
import {
  A5_FIXTURES,
  FIXTURE_PREFERENCES
} from "./fixtures";
import { buildHEA } from "./hea";
import { buildBankSnapshot, buildEstimate } from "./historical";
import { buildDeviation } from "./price-deviation";
import type { LocalStore } from "./store";
import { copy } from "../../shared/kernel/validation";
// Prepared records only seed the fixture session; new uploads still require confirmation.
export function prepareShowcase(store: LocalStore) {
  const procurementId = "proc-showcase";
  store.state.procurements.push({
    id: procurementId,
    name: "Penggantian Jalur Pipa",
    number: "PRC-DEMO-2026-003",
    functionName: "Maintenance",
    createdAt: "2026-10-02T09:00:00+07:00",
    preferences: copy(FIXTURE_PREFERENCES),
    preferenceRevision: 1,
    preferenceConfirmed: true,
  });
  for (const [id, name] of [["nusa", "PT Nusa Teknik Mandiri"], ["borneo", "PT Borneo Teknik Nusantara"]]) {
    store.state.vendors.push({ id: `showcase-${id}`, procurementId, name });
  }
  const docs = [
    makeDocument(store, { procurementId, vendorId: "showcase-nusa", kind: "FORM_A5", fixtureId: "a5-nusa", name: "Form-A5-Nusa.pdf" }),
    makeDocument(store, { procurementId, vendorId: "showcase-borneo", kind: "FORM_A5", fixtureId: "a5-borneo", name: "Form-A5-Borneo.pdf" }),
    makeDocument(store, { procurementId, kind: "OE", fixtureId: "oe-terminal", name: "OE-Terminal.xlsx" }),
    makeDocument(store, { procurementId, vendorId: "showcase-nusa", kind: "OFFER", fixtureId: "bid-nusa", name: "Penawaran-Nusa.xlsx" }),
  ];
  for (const doc of docs) {
    doc.status = "CONFIRMED";
    doc.acknowledged = true;
    if (doc.offerSpreadsheet) { doc.offerSpreadsheet.status = "CONFIRMED"; doc.offerSpreadsheet.acknowledged = true; }
    if (doc.reviewed) {
      doc.reviewed = copy(A5_FIXTURES[doc.fixtureId]);
      if (doc.fixtureId === "a5-borneo") doc.revision = 2;
    } else {
      doc.selectedGroup = "Harga satuan material dan jasa";
      doc.revision = 2;
      doc.pairs.forEach((pair) => { pair.confirmed = pair.matched; });
    }
  }
  store.state.documents.push(...docs);
  store.event({ procurementId, module: "PROCUREMENT", type: "CREATED", summary: "Pengadaan contoh siap evaluasi tersedia" });
  store.event({ procurementId, module: "HEA", type: "CORRECTED", summary: "Koreksi contoh TKDN jasa Borneo: 30% menjadi 35%" });
  store.event({ procurementId, module: "HEA", type: "CONFIRMED", summary: "Form A5 dan preferensi pada data contoh telah dikonfirmasi" });
  store.event({ procurementId, module: "PRICE_DEVIATION", type: "CONFIRMED", summary: "Sumber dan pasangan harga pada data contoh telah dikonfirmasi" });
  buildHEA(store, procurementId, docs.filter((d) => d.kind === "FORM_A5").map((d) => d.id));
  buildDeviation(store, procurementId, docs[2].id, docs[3].id);
  for (const item of store.state.historicalItems) {
    const document = makeDocument(store, {
      procurementId: "proc-tank", kind: "HISTORICAL_OE",
      fixtureId: `history-${item.period}`, name: item.documentName,
      functionName: item.functionName, period: item.period,
    });
    document.status = "CONFIRMED";
    document.published = true;
    store.state.documents.push(document);
  }
  store.state.historicalItems.forEach((item) => { item.comparable = true; });
  const referenceIds = store.state.historicalItems.map((item) => item.id);
  store.event({ module: "BANK", type: "CONFIRMED", summary: "Kesebandingan tiga referensi OE contoh telah diperiksa" });
  buildBankSnapshot(store, referenceIds);
  buildEstimate(store, { description: "Pengecatan tangki", unit: "m²", quantity: "10", referenceIds });
}
export function initializeSession(store: LocalStore, seed: boolean, prepared: boolean) {
  if (seed) {
    store.state.procurements = [
      {
        id: "proc-terminal",
        name: "Penggantian Jalur Pipa Terminal",
        number: "PRC-2026-001",
        functionName: "Maintenance",
        createdAt: "2026-09-28T09:00:00+07:00",
        preferenceRevision: 0,
        preferenceConfirmed: false,
      },
      {
        id: "proc-tank",
        name: "Pengecatan Tangki Penyimpanan",
        number: "PRC-2026-002",
        functionName: "Maintenance",
        createdAt: "2026-09-29T10:00:00+07:00",
        preferenceRevision: 0,
        preferenceConfirmed: false,
      },
    ];
    store.state.vendors = [
      {
        id: "vendor-nusa",
        procurementId: "proc-terminal",
        name: "PT Nusa Teknik Mandiri",
      },
      {
        id: "vendor-borneo",
        procurementId: "proc-terminal",
        name: "PT Borneo Teknik Nusantara",
      },
    ];
    store.state.documents = [
      makeDocument(store, {
        procurementId: "proc-terminal",
        vendorId: "vendor-nusa",
        kind: "FORM_A5",
        fixtureId: "a5-nusa",
        name: "Form_A5_Nusa.pdf",
      }),
      makeDocument(store, {
        procurementId: "proc-terminal",
        vendorId: "vendor-borneo",
        kind: "FORM_A5",
        fixtureId: "a5-borneo",
        name: "Form_A5_Borneo.pdf",
      }),
      makeDocument(store, {
        procurementId: "proc-terminal",
        kind: "OE",
        fixtureId: "oe-terminal",
        name: "OE_Terminal.xlsx",
      }),
      makeDocument(store, {
        procurementId: "proc-terminal",
        vendorId: "vendor-nusa",
        kind: "OFFER",
        fixtureId: "bid-nusa",
        name: "Penawaran_Nusa.xlsx",
      }),
    ];
    store.state.events = [
      {
        id: "event-seed",
        createdAt: "2026-09-28T09:00:00+07:00",
        procurementId: "proc-terminal",
        module: "PROCUREMENT",
        type: "CREATED",
        summary: "Pengadaan dibuat",
      },
      {
        id: "event-seed-upload",
        createdAt: "2026-09-29T09:10:00+07:00",
        procurementId: "proc-terminal",
        module: "HEA",
        type: "UPLOADED",
        summary: "Form A5 dua vendor selesai dibaca",
      },
    ];
  }
  if (seed && prepared) prepareShowcase(store);
  store.updateView();
}
