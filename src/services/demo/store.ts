import type {
  Activity,
  DemoState
} from "../../shared/model/session";
import {
  HISTORICAL_FIXTURES
} from "./fixtures";
import { copy, DomainError } from "./validation";
// Only the facade owns this mutable store; React receives frozen copies.
export class DemoStore {
  private view!: DemoState;
  state: DemoState;
  private listeners = new Set<() => void>();
  private sequence = 20;
  constructor() {
    this.state = {
      procurements: [],
      vendors: [],
      documents: [],
      snapshots: [],
      historicalItems: copy(HISTORICAL_FIXTURES),
      events: [],
      estimates: [],
    };

  }
  getState = () => this.view;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  id = (prefix: string) => `${prefix}-${++this.sequence}`;
  doc = (id: string) => {
    const d = this.state.documents.find((d) => d.id === id);
    if (!d) throw new DomainError("NOT_FOUND", "Dokumen tidak ditemukan.");
    return d;
  };
  proc = (id: string) => {
    const p = this.state.procurements.find((p) => p.id === id);
    if (!p) throw new DomainError("NOT_FOUND", "Pengadaan tidak ditemukan.");
    return p;
  };
  check = (current: number, expected: number) => {
    if (current !== expected)
      throw new DomainError(
        "STALE_REVISION",
        "Data telah berubah. Buka kembali versi terbaru.",
      );
  };
  updateView = () => {
    const freeze = (value: unknown): void => {
      if (value && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
      }
    };
    this.view = copy(this.state);
    freeze(this.view);
  };
  emit = () => {
    this.updateView();
    this.listeners.forEach((fn) => fn());
  };
  event = (event: Omit<Activity, "id" | "createdAt">) => {
    this.state.events.unshift({
      ...event,
      id: this.id("event"),
      createdAt: new Date().toISOString(),
    });
  };
}
