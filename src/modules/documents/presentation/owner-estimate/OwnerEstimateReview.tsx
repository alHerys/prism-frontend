import { useRef } from "react";
import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { PencilSimple } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { Link } from "react-router";
import { useDocumentsCommands } from "../binding";
import { useOEReview } from "./useOEReview";
import { OESpreadsheet } from "./OESpreadsheet";
import type { DocumentRecord } from "../../domain/models";
import { Modal } from "../../../../shared/ui/modal";
import { Status } from "../../../../shared/ui/status";
import "../../../../shared/styles/focus.css";
import "./owner-estimate-review.css";

export function OwnerEstimateReview({ document }: { document: DocumentRecord }) {
  const model = useOEReview(document);
  const commands = useDocumentsCommands();
  const source = commands.availableSources().find(source => source.id === document.sourceId);
  const exitButton = useRef<HTMLButtonElement>(null);
  const saveButton = useRef<HTMLButtonElement>(null);
  return <div className="focus-shell fernly-review oe-review" onKeyDown={event => {
    if (model.edit && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); if (model.dirty) void model.save(); }
  }}>
    <header className="oe-review-header">
      <button type="button" className="icon-button review-back" aria-label="Kembali ke pengadaan" disabled={model.busy} onClick={() => model.requestExit("back")}><ArrowLeft size={24} aria-hidden="true" /></button>
      <div className="oe-review-title"><h1>Owner Estimate</h1><p>{document.name}</p></div>
      <div className="oe-review-actions">
        <span className="oe-mode">{model.edit ? "Mode Edit" : "Mode Lihat"}</span>
        <Status value={document.status} />
        {model.edit && model.dirty && <button ref={saveButton} type="button" className="btn primary" disabled={model.busy || model.archived} onClick={() => void model.save()}>{model.busy ? "Menyimpan…" : "Simpan Perubahan"}</button>}
        {!model.edit && document.status !== "CONFIRMED" && model.baseline && !model.archived && <button ref={saveButton} type="button" className="btn primary" disabled={model.busy} onClick={() => void model.save()}>{model.busy ? "Menyimpan…" : "Konfirmasi Data"}</button>}
        {model.edit ? <button ref={exitButton} type="button" className="btn" disabled={model.busy} onClick={() => model.requestExit("mode")}>Keluar Mode Edit</button>
          : <button ref={exitButton} type="button" className="icon-button oe-edit-button" aria-label="Edit OE" title="Edit OE" disabled={!model.baseline || model.archived || model.busy} onClick={model.enterEdit}><PencilSimple size={23} aria-hidden="true" /></button>}
      </div>
    </header>
    <main className="oe-review-main" aria-busy={model.busy}>
      {model.archived && <div className="alert">OE ini telah {document.removedAt ? "dihapus" : "diganti"}. Data ditampilkan sebagai arsip dan tidak dapat diedit.</div>}
      {model.baseline ? <>
        <div className="oe-toolbar">
          <label className="oe-search"><MagnifyingGlass size={18} aria-hidden="true" /><input aria-label="Cari nomor atau uraian pekerjaan" placeholder="Cari nomor atau uraian pekerjaan…" value={model.query} onChange={event => model.setQuery(event.target.value)} />{model.query && <button type="button" className="icon-button" aria-label="Hapus pencarian OE" onClick={() => model.setQuery("")}><X size={16} aria-hidden="true" /></button>}</label>
          <div className="oe-tree-actions"><button type="button" className="btn small" disabled={!!model.query.trim()} onClick={() => model.setCollapsed(new Set())}>Buka Semua</button><button type="button" className="btn small" disabled={!!model.query.trim()} onClick={() => model.setCollapsed(new Set(model.children))}>Tutup Semua</button></div>
          <span className="oe-table-meta">{model.baseline.name} · {model.baseline.rows.length} baris</span>
        </div>
        {document.warnings.length > 0 && <div className="oe-source-warning">{document.warnings.map(warning => <p key={warning}>{warning}</p>)}{!model.archived && <label><input type="checkbox" checked={model.ack} disabled={model.busy} onChange={event => model.setAck(event.target.checked)} /> Saya telah memeriksa peringatan sumber OE.</label>}</div>}
        {model.failure && !model.dialogOpen && <div className="alert error" role="alert">{model.failure}</div>}
        <OESpreadsheet model={model} onLeaveGrid={() => (saveButton.current ?? exitButton.current)?.focus()} />
        <footer className="oe-review-footer"><span>Subtotal dan total mengikuti nilai dokumen. Periksa kembali setelah mengubah rincian.</span>{source && <a href={source.path} download={document.name}>Buka berkas asli</a>}</footer>
      </> : <div className="oe-missing"><h2>Data Jumlah Harga belum tersedia</h2><p>Dokumen lama hanya memiliki harga satuan. Unggah ulang XLSX OE untuk membaca struktur lengkap.</p><Link className="btn" to={`/pengadaan/${document.procurementId}?tab=ringkasan`}>Kembali ke dokumen OE</Link></div>}
    </main>
    <Modal open={model.dialogOpen} onOpenChange={open => { if (!open && !model.busy) model.continueEditing(); }} title="Perubahan belum disimpan" description="Simpan sekaligus konfirmasi OE, buang perubahan, atau lanjut mengedit.">
      {model.failure && <div className="alert error" role="alert">{model.failure}</div>}
      <div className="modal-actions oe-leave-actions">
        <button type="button" className="btn primary" disabled={model.busy || model.archived} onClick={() => void model.save(true)}>{model.busy ? "Menyimpan…" : "Simpan Perubahan"}</button>
        <button type="button" className="btn danger" disabled={model.busy} onClick={model.discard}>Buang Perubahan</button>
        <button type="button" className="btn" disabled={model.busy} onClick={model.continueEditing}>Lanjut Mengedit</button>
      </div>
    </Modal>
  </div>;
}
