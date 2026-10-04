import type {
  Estimate,
  HistoricalStatistics
} from "../../shared/model/session";
import {
  HISTORICAL_FIXTURES
} from "./fixtures";
import { snapshot } from "./snapshots";
import type { DemoStore } from "./store";
import { DomainError, copy, requireText } from "./validation";
export async function setHistoricalMetadata(store: DemoStore, id: string, input: {
  functionName: string;
  period: string;
}, expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
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
  store.emit();
  return copy(d);
}
export async function publishHistory(store: DemoStore, id: string, expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
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
  store.state.historicalItems.push({
    ...copy(base),
    id: store.id("reference"),
    documentName: d.name,
    functionName: d.functionName,
  });
  store.event({
    procurementId: d.procurementId,
    module: "BANK",
    type: "PUBLISHED",
    summary: `${d.name} dipublikasikan`,
  });
  store.emit();
  return copy(d);
}
export async function setComparable(store: DemoStore, id: string, value: boolean) {
  const item = store.state.historicalItems.find((i) => i.id === id);
  if (!item) throw new DomainError("NOT_FOUND", "Referensi tidak ditemukan.");
  item.comparable = value;
  store.emit();
}
export async function estimate(store: DemoStore, input: { description: string; unit: string; quantity: string; referenceIds: string[] }) {
  return buildEstimate(store, input);
}
export function buildEstimate(store: DemoStore, input: {
  description: string;
  unit: string;
  quantity: string;
  referenceIds: string[];
}) {
  requireText(input.description, "Uraian kebutuhan");
  const refs = input.referenceIds.map((id) =>
    store.state.historicalItems.find((i) => i.id === id),
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
    id: store.id("estimate"),
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
  store.state.estimates.unshift(e);
  store.event({
    module: "BANK",
    type: "ESTIMATED",
    summary: `Estimasi ${input.description} selesai`,
  });
  store.emit();
  return copy(e);
}
export function getPreparedStatistics(store: DemoStore, referenceIds: string[]): HistoricalStatistics | undefined {
  const refs = [...new Set(referenceIds)].map((id) =>
    store.state.historicalItems.find((item) => item.id === id),
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
export async function createBankSnapshot(store: DemoStore, referenceIds: string[]) {
  return buildBankSnapshot(store, referenceIds);
}
export function buildBankSnapshot(store: DemoStore, referenceIds: string[]) {
  const refs = [...new Set(referenceIds)].map((id) =>
    store.state.historicalItems.find((i) => i.id === id),
  );
  if (!refs.length || refs.some((i) => !i || !i.comparable))
    throw new DomainError(
      "INSUFFICIENT_DATA",
      "Pilih referensi yang telah diperiksa kesebandingannya.",
    );
  return snapshot(store, {
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
      ...(getPreparedStatistics(store, referenceIds)
        ? { statistics: getPreparedStatistics(store, referenceIds) }
        : {}),
    },
    policy:
      "Referensi harga historis terpilih. Kesebandingan dinyatakan evaluator; bukan harga pasar.",
  });
}
