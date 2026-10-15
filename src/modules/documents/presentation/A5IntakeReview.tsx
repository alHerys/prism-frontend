import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { Modal } from "../../../shared/ui/modal";
import { EmptyState } from "../../../shared/ui/empty-state";
import { unfinished, validateIntakeDraft } from "../domain/intake";
import { useA5IntakeCommands, useA5IntakeData } from "./binding";
import { A5ReviewLayout } from "./A5ReviewLayout";
import { A5IntakeEditor } from "./A5IntakeEditor";
import { A5ConflictDialog } from "./A5ConflictDialog";
import { useUnsavedReview } from "./useUnsavedReview";
import "./a5-intake.css";

const phaseLabels = { queued: "Menunggu", reading: "Membaca", ready: "Perlu diperiksa", failed: "Gagal", skipped: "Dilewati", confirmed: "Terkonfirmasi" };
export function A5IntakeReview() {
  const { id = "", batchId = "" } = useParams();
  const commands = useA5IntakeCommands();
  const saveConfirms = commands.reviewWorkflow === "SAVE_CONFIRMS";
  const data = useA5IntakeData();
  const batch = data.batches.find(b => b.id === batchId && b.procurementId === id);
  const navigate = useNavigate();
  const [activeId, setActive] = useState("");
  const [hashOpen, setHashOpen] = useState(true);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [rejectedOpen, setRejectedOpen] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [leave, setLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const autoChecked = useRef("");
  const pending = batch?.items.some(i => i.phase === "queued" || i.phase === "reading") ?? false;
  const hashConflicts = commands.hashConflicts(batchId);
  const conflicts = commands.conflicts(batchId);
  const extractionSignature = batch?.items.map(i => `${i.id}:${i.candidate?.vendorName ?? i.phase}`).join("|") ?? "";
  const conflictFingerprint = conflicts.map(c => c.key).join("|");
  const unresolved = batch?.items.some(unfinished) ?? false;
  const publishing = batch?.items.some(i => i.publishing) ?? false;
  const blocker = useUnsavedReview(unresolved && !leaving);
  const active = batch?.items.find(i => i.id === activeId) ?? batch?.items[0];
  const tabs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pending || autoChecked.current === extractionSignature || !batch || (rejectedOpen && batch.rejected.length > 0)) return;
    autoChecked.current = extractionSignature;
    if (conflictFingerprint) setConflictOpen(true);
  }, [pending, batch, conflictFingerprint, rejectedOpen, extractionSignature]);
  useEffect(() => { tabs.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [active?.id]);
  function exit() {
    if (publishing) return;
    setLeaving(true); commands.discard(batchId);
    if (blocker.state === "blocked") blocker.proceed();
    else setTimeout(() => navigate(`/pengadaan/${id}?tab=ringkasan`), 0);
  }
  function back() { if (unresolved) setLeave(true); else exit(); }
  function requestConfirm() {
    if (!active) return;
    setError("");
    if (conflicts.some(c => c.items.some(i => i.id === active.id))) { setConflictOpen(true); return; }
    try { validateIntakeDraft(saveConfirms ? { ...active, acknowledged: true } : active); if (saveConfirms) void confirmActive(); else setConfirm(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Periksa data kembali."); }
  }
  async function confirmActive() {
    if (!active) return;
    try {
      await commands.confirm(batchId, active.id); setConfirm(false); setError("");
      const next = data.batches.find(b => b.id === batchId)?.items.find(i => i.id !== active.id && unfinished(i));
      if (next) setActive(next.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Konfirmasi gagal."); setConfirm(false); if (commands.conflicts(batchId).length) setConflictOpen(true); }
  }
  if (!batch) return <div className="page"><EmptyState title="Unggahan sesi tidak ditemukan">Data sementara hilang setelah refresh. <Link to="/pengadaan">Kembali ke daftar pengadaan untuk mengunggah ulang.</Link></EmptyState></div>;
  return <div className="focus-shell fernly-review a5-review a5-intake-review">
    <A5ReviewLayout name={active?.source.name ?? "Unggah Form A5"} busy={publishing} onBack={back}
      actions={<button className="btn small" disabled={publishing} onClick={back}>Selesai</button>}
      tabs={<><div className="a5-batch-tabs" role="tablist" aria-label="Form A5 unggahan" ref={tabs}>{batch.items.map((item, index) => {
        const conflict = [...conflicts, ...hashConflicts].some(c => c.items.some(i => i.id === item.id));
        return <button key={item.id} role="tab" id={`tab-${item.id}`} aria-selected={active?.id === item.id} aria-controls={`panel-${item.id}`} tabIndex={active?.id === item.id ? 0 : -1} title={item.source.name} onClick={() => { setActive(item.id); setError(""); }} onKeyDown={e => {
          const nextIndex = e.key === "ArrowRight" ? (index + 1) % batch.items.length : e.key === "ArrowLeft" ? (index - 1 + batch.items.length) % batch.items.length : e.key === "Home" ? 0 : e.key === "End" ? batch.items.length - 1 : -1;
          if (nextIndex < 0) return; e.preventDefault(); setActive(batch.items[nextIndex].id); setError(""); tabs.current?.querySelector<HTMLButtonElement>(`#tab-${batch.items[nextIndex].id}`)?.focus();
        }}><strong>{item.vendorName || item.source.name}</strong><span className={`a5-tab-status ${conflict ? "conflict" : item.phase}`}>{conflict ? "Konflik" : saveConfirms && item.phase === "confirmed" ? "Tersimpan" : phaseLabels[item.phase]}</span></button>;
      })}</div>{batch.items.filter(i => i.id !== active?.id).map(i => <div key={i.id} id={`panel-${i.id}`} role="tabpanel" aria-labelledby={`tab-${i.id}`} hidden />)}</>}
      source={active ? <section id={`panel-${active.id}`} role="tabpanel" aria-labelledby={`tab-${active.id}`} className="review-source"><embed key={active.id} className="review-pdf-preview" src={active.source.path} type="application/pdf" title={`Preview PDF ${active.source.name}`} /></section> : <div className="a5-no-files"><h2>Tidak ada PDF yang dapat diproses</h2><p>Periksa jenis berkas dan batas ukuran, lalu unggah kembali.</p><button className="btn" onClick={exit}>Kembali ke pengadaan</button></div>}
      editor={active ? <A5IntakeEditor key={active.id} item={active} batchId={batchId} commands={commands} pending={pending} conflict={[...conflicts, ...hashConflicts].some(c => c.items.some(i => i.id === active.id))} onConflict={() => { if (hashConflicts.some(c => c.items.some(i => i.id === active.id))) setHashOpen(true); else setConflictOpen(true); }} onConfirm={requestConfirm} error={error} /> : <div className="panel review-editor"><h2>Berkas tidak diproses</h2>{batch.rejected.map((r, i) => <p key={i}>{r.name}: {r.reason}</p>)}</div>} />
    <A5ConflictDialog open={hashOpen && !(rejectedOpen && batch.rejected.length > 0)} conflicts={hashConflicts} onClose={() => setHashOpen(false)} onResolve={(key, selection) => commands.resolve(batchId, key, selection)} />
    <A5ConflictDialog open={conflictOpen && !pending} conflicts={conflicts} onClose={() => setConflictOpen(false)} onResolve={(key, selection) => commands.resolve(batchId, key, selection)} />
    <Modal open={rejectedOpen && batch.rejected.length > 0} onOpenChange={setRejectedOpen} title="Berkas tidak diproses" description="Berkas valid tetap dapat diperiksa."><button className="icon-button a5-dialog-close" aria-label="Tutup informasi berkas" onClick={() => setRejectedOpen(false)}><X size={20} aria-hidden="true" /></button><ul className="a5-rejected-files">{batch.rejected.map((r, i) => <li key={i}><strong>{r.name}</strong><p>{r.reason}</p></li>)}</ul></Modal>
    <Modal open={confirm} onOpenChange={value => { if (!publishing) setConfirm(value); }} title="Konfirmasi vendor & data" description={active?.target?.document ? `A5 ${active.vendorName} akan mengganti dokumen lama.` : active?.target ? `Form A5 untuk ${active.target.name} akan ditambahkan.` : `Vendor ${active?.vendorName ?? ""} dan nilai Form A5 akan ditambahkan.`}><div className="modal-actions"><button className="btn" disabled={publishing} onClick={() => setConfirm(false)}>Kembali memeriksa</button><button className="btn primary" disabled={publishing} onClick={() => void confirmActive()}>{publishing ? "Mengonfirmasi…" : "Konfirmasi"}</button></div></Modal>
    <Modal open={leave || blocker.state === "blocked"} onOpenChange={value => { if (!value) { setLeave(false); if (blocker.state === "blocked") blocker.reset(); } }} title="Review belum selesai" description="Kandidat tersisa akan dibuang. Vendor terkonfirmasi tetap ada dalam sesi."><button className="icon-button a5-dialog-close" aria-label="Kembali memeriksa" onClick={() => { setLeave(false); if (blocker.state === "blocked") blocker.reset(); }}><X size={20} aria-hidden="true" /></button><div className="modal-actions"><button className="btn danger" disabled={publishing} onClick={exit}><Trash aria-hidden="true" />Buang kandidat tersisa</button></div></Modal>
  </div>;
}
