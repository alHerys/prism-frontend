import type { BinarySource } from "../../../shared/kernel/binary-source";
import { copy } from "../../../shared/kernel/validation";
import { emptyA5, intakeConflicts, intakeHashConflicts, unfinished, validateIntakeDraft } from "../domain/intake";
import type { IntakeBatch, IntakeItem } from "../domain/intake";
import type { A5Values } from "../domain/models";
import type { A5ExtractionPort, A5PublicationPort, IntakeAssets, IntakeStore } from "./intake-ports";
import type { ReviewWorkflow } from "./ports";

export function createA5IntakeUseCases(store: IntakeStore, assets: IntakeAssets, extraction: A5ExtractionPort, publication: A5PublicationPort, reviewWorkflow: ReviewWorkflow = "SEPARATE_CONFIRMATION") {
  let sequence = 0;
  let active = 0;
  const running = new Set<string>();
  const find = (id: string) => store.getSnapshot().batches.find(b => b.id === id);
  function update(id: string, change: (batch: IntakeBatch) => void) {
    const data = copy(store.getSnapshot());
    const batch = data.batches.find(b => b.id === id);
    if (!batch) return;
    change(batch);
    store.replace(data);
  }
  function item(id: string, itemId: string) {
    const value = find(id)?.items.find(i => i.id === itemId);
    if (!value) throw new Error("Unggahan tidak ditemukan. Unggah Form A5 kembali.");
    return value;
  }
  function change(id: string, itemId: string, patch: Partial<IntakeItem>) {
    update(id, batch => Object.assign(batch.items.find(i => i.id === itemId)!, patch));
  }
  function pump() {
    for (const batch of store.getSnapshot().batches) {
      for (const entry of batch.items) {
        if (active >= 2) return;
        if (entry.phase !== "queued" || running.has(entry.id) || intakeHashConflicts(batch).some(c => c.items.some(i => i.id === entry.id))) continue;
        running.add(entry.id); active++;
        change(batch.id, entry.id, { phase: "reading", error: undefined });
        void extraction.extract(assets.file(entry.source.id), entry.id).then(candidate => {
          if (find(batch.id)?.items.find(i => i.id === entry.id)?.phase !== "reading") return;
          if (candidate.sha256 !== entry.source.sha256) throw new Error("Berkas dan hasil ekstraksi tidak cocok. Coba lagi.");
          change(batch.id, entry.id, { candidate, vendorName: candidate.vendorName, values: copy(candidate.values), phase: "ready", acknowledged: false });
        }).catch(error => {
          if (find(batch.id)?.items.find(i => i.id === entry.id)?.phase === "reading") change(batch.id, entry.id, { phase: "failed", error: error instanceof Error ? error.message : "Ekstraksi gagal. Coba lagi." });
        }).finally(() => { active--; running.delete(entry.id); pump(); });
      }
    }
  }
  return {
    reviewWorkflow,
    start: async (procurementId: string, files: readonly BinarySource[]) => {
      const batch: IntakeBatch = { id: `intake-${++sequence}`, procurementId, items: [], rejected: [] };
      const existingHashes = publication.existing(procurementId).flatMap(v => v.document?.sha256 ? [v.document.sha256] : []);
      const hashes = new Set([...(reviewWorkflow === "SAVE_CONFIRMS" ? [] : existingHashes), ...store.getSnapshot().batches.filter(b => b.procurementId === procurementId).flatMap(b => b.items.filter(unfinished).map(i => i.source.sha256))]);
      for (const [index, file] of files.entries()) {
        if (index >= 10) { batch.rejected.push({ name: file.name, reason: "Maksimal 10 PDF per batch." }); continue; }
        try {
          const source = await assets.prepare(file);
          if (hashes.has(source.sha256)) { assets.release(source.id); batch.rejected.push({ name: file.name, reason: "PDF identik sudah ada. Dokumen ini tidak dikirim ulang." }); continue; }
          batch.items.push({ id: `intake-item-${++sequence}`, source, phase: "queued", vendorName: "", values: emptyA5(), acknowledged: false });
        } catch (error) { batch.rejected.push({ name: file.name, reason: error instanceof Error ? error.message : "PDF tidak dapat dibuka." }); }
      }
      store.replace({ batches: [...store.getSnapshot().batches, batch] });
      pump();
      return batch.id;
    },
    hashConflicts: (id: string) => { const batch = find(id); return batch ? intakeHashConflicts(batch) : []; },
    conflicts: (id: string) => { const batch = find(id); return batch ? intakeConflicts(batch, publication.existing(batch.procurementId)) : []; },
    edit: (id: string, itemId: string, patch: { vendorName?: string; values?: A5Values; percentInputs?: IntakeItem["percentInputs"]; acknowledged?: boolean }) => {
      const current = item(id, itemId);
      if (current.phase !== "ready" || current.publishing) return;
      change(id, itemId, { ...patch, ...(patch.vendorName !== undefined ? { target: undefined } : {}), ...(patch.vendorName !== undefined || patch.values ? { acknowledged: false } : {}) });
    },
    retry: (id: string, itemId: string) => {
      if (item(id, itemId).phase !== "failed" || running.has(itemId)) return;
      change(id, itemId, { phase: "queued", error: undefined }); pump();
    },
    skip: (id: string, itemId: string) => {
      const current = item(id, itemId);
      if (!unfinished(current) || current.publishing) return;
      change(id, itemId, { phase: "skipped" }); extraction.cancel(itemId); pump();
    },
    resolve: (id: string, key: string, selected: string) => {
      const batch = find(id);
      if (!batch) return;
      const hashConflict = intakeHashConflicts(batch).find(c => c.key === key);
      if (hashConflict) {
        if (!hashConflict.items.some(i => i.id === selected)) throw new Error("Pilih satu PDF identik.");
        update(id, current => { for (const entry of current.items) if (hashConflict.items.some(i => i.id === entry.id) && entry.id !== selected) entry.phase = "skipped"; });
        pump(); return;
      }
      const conflict = intakeConflicts(batch, publication.existing(batch.procurementId)).find(c => c.key === key);
      if (!conflict || !selected || (!conflict.items.some(i => i.id === selected) && selected !== conflict.existing?.id)) throw new Error("Pilihan konflik tidak valid.");
      for (const entry of conflict.items) {
        if (entry.id !== selected) change(id, entry.id, { phase: "skipped" });
        else change(id, entry.id, { target: conflict.existing ? copy(conflict.existing) : undefined, error: undefined });
      }
    },
    confirm: async (id: string, itemId: string) => {
      const batch = find(id)!;
      const entry = item(id, itemId);
      if (entry.phase !== "ready" || entry.publishing) throw new Error("Dokumen belum siap dikonfirmasi.");
      if (intakeHashConflicts(batch).length) throw new Error("Pilih satu PDF identik sebelum konfirmasi.");
      if (batch.items.some(i => i.phase === "queued" || i.phase === "reading")) throw new Error("Tunggu pembacaan batch selesai sebelum konfirmasi.");
      if (intakeConflicts(batch, publication.existing(batch.procurementId)).some(c => c.items.some(i => i.id === itemId))) throw new Error("Selesaikan konflik dokumen sebelum konfirmasi.");
      const reviewed = reviewWorkflow === "SAVE_CONFIRMS" ? { ...entry, acknowledged: true } : entry;
      validateIntakeDraft(reviewed);
      change(id, itemId, { publishing: true, error: undefined });
      try {
        const result = await publication.publish(batch.procurementId, copy(reviewed));
        change(id, itemId, { phase: "confirmed", documentId: result.documentId, publishing: false });
      } catch (error) {
        change(id, itemId, { publishing: false, error: error instanceof Error ? error.message : "Konfirmasi gagal." }); throw error;
      }
    },
    discard: (id: string) => {
      const batch = find(id);
      if (!batch || batch.items.some(i => i.publishing)) return;
      store.replace({ batches: store.getSnapshot().batches.filter(b => b.id !== id) });
      for (const entry of batch.items) { extraction.cancel(entry.id); if (entry.phase !== "confirmed") assets.release(entry.source.id); }
    },
  };
}
export type A5IntakeUseCases = ReturnType<typeof createA5IntakeUseCases>;
