import { describe, it, expect, vi } from "vitest";
import { createA5IntakeUseCases } from "./intake-use-cases";
import { createIntakeStore } from "../../../infrastructure/local/intake-store";
import type { A5Candidate, IntakeSource, ExistingA5Vendor } from "../domain/intake";
import type { A5ExtractionPort, IntakeAssets } from "./intake-ports";
import type { BinarySource } from "../../../shared/kernel/binary-source";

const values = { hpb: "1000", hpj: "300", knb: "25", tkdn_barang: "0.4", tkdn_jasa: "0.3" };
const file = (name: string): BinarySource => ({ name, size: 10, arrayBuffer: async () => new ArrayBuffer(10) });
function setup() {
  const store = createIntakeStore();
  let seq = 0;
  const files = new Map<string, BinarySource>();
  const assets: IntakeAssets = {
    prepare: async f => { const id = `source-${++seq}`; files.set(id, f); return { id, name: f.name, path: `blob:${id}`, sha256: f.name } as IntakeSource; },
    file: id => files.get(id)!, release: vi.fn(),
  };
  const waiting: { file: BinarySource; resolve: (candidate: A5Candidate) => void; reject: (error: Error) => void }[] = [];
  const extraction: A5ExtractionPort = { cancel: vi.fn(), extract: vi.fn(f => new Promise<A5Candidate>((resolve, reject) => { waiting.push({ file: f, resolve, reject }); })) };
  const publish = vi.fn(async () => ({ documentId: "confirmed-id" }));
  let existing: ExistingA5Vendor[] = [];
  const commands = createA5IntakeUseCases(store, assets, extraction, { existing: () => existing, publish });
  const finish = (index: number, name = `Vendor ${index}`) => waiting[index].resolve({ sha256: waiting[index].file.name, vendorName: name, values: { ...values }, sources: [], warnings: [] });
  return { store, commands, extraction, assets, waiting, finish, publish, setExisting: (v: ExistingA5Vendor[]) => { existing = v; } };
}
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };

describe("A5 intake orchestration", () => {
  it("limits concurrency, keeps upload order, and publishes only after each confirmation", async () => {
    const s = setup(); const id = await s.commands.start("proc", [1, 2, 3, 4, 5].map(n => file(`${n}.pdf`)));
    expect(s.waiting).toHaveLength(2); expect(s.publish).not.toHaveBeenCalled();
    s.finish(1); await flush(); expect(s.waiting).toHaveLength(3);
    s.finish(0); await flush(); s.finish(2); await flush(); s.finish(3); await flush(); s.finish(4); await flush();
    const batch = s.store.getSnapshot().batches[0];
    expect(batch.items.map(i => i.source.name)).toEqual(["1.pdf", "2.pdf", "3.pdf", "4.pdf", "5.pdf"]);
    expect(() => { batch.items[0].vendorName = "mutate"; }).toThrow();
    await s.commands.confirm(id, batch.items[0].id);
    expect(s.publish).toHaveBeenCalledTimes(1);
    await expect(s.commands.confirm(id, batch.items[0].id)).rejects.toThrow("belum siap");
    expect(s.store.getSnapshot().batches[0].items[1].phase).toBe("ready");
  });
  it("deduplicates bytes before extraction and ignores late results after cancellation", async () => {
    const s = setup(); const id = await s.commands.start("proc", [file("same.pdf"), file("same.pdf")]);
    expect(s.waiting).toHaveLength(0);
    const duplicate = s.commands.hashConflicts(id)[0];
    s.commands.skip(id, duplicate.items[1].id);
    expect(s.waiting).toHaveLength(1);
    expect(s.store.getSnapshot().batches[0].items[1].phase).toBe("skipped");
    s.commands.discard(id); s.finish(0); await flush();
    expect(s.store.getSnapshot().batches).toEqual([]); expect(s.publish).not.toHaveBeenCalled(); expect(s.extraction.cancel).toHaveBeenCalled();
  });
  it("retains successful drafts across a failed file and individual retry, rejects mismatched hashes", async () => {
    const s = setup(); const id = await s.commands.start("proc", [file("a.pdf"), file("b.pdf")]);
    s.finish(0); s.waiting[1].reject(new Error("Provider unavailable")); await flush();
    const [a, b] = s.store.getSnapshot().batches[0].items;
    s.commands.edit(id, a.id, { values: { ...values, hpj: "456" } });
    s.commands.retry(id, b.id); expect(s.waiting).toHaveLength(3);
    s.waiting[2].resolve({ sha256: "wrong", vendorName: "B", values, sources: [], warnings: [] }); await flush();
    expect(s.store.getSnapshot().batches[0].items[0].values.hpj).toBe("456");
    expect(s.store.getSnapshot().batches[0].items[1].error).toContain("tidak cocok");
  });
  it("requires conflict selection, rechecks stale targets, and blocks missing values/warnings", async () => {
    const s = setup(); const id = await s.commands.start("proc", [file("a.pdf"), file("b.pdf")]);
    s.finish(0, " PT Sama "); s.finish(1, "pt sama"); await flush();
    const [a, b] = s.store.getSnapshot().batches[0].items;
    expect(s.commands.conflicts(id)).toHaveLength(1); await expect(s.commands.confirm(id, a.id)).rejects.toThrow("konflik");
    s.commands.resolve(id, "pt sama", b.id); expect(s.store.getSnapshot().batches[0].items[0].phase).toBe("skipped");
    s.setExisting([{ id: "vendor", name: "PT Sama", document: { id: "old", name: "old.pdf", revision: 1 } }]);
    s.commands.resolve(id, "pt sama", b.id);
    s.setExisting([{ id: "vendor", name: "PT Sama", document: { id: "old", name: "old.pdf", revision: 2 } }]);
    await expect(s.commands.confirm(id, b.id)).rejects.toThrow("konflik"); expect(s.publish).not.toHaveBeenCalled();
    s.commands.resolve(id, "pt sama", b.id); s.commands.edit(id, b.id, { values: { ...values, hpb: "" } });
    await expect(s.commands.confirm(id, b.id)).rejects.toThrow("desimal");
  });
});
it("keeps missing fields empty, requires acknowledgement and clears it after corrections", async () => {
  const s = setup(); const id = await s.commands.start("proc", [file("a.pdf")]);
  s.waiting[0].resolve({ sha256: "a.pdf", vendorName: "", values: { ...values, hpb: "" }, sources: [], warnings: ["Periksa sumber"] }); await flush();
  const entry = s.store.getSnapshot().batches[0].items[0];
  expect(entry.values.hpb).toBe(""); expect(entry.vendorName).toBe("");
  await expect(s.commands.confirm(id, entry.id)).rejects.toThrow("Nama vendor");
  s.commands.edit(id, entry.id, { vendorName: "PT A", values });
  await expect(s.commands.confirm(id, entry.id)).rejects.toThrow("peringatan");
  s.commands.edit(id, entry.id, { acknowledged: true });
  s.commands.edit(id, entry.id, { values: { ...values, hpj: "99" } });
  expect(s.store.getSnapshot().batches[0].items[0].acknowledged).toBe(false);
  s.commands.edit(id, entry.id, { acknowledged: true }); await s.commands.confirm(id, entry.id); expect(s.publish).toHaveBeenCalledTimes(1);
});
