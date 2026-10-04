import type { SessionService } from "../services/session-service";
import registry from "../fixtures/file-registry.json";
import type {
  A5Values,
  Activity,
  DemoState,
  DocumentRecord,
  Estimate,
  HistoricalStatistics,
  Preferences,
  PricePair,
  Procurement,
  Snapshot,
  UploadInput,
} from "../shared/model/session";
import {
  A5_FIXTURES,
  DEMO_PREFERENCES,
  HEA_RESULTS,
  HISTORICAL_FIXTURES,
  PAIR_FIXTURES,
} from "./fixtures";
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
const copy = <T>(value: T): T => structuredClone(value);
const normalize = (s: string) =>
  s
    .trim()
    .replace(/^\./, "0.")
    .replace(/^0+(?=\d)/, "")
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
const equalValues = (a: object, b: object) => {
  const values = a as Record<string, string>;
  return Object.entries(b).every(
    ([key, value]) => normalize(values[key] ?? "") === normalize(value),
  );
};
const requireText = (text: string, label: string) => {
  if (!text.trim()) throw new DomainError("REQUIRED", `${label} wajib diisi.`);
};
const decimal = (text: string, ratio = false) => {
  if (
    text.length > 80 ||
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
export class DemoService implements SessionService {
  private view!: DemoState;
  private state: DemoState;
  private listeners = new Set<() => void>();
  private sequence = 20;
  constructor(seed = true, prepared = false) {
    this.state = {
      procurements: [],
      vendors: [],
      documents: [],
      snapshots: [],
      historicalItems: copy(HISTORICAL_FIXTURES),
      events: [],
      estimates: [],
    };
    if (seed) {
      this.state.procurements = [
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
      this.state.vendors = [
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
      this.state.documents = [
        this.makeDocument({
          procurementId: "proc-terminal",
          vendorId: "vendor-nusa",
          kind: "FORM_A5",
          fixtureId: "a5-nusa",
          name: "Form_A5_Nusa.pdf",
        }),
        this.makeDocument({
          procurementId: "proc-terminal",
          vendorId: "vendor-borneo",
          kind: "FORM_A5",
          fixtureId: "a5-borneo",
          name: "Form_A5_Borneo.pdf",
        }),
        this.makeDocument({
          procurementId: "proc-terminal",
          kind: "OE",
          fixtureId: "oe-terminal",
          name: "OE_Terminal.xlsx",
        }),
        this.makeDocument({
          procurementId: "proc-terminal",
          vendorId: "vendor-nusa",
          kind: "OFFER",
          fixtureId: "bid-nusa",
          name: "Penawaran_Nusa.xlsx",
        }),
      ];
      this.state.events = [
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
    if (seed && prepared) this.prepareShowcase();
    this.updateView();
  }
  // Prepared synthetic records represent a completed demo session only.
  // New uploads still pass through review and explicit evaluator confirmation.
  private prepareShowcase() {
    const procurementId = "proc-showcase";
    this.state.procurements.push({
      id: procurementId,
      name: "Penggantian Jalur Pipa — Siap Evaluasi",
      number: "PRC-DEMO-2026-003",
      functionName: "Maintenance",
      createdAt: "2026-10-02T09:00:00+07:00",
      preferences: copy(DEMO_PREFERENCES),
      preferenceRevision: 1,
      preferenceConfirmed: true,
    });
    for (const [id, name] of [["nusa", "PT Nusa Teknik Mandiri"], ["borneo", "PT Borneo Teknik Nusantara"]]) {
      this.state.vendors.push({ id: `showcase-${id}`, procurementId, name });
    }
    const docs = [
      this.makeDocument({ procurementId, vendorId: "showcase-nusa", kind: "FORM_A5", fixtureId: "a5-nusa", name: "Form-A5-Nusa.pdf" }),
      this.makeDocument({ procurementId, vendorId: "showcase-borneo", kind: "FORM_A5", fixtureId: "a5-borneo", name: "Form-A5-Borneo.pdf" }),
      this.makeDocument({ procurementId, kind: "OE", fixtureId: "oe-terminal", name: "OE-Terminal.xlsx" }),
      this.makeDocument({ procurementId, vendorId: "showcase-nusa", kind: "OFFER", fixtureId: "bid-nusa", name: "Penawaran-Nusa.xlsx" }),
    ];
    for (const doc of docs) {
      doc.status = "CONFIRMED";
      doc.acknowledged = true;
      if (doc.reviewed) {
        doc.reviewed = copy(A5_FIXTURES[doc.fixtureId]);
        if (doc.fixtureId === "a5-borneo") doc.revision = 2;
      } else {
        doc.selectedGroup = "Harga satuan material dan jasa";
        doc.revision = 2;
        doc.pairs.forEach((pair) => { pair.confirmed = pair.matched; });
      }
    }
    this.state.documents.push(...docs);
    this.event({ procurementId, module: "PROCUREMENT", type: "CREATED", summary: "Pengadaan contoh siap evaluasi tersedia" });
    this.event({ procurementId, module: "HEA", type: "CORRECTED", summary: "Koreksi contoh TKDN jasa Borneo: 30% menjadi 35%" });
    this.event({ procurementId, module: "HEA", type: "CONFIRMED", summary: "Form A5 dan preferensi pada data contoh telah dikonfirmasi" });
    this.event({ procurementId, module: "PRICE_DEVIATION", type: "CONFIRMED", summary: "Sumber dan pasangan harga pada data contoh telah dikonfirmasi" });
    this.buildHEA(procurementId, docs.filter((d) => d.kind === "FORM_A5").map((d) => d.id));
    this.buildDeviation(procurementId, docs[2].id, docs[3].id);
    for (const item of this.state.historicalItems) {
      const document = this.makeDocument({
        procurementId: "proc-tank", kind: "HISTORICAL_OE",
        fixtureId: `history-${item.period}`, name: item.documentName,
        functionName: item.functionName, period: item.period,
      });
      document.status = "CONFIRMED";
      document.published = true;
      this.state.documents.push(document);
    }
    this.state.historicalItems.forEach((item) => { item.comparable = true; });
    const referenceIds = this.state.historicalItems.map((item) => item.id);
    this.event({ module: "BANK", type: "CONFIRMED", summary: "Kesebandingan tiga referensi OE contoh telah diperiksa" });
    this.buildBankSnapshot(referenceIds);
    this.buildEstimate({ description: "Pengecatan tangki", unit: "m²", quantity: "10", referenceIds });
  }
  getState = () => this.view;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private id = (prefix: string) => `${prefix}-${++this.sequence}`;
  private doc = (id: string) => {
    const d = this.state.documents.find((d) => d.id === id);
    if (!d) throw new DomainError("NOT_FOUND", "Dokumen tidak ditemukan.");
    return d;
  };
  private proc = (id: string) => {
    const p = this.state.procurements.find((p) => p.id === id);
    if (!p) throw new DomainError("NOT_FOUND", "Pengadaan tidak ditemukan.");
    return p;
  };
  private check = (current: number, expected: number) => {
    if (current !== expected)
      throw new DomainError(
        "STALE_REVISION",
        "Data telah berubah. Buka kembali versi terbaru.",
      );
  };
  private updateView = () => {
    const freeze = (value: unknown): void => {
      if (value && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
      }
    };
    this.view = copy(this.state);
    freeze(this.view);
  };
  private emit = () => {
    this.updateView();
    this.listeners.forEach((fn) => fn());
  };
  private event = (event: Omit<Activity, "id" | "createdAt">) => {
    this.state.events.unshift({
      ...event,
      id: this.id("event"),
      createdAt: new Date().toISOString(),
    });
  };
  private makeDocument(input: UploadInput): DocumentRecord {
    const candidate = A5_FIXTURES[input.fixtureId];
    const file = registry.find((f) => f.id === input.fixtureId);
    const id = this.id("doc");
    return {
      ...input,
      id,
      priceItems: ["OE", "OFFER"].includes(input.kind)
        ? file?.rows?.map((row) => ({
          id: row.id,
          description: row.description,
          category:
            row.category === "MATERIAL"
              ? ("MATERIAL" as const)
              : ("SERVICE" as const),
          unit: row.unit,
          oe: row.oe,
          offer: row.offer,
          source: row.source,
        }))
        : undefined,
      period: input.period ?? file?.period,
      historicalItems:
        input.kind === "HISTORICAL_OE"
          ? file?.rows?.map((row, index) => ({
            id: `${id}-item-${index}`,
            documentName: input.name,
            description: row.description,
            functionName: input.functionName ?? "",
            period: file.period ?? "",
            unit: row.unit,
            price: row.oe,
            source: row.source,
            comparable: false,
          }))
          : undefined,
      uploadedAt: new Date().toISOString(),
      revision: 1,
      status: "REVIEW_REQUIRED",
      candidate: candidate
        ? {
          ...copy(candidate),
          ...(input.fixtureId === "a5-borneo" ? { tkdn_jasa: "0.3" } : {}),
        }
        : undefined,
      reviewed: candidate
        ? {
          ...copy(candidate),
          ...(input.fixtureId === "a5-borneo" ? { tkdn_jasa: "0.3" } : {}),
        }
        : undefined,
      warnings: file?.warnings ?? [],
      acknowledged: false,
      sources: copy(file?.sources ?? []),
      groups: candidate
        ? []
        : ["Harga satuan material dan jasa", "Ringkasan total"],
      pairs:
        input.kind === "OFFER"
          ? copy(PAIR_FIXTURES).map((pair) => ({
            ...pair,
            source:
              file?.rows?.find((row) => row.id === pair.id)?.source ??
              pair.source,
          }))
          : [],
      published: false,
    };
  }
  async createProcurement(input: {
    name: string;
    number: string;
    functionName: string;
  }) {
    requireText(input.name, "Nama pengadaan");
    requireText(input.number, "Nomor pengadaan");
    requireText(input.functionName, "Fungsi");
    if (this.state.procurements.some((p) => p.number === input.number.trim()))
      throw new DomainError("DUPLICATE", "Nomor pengadaan sudah digunakan.");
    const p: Procurement = {
      ...input,
      id: this.id("proc"),
      createdAt: new Date().toISOString(),
      preferenceRevision: 0,
      preferenceConfirmed: false,
    };
    this.state.procurements.unshift(p);
    this.event({
      procurementId: p.id,
      module: "PROCUREMENT",
      type: "CREATED",
      summary: `Pengadaan ${p.name} dibuat`,
    });
    this.emit();
    return copy(p);
  }
  async addVendor(procurementId: string, name: string) {
    this.proc(procurementId);
    requireText(name, "Nama vendor");
    if (
      this.state.vendors.some(
        (v) =>
          v.procurementId === procurementId &&
          v.name.toLowerCase() === name.trim().toLowerCase(),
      )
    )
      throw new DomainError("DUPLICATE", "Vendor sudah terdaftar.");
    const v = { id: this.id("vendor"), procurementId, name: name.trim() };
    this.state.vendors.push(v);
    this.event({
      procurementId,
      module: "PROCUREMENT",
      type: "VENDOR_ADDED",
      summary: `Vendor ${name} ditambahkan`,
    });
    this.emit();
    return copy(v);
  }
  async uploadRegisteredDocument(input: UploadInput) {
    this.proc(input.procurementId);
    const expected = input.fixtureId.startsWith("a5-")
      ? "FORM_A5"
      : input.fixtureId === "oe-terminal"
        ? "OE"
        : input.fixtureId.startsWith("bid-")
          ? "OFFER"
          : /^history-202[456]$/.test(input.fixtureId)
            ? "HISTORICAL_OE"
            : undefined;
    if (
      expected !== input.kind ||
      !registry.some(
        (file) => file.id === input.fixtureId && file.kind === input.kind,
      )
    )
      throw new DomainError(
        "UNSUPPORTED",
        "Format dokumen ini belum didukung.",
      );
    if (
      ["FORM_A5", "OFFER"].includes(input.kind) &&
      !this.state.vendors.some(
        (v) =>
          v.id === input.vendorId && v.procurementId === input.procurementId,
      )
    )
      throw new DomainError("VENDOR_REQUIRED", "Pilih vendor pemilik dokumen.");
    const d = this.makeDocument(input);
    this.state.documents.unshift(d);
    this.event({
      procurementId: input.procurementId,
      module:
        input.kind === "FORM_A5"
          ? "HEA"
          : input.kind === "HISTORICAL_OE"
            ? "BANK"
            : "PRICE_DEVIATION",
      type: "UPLOADED",
      summary: `${input.name} selesai dibaca`,
    });
    this.emit();
    return copy(d);
  }
  async reviewDocument(id: string, values: A5Values, expectedRevision: number) {
    const d = this.doc(id);
    this.check(d.revision, expectedRevision);
    if (!d.candidate)
      throw new DomainError("WRONG_KIND", "Dokumen ini bukan Form A5.");
    Object.entries(values).forEach(([key, value]) =>
      decimal(value, key.startsWith("tkdn")),
    );
    if (d.reviewed && equalValues(values, d.reviewed)) return copy(d);
    d.reviewed = copy(values);
    d.revision++;
    d.status = "REVIEW_REQUIRED";
    d.acknowledged = false;
    this.event({
      procurementId: d.procurementId,
      module: "HEA",
      type: "CORRECTED",
      summary: `Nilai ${d.name} diperbarui`,
    });
    this.emit();
    return copy(d);
  }
  async confirmDocument(
    id: string,
    expectedRevision: number,
    acknowledged = false,
  ) {
    const d = this.doc(id);
    this.check(d.revision, expectedRevision);
    if (d.status === "CONFIRMED") return copy(d);
    if (d.warnings.length && !acknowledged)
      throw new DomainError(
        "WARNING_REQUIRED",
        "Verifikasi seluruh peringatan sebelum konfirmasi.",
      );
    d.status = "CONFIRMED";
    d.acknowledged = acknowledged;
    this.event({
      procurementId: d.procurementId,
      module:
        d.kind === "FORM_A5"
          ? "HEA"
          : d.kind === "HISTORICAL_OE"
            ? "BANK"
            : "PRICE_DEVIATION",
      type: "CONFIRMED",
      summary: `${d.name} dikonfirmasi`,
    });
    this.emit();
    return copy(d);
  }
  async setPreferences(
    procurementId: string,
    values: Preferences,
    expectedRevision: number,
  ) {
    const p = this.proc(procurementId);
    this.check(p.preferenceRevision, expectedRevision);
    Object.values(values).forEach((v) => decimal(v, true));
    if (p.preferences && equalValues(values, p.preferences)) return copy(p);
    p.preferences = copy(values);
    p.preferenceRevision++;
    p.preferenceConfirmed = false;
    this.event({
      procurementId,
      module: "HEA",
      type: "CORRECTED",
      summary: "Preferensi pengadaan diperbarui",
    });
    this.emit();
    return copy(p);
  }
  async confirmPreferences(procurementId: string, expectedRevision: number) {
    const p = this.proc(procurementId);
    this.check(p.preferenceRevision, expectedRevision);
    if (!p.preferences)
      throw new DomainError(
        "PREFERENCES_REQUIRED",
        "Isi preferensi barang dan jasa.",
      );
    if (p.preferenceConfirmed) return copy(p);
    p.preferenceConfirmed = true;
    this.event({
      procurementId,
      module: "HEA",
      type: "CONFIRMED",
      summary: "Preferensi pengadaan dikonfirmasi",
    });
    this.emit();
    return copy(p);
  }
  async evaluateHEA(procurementId: string, documentIds: string[]) {
    return this.buildHEA(procurementId, documentIds);
  }
  private buildHEA(procurementId: string, documentIds: string[]) {
    const p = this.proc(procurementId);
    if (!p.preferenceConfirmed || !p.preferences)
      throw new DomainError(
        "PREFERENCES_REQUIRED",
        "Konfirmasi preferensi sebelum evaluasi.",
      );
    if (!equalValues(p.preferences, DEMO_PREFERENCES))
      throw new DomainError(
        "UNAVAILABLE",
        "Evaluasi belum tersedia untuk nilai preferensi ini. Periksa kembali data.",
      );
    if (!documentIds.length)
      throw new DomainError("REQUIRED", "Pilih dokumen yang akan dievaluasi.");
    const docs = [...new Set(documentIds)].map((id) => this.doc(id));
    if (
      docs.some(
        (d) => d.procurementId !== procurementId || d.kind !== "FORM_A5",
      )
    )
      throw new DomainError(
        "WRONG_SCOPE",
        "Pilihan dokumen tidak sesuai pengadaan.",
      );
    if (new Set(docs.map((d) => d.vendorId)).size !== docs.length)
      throw new DomainError(
        "DUPLICATE",
        "Pilih satu Form A5 untuk setiap vendor.",
      );
    if (docs.some((d) => d.status !== "CONFIRMED"))
      throw new DomainError(
        "CONFIRMATION_REQUIRED",
        "Konfirmasi seluruh dokumen terpilih.",
      );
    if (
      docs.some(
        (d) =>
          !d.reviewed || !equalValues(d.reviewed, A5_FIXTURES[d.fixtureId]),
      )
    )
      throw new DomainError(
        "UNAVAILABLE",
        "Evaluasi belum tersedia untuk nilai ini. Periksa kembali data.",
      );
    const rows = docs
      .sort(
        (a, b) =>
          Object.keys(HEA_RESULTS).indexOf(a.fixtureId) -
          Object.keys(HEA_RESULTS).indexOf(b.fixtureId),
      )
      .map((d, index) => ({
        vendorId: d.vendorId,
        vendorName: this.state.vendors.find((v) => v.id === d.vendorId)?.name,
        rank: index + 1,
        hea: HEA_RESULTS[d.fixtureId],
        source: d.name,
      }));
    const excluded = this.state.vendors
      .filter(
        (v) =>
          v.procurementId === procurementId &&
          !docs.some((d) => d.vendorId === v.id),
      )
      .map((v) => v.name);
    return this.snapshot({
      procurementId,
      module: "HEA",
      rows,
      excluded,
      status: excluded.length ? "PARTIAL" : "COMPLETE",
      inputs: { procurement: copy(p), documents: copy(docs) },
      policy:
        "Kebijakan evaluasi provisional; TKDN barang ≥ 25%, jasa ≥ 30%; preferensi dikonfirmasi evaluator.",
    });
  }
  private snapshot(input: Omit<Snapshot, "id" | "createdAt">) {
    const s: Snapshot = {
      ...copy(input),
      id: this.id("result"),
      createdAt: new Date().toISOString(),
    };
    this.state.snapshots.unshift(s);
    this.event({
      procurementId: s.procurementId,
      module: s.module,
      type: "EVALUATED",
      summary: `Evaluasi ${s.module === "HEA" ? "HEA" : s.module === "BANK" ? "historis" : "Harga Timpang"} selesai`,
      snapshotId: s.id,
    });
    this.emit();
    return copy(s);
  }
  async selectGroup(id: string, group: string, expectedRevision: number) {
    const d = this.doc(id);
    this.check(d.revision, expectedRevision);
    if (!d.groups.includes(group))
      throw new DomainError(
        "INVALID_GROUP",
        "Pilih kelompok harga yang tersedia.",
      );
    if (d.selectedGroup === group) return copy(d);
    d.selectedGroup = group;
    d.revision++;
    d.status = "REVIEW_REQUIRED";
    d.pairs.forEach((p) => (p.confirmed = false));
    this.emit();
    return copy(d);
  }
  async reviewPairs(id: string, pairs: PricePair[], expectedRevision: number) {
    const d = this.doc(id);
    this.check(d.revision, expectedRevision);
    if (d.kind !== "OFFER")
      throw new DomainError("WRONG_KIND", "Pilih dokumen penawaran.");
    if (
      pairs.length !== PAIR_FIXTURES.length ||
      new Set(pairs.map((p) => p.id)).size !== pairs.length ||
      pairs.some((p) => !PAIR_FIXTURES.some((f) => f.id === p.id))
    )
      throw new DomainError(
        "INVALID_PAIRS",
        "Daftar pasangan tidak sesuai dokumen.",
      );
    pairs.forEach((p) => {
      decimal(p.oe);
      decimal(p.offer);
    });
    if (
      pairs.every((p) => {
        const old = d.pairs.find((o) => o.id === p.id);
        return (
          old &&
          equalValues(
            { oe: p.oe, offer: p.offer },
            { oe: old.oe, offer: old.offer },
          ) &&
          old.description === p.description &&
          old.category === p.category &&
          old.unit === p.unit &&
          old.matched === p.matched &&
          old.source === p.source
        );
      })
    )
      return copy(d);
    d.pairs = pairs.map((p) => ({
      ...copy(p),
      confirmed: false,
      revision: p.revision + 1,
    }));
    d.revision++;
    d.status = "REVIEW_REQUIRED";
    this.event({
      procurementId: d.procurementId,
      module: "PRICE_DEVIATION",
      type: "CORRECTED",
      summary: `Pasangan ${d.name} diperbarui`,
    });
    this.emit();
    return copy(d);
  }
  async confirmPairs(
    id: string,
    expectedRevision: number,
    acknowledged = false,
  ) {
    const d = this.doc(id);
    this.check(d.revision, expectedRevision);
    if (d.selectedGroup !== "Harga satuan material dan jasa")
      throw new DomainError(
        "GROUP_REQUIRED",
        "Pilih kelompok harga satuan material dan jasa.",
      );
    if (d.warnings.length && !acknowledged)
      throw new DomainError(
        "WARNING_REQUIRED",
        "Verifikasi seluruh peringatan sebelum konfirmasi pasangan.",
      );
    if (d.pairs.some((p) => p.matched && normalize(p.oe) === "0"))
      throw new DomainError(
        "INVALID_VALUE",
        "Harga OE harus lebih besar dari nol.",
      );
    if (!d.pairs.some((p) => p.matched))
      throw new DomainError("PAIR_REQUIRED", "Pilih setidaknya satu pasangan.");
    if (d.status === "CONFIRMED") return copy(d);
    d.acknowledged = acknowledged;
    d.pairs.forEach((p) => (p.confirmed = p.matched));
    d.status = "CONFIRMED";
    this.event({
      procurementId: d.procurementId,
      module: "PRICE_DEVIATION",
      type: "CONFIRMED",
      summary: `Pasangan ${d.name} dikonfirmasi`,
    });
    this.emit();
    return copy(d);
  }
  async evaluateDeviation(procurementId: string, oeId: string, offerId: string) {
    return this.buildDeviation(procurementId, oeId, offerId);
  }
  private buildDeviation(procurementId: string, oeId: string, offerId: string) {
    this.proc(procurementId);
    const oe = this.doc(oeId),
      offer = this.doc(offerId);
    if (
      oe.procurementId !== procurementId ||
      offer.procurementId !== procurementId ||
      oe.kind !== "OE" ||
      offer.kind !== "OFFER"
    )
      throw new DomainError(
        "WRONG_SCOPE",
        "Pilih OE dan penawaran dalam pengadaan ini.",
      );
    if (
      oe.status !== "CONFIRMED" ||
      offer.status !== "CONFIRMED" ||
      oe.selectedGroup !== "Harga satuan material dan jasa" ||
      offer.selectedGroup !== "Harga satuan material dan jasa"
    )
      throw new DomainError(
        "CONFIRMATION_REQUIRED",
        "Pilih kelompok dan konfirmasi kedua sumber.",
      );
    const oeSource = registry.find(
      (file) => file.id === oe.fixtureId && file.kind === "OE",
    );
    const offerSource = registry.find(
      (file) => file.id === offer.fixtureId && file.kind === "OFFER",
    );
    if (!oeSource || !offerSource)
      throw new DomainError("UNAVAILABLE", "Sumber evaluasi belum tersedia.");
    const selected = offer.pairs.filter((p) => p.confirmed && p.matched);
    if (!selected.length)
      throw new DomainError(
        "PAIR_REQUIRED",
        "Tidak ada pasangan terkonfirmasi.",
      );
    if (
      selected.some((p) => {
        const oeRow = oeSource.rows?.find((row) => row.id === p.id),
          offerRow = offerSource.rows?.find((row) => row.id === p.id);
        return (
          !oeRow ||
          !offerRow ||
          p.description !== oeRow.description ||
          p.description !== offerRow.description ||
          p.category !== oeRow.category ||
          p.category !== offerRow.category ||
          p.unit !== oeRow.unit ||
          p.unit !== offerRow.unit ||
          !equalValues(
            { oe: p.oe, offer: p.offer },
            { oe: oeRow.oe, offer: offerRow.offer },
          )
        );
      })
    )
      throw new DomainError(
        "UNAVAILABLE",
        "Evaluasi belum tersedia untuk koreksi ini. Periksa kembali data.",
      );
    const rows = selected.map((p) => ({
      description: p.description,
      category: p.category,
      unit: p.unit,
      oe: p.oe,
      offer: p.offer,
      source: `${oe.name} · ${oeSource.rows?.find((row) => row.id === p.id)?.source} / ${offer.name} · ${offerSource.rows?.find((row) => row.id === p.id)?.source}`,
      percentageAgainstOE:
        p.id === "pipe" ? "1.25" : p.id === "install" ? "1.10" : "0.80",
      deviation:
        p.id === "pipe" ? "0.25" : p.id === "install" ? "0.10" : "-0.20",
      classification: p.id === "pipe" ? "TIMPANG" : "TIDAK_TIMPANG",
    }));
    const excluded = offer.pairs
      .filter((p) => !p.confirmed)
      .map((p) => p.description);
    return this.snapshot({
      procurementId,
      module: "PRICE_DEVIATION",
      rows,
      excluded,
      status: excluded.length ? "PARTIAL" : "COMPLETE",
      inputs: { oe: copy(oe), offer: copy(offer) },
      policy:
        "Harga penawaran > 110% OE diklasifikasikan timpang. Material dan jasa ditinjau terpisah.",
    });
  }
  async setHistoricalMetadata(
    id: string,
    input: {
      functionName: string;
      period: string;
    },
    expectedRevision: number,
  ) {
    const d = this.doc(id);
    this.check(d.revision, expectedRevision);
    requireText(input.functionName, "Fungsi");
    if (!/^\d{4}$/.test(input.period))
      throw new DomainError(
        "INVALID_PERIOD",
        "Periode harus berupa tahun empat digit.",
      );
    if (d.kind !== "HISTORICAL_OE")
      throw new DomainError("WRONG_KIND", "Pilih dokumen historis.");
    if (d.functionName === input.functionName && d.period === input.period)
      return copy(d);
    d.functionName = input.functionName;
    d.period = input.period;
    d.revision++;
    d.status = "REVIEW_REQUIRED";
    d.published = false;
    this.emit();
    return copy(d);
  }
  async publishHistory(id: string, expectedRevision: number) {
    const d = this.doc(id);
    this.check(d.revision, expectedRevision);
    if (
      d.kind !== "HISTORICAL_OE" ||
      d.status !== "CONFIRMED" ||
      !d.functionName ||
      !d.period
    )
      throw new DomainError(
        "CONFIRMATION_REQUIRED",
        "Lengkapi fungsi/periode dan konfirmasi dokumen.",
      );
    if (d.published)
      throw new DomainError("DUPLICATE", "Dokumen sudah dipublikasikan.");
    const base = HISTORICAL_FIXTURES.find(
      (i) => d.fixtureId === `history-${i.period}`,
    );
    if (!base || d.period !== base.period)
      throw new DomainError("UNAVAILABLE", "Periode tidak sesuai sumber.");
    d.published = true;
    this.state.historicalItems.push({
      ...copy(base),
      id: this.id("reference"),
      documentName: d.name,
      functionName: d.functionName,
    });
    this.event({
      procurementId: d.procurementId,
      module: "BANK",
      type: "PUBLISHED",
      summary: `${d.name} dipublikasikan`,
    });
    this.emit();
    return copy(d);
  }
  async setComparable(id: string, value: boolean) {
    const item = this.state.historicalItems.find((i) => i.id === id);
    if (!item) throw new DomainError("NOT_FOUND", "Referensi tidak ditemukan.");
    item.comparable = value;
    this.emit();
  }
  async estimate(input: { description: string; unit: string; quantity: string; referenceIds: string[] }) {
    return this.buildEstimate(input);
  }
  private buildEstimate(input: {
    description: string;
    unit: string;
    quantity: string;
    referenceIds: string[];
  }) {
    requireText(input.description, "Uraian kebutuhan");
    const refs = input.referenceIds.map((id) =>
      this.state.historicalItems.find((i) => i.id === id),
    );
    if (
      refs.length !== 3 ||
      refs.some((r) => !r || !r.comparable || r.unit !== input.unit) ||
      new Set(refs.map((r) => r?.period)).size !== 3
    )
      throw new DomainError(
        "INSUFFICIENT_DATA",
        "Data referensi yang sebanding belum memadai untuk kebutuhan ini.",
      );
    if (
      input.description.trim().toLowerCase() !== "pengecatan tangki" ||
      !["1", "10", "100"].includes(input.quantity)
    )
      throw new DomainError(
        "UNAVAILABLE",
        "Estimasi belum tersedia untuk kebutuhan ini. Periksa uraian dan kuantitas.",
      );
    const e: Estimate = {
      ...input,
      id: this.id("estimate"),
      unitPrice: "90000",
      total:
        input.quantity === "1"
          ? "90000"
          : input.quantity === "10"
            ? "900000"
            : "9000000",
      min: "85000",
      max: "95000",
      median: "90000",
      createdAt: new Date().toISOString(),
    };
    this.state.estimates.unshift(e);
    this.event({
      module: "BANK",
      type: "ESTIMATED",
      summary: `Estimasi ${input.description} selesai`,
    });
    this.emit();
    return copy(e);
  }
  getPreparedStatistics(
    referenceIds: string[],
  ): HistoricalStatistics | undefined {
    const refs = [...new Set(referenceIds)].map((id) =>
      this.state.historicalItems.find((item) => item.id === id),
    );
    if (
      refs.length !== 3 ||
      refs.some(
        (ref) =>
          !ref ||
          !ref.comparable ||
          !HISTORICAL_FIXTURES.some(
            (fixture) =>
              fixture.period === ref.period &&
              fixture.price === ref.price &&
              fixture.unit === ref.unit &&
              fixture.description === ref.description,
          ),
      ) ||
      new Set(refs.map((ref) => ref!.period)).size !== 3
    )
      return undefined;
    const observations = refs
      .map((ref) => ({ id: ref!.id, period: ref!.period, price: ref!.price }))
      .sort((a, b) => a.period.localeCompare(b.period));
    return {
      description: "Pengecatan tangki",
      unit: "m²",
      min: "85000",
      median: "90000",
      max: "95000",
      observations,
      chart: {
        points: observations.map((point, index) => ({
          ...point,
          x: [100, 350, 600][index],
          y: [180, 105, 30][index],
        })),
        ticks: [
          { y: 180, price: "85000" },
          { y: 105, price: "90000" },
          { y: 30, price: "95000" },
        ],
      },
    };
  }
  getHistoricalStatistics = (referenceIds: string[]) =>
    this.getPreparedStatistics(referenceIds);
  async createBankSnapshot(referenceIds: string[]) {
    return this.buildBankSnapshot(referenceIds);
  }
  private buildBankSnapshot(referenceIds: string[]) {
    const refs = [...new Set(referenceIds)].map((id) =>
      this.state.historicalItems.find((i) => i.id === id),
    );
    if (!refs.length || refs.some((i) => !i || !i.comparable))
      throw new DomainError(
        "INSUFFICIENT_DATA",
        "Pilih referensi yang telah diperiksa kesebandingannya.",
      );
    return this.snapshot({
      procurementId: "proc-tank",
      module: "BANK",
      status: "COMPLETE",
      excluded: [],
      rows: refs.map((i) => ({
        description: i!.description,
        unit: i!.unit,
        offer: i!.price,
        source: `${i!.documentName} · ${i!.source} · ${i!.period}`,
      })),
      inputs: {
        references: copy(refs),
        ...(this.getPreparedStatistics(referenceIds)
          ? { statistics: this.getPreparedStatistics(referenceIds) }
          : {}),
      },
      policy:
        "Referensi harga historis terpilih. Kesebandingan dinyatakan evaluator; bukan harga pasar.",
    });
  }
  async recordExport(snapshotId: string) {
    const s = this.state.snapshots.find((s) => s.id === snapshotId);
    if (!s) throw new DomainError("NOT_FOUND", "Hasil tidak ditemukan.");
    this.event({
      procurementId: s.procurementId,
      module: s.module,
      type: "EXPORTED",
      summary: "Laporan Excel dibuat",
      snapshotId,
    });
    this.emit();
  }
}
export const createDemoService = (seed = true, prepared = false) => new DemoService(seed, prepared);
export const demoService = createDemoService(true, true);
