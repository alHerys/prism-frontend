import { estimateMedian } from "../../modules/historical-prices/infrastructure/median-estimator";
import { reviewedMetadata, assertPublishable } from "../../modules/historical-prices/domain/publication";
import type { Estimate, HistoricalStatistics } from "../../modules/historical-prices/domain/models";
import {
  HISTORICAL_FIXTURES
} from "./fixtures";
import { snapshot } from "./snapshots";
import type { LocalStore } from "./store";
import { DomainError, copy, requireText } from "../../shared/kernel/validation";
export async function setHistoricalMetadata(store: LocalStore, id: string, input: {
  functionName: string;
  period: string;
}, expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  const patch = reviewedMetadata(d, input);
  if (!patch) return copy(d);
  Object.assign(d, patch);
  store.emit();
  return copy(d);
}
export async function publishHistory(store: LocalStore, id: string, expectedRevision: number) {
  const d = store.doc(id);
  store.check(d.revision, expectedRevision);
  assertPublishable(d);
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
export async function setComparable(store: LocalStore, id: string, value: boolean) {
  const item = store.state.historicalItems.find((i) => i.id === id);
  if (!item) throw new DomainError("NOT_FOUND", "Referensi tidak ditemukan.");
  item.comparable = value;
  store.emit();
}
export async function estimate(store: LocalStore, input: { description: string; unit: string; quantity: string; referenceIds: string[] }) {
  return buildEstimate(store, input);
}
export function buildEstimate(store: LocalStore, input: {
  description: string;
  unit: string;
  quantity: string;
  referenceIds: string[];
}) {
  requireText(input.description, "Uraian kebutuhan");
  // Selection belongs to the application: callers cannot silently omit an available reference.
  const refs = store.state.historicalItems.filter(item => item.unit === input.unit);
  const values = estimateMedian(refs.map(item => item.price), input.quantity);
  const e: Estimate = {
    ...input,
    referenceIds: refs.map(item => item.id),
    id: store.id("estimate"),
    unitPrice: values.unitPrice,
    total: values.total,
    min: values.min,
    max: values.max,
    median: values.median,
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
export function getPreparedStatistics(store: LocalStore, referenceIds: string[]): HistoricalStatistics | undefined {
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
export async function createBankSnapshot(store: LocalStore, referenceIds: string[]) {
  return buildBankSnapshot(store, referenceIds);
}
export function buildBankSnapshot(store: LocalStore, referenceIds: string[]) {
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
