import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { UploadSimple } from "@phosphor-icons/react/dist/csr/UploadSimple";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { Modal } from "../../../shared/ui/modal";
import { UploadZone } from "../../../shared/ui/upload-zone";
import { useA5IntakeCommands, useA5IntakeData } from "./binding";
import "./a5-intake.css";

export function A5DropArea({ procurementId, onManualAdd, children }: { procurementId: string; onManualAdd: () => void; children: (addButton: ReactNode, emptyUpload: ReactNode) => ReactNode }) {
  const commands = useA5IntakeCommands();
  const data = useA5IntakeData();
  const navigate = useNavigate();
  const depth = useRef(0);
  const starting = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [open, setOpen] = useState(false);
  const pending = data.batches.find(b => b.procurementId === procurementId);
  async function start(files: File[]) {
    if (!files.length || starting.current) return;
    starting.current = true; setBusy(true); setFailure("");
    try { const id = await commands.start(procurementId, files); navigate(`/pengadaan/${procurementId}/impor-a5/${id}`); }
    catch (error) { setFailure(error instanceof Error ? error.message : "Unggahan belum dapat dimulai."); }
    finally { starting.current = false; setBusy(false); }
  }
  const button = <button type="button" className="btn primary" disabled={busy} onClick={() => { setFailure(""); setOpen(true); }}><Plus size={18} aria-hidden="true" />{busy ? "Menyiapkan PDF…" : "Tambah vendor"}</button>;
  const empty = <div className="a5-intake-empty"><UploadSimple size={30} aria-hidden="true" /><h3>Tambahkan vendor melalui Form A5</h3><p>Tarik beberapa PDF ke sini atau gunakan tombol Tambah vendor.</p><small>PDF · maks. 10 berkas · 10 MiB per berkas</small></div>;
  return <><section className={`panel stage-vendors a5-drop-area${dragging ? " dragging" : ""}`} aria-label="Identitas dan vendor"
    onDragEnter={event => { if (!event.dataTransfer.types.includes("Files")) return; event.preventDefault(); depth.current++; setDragging(true); }}
    onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }}
    onDragLeave={event => { event.preventDefault(); depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); }}
    onDrop={event => { event.preventDefault(); depth.current = 0; setDragging(false); void start([...event.dataTransfer.files]); }}>
    {children(button, empty)}
    {pending && <button className="btn small a5-resume" onClick={() => navigate(`/pengadaan/${procurementId}/impor-a5/${pending.id}`)}>Lanjutkan review unggahan</button>}
    {failure && !open && <p role="alert" className="alert error">{failure}</p>}
    {dragging && <div className="a5-drop-overlay"><UploadSimple size={36} aria-hidden="true" /><strong>Lepas Form A5 untuk menambahkan vendor</strong><span>Nama dan nilai akan diperiksa sebelum ditambahkan.</span></div>}
  </section>
    <Modal className="a5-upload-dialog" open={open} onOpenChange={value => { if (!busy) setOpen(value); }} title="Tambah vendor" description="Unggah satu atau beberapa PDF Form A5. Setiap file mewakili satu vendor.">
      <button type="button" className="icon-button a5-dialog-close" aria-label="Tutup unggahan vendor" disabled={busy} onClick={() => setOpen(false)}><X size={22} aria-hidden="true" /></button>
      <UploadZone ariaLabel="Pilih Form A5 vendor" accept="application/pdf,.pdf" multiple disabled={busy} onFiles={files => void start(files)}>
        <p><strong>{busy ? "Menyiapkan PDF…" : "Tarik Form A5 ke sini atau pilih berkas"}</strong></p>
        <small>Maks. 10 PDF sekaligus · 10 MiB per file</small>
      </UploadZone>
      {failure && <p role="alert" className="alert error">{failure}</p>}
      <button type="button" className="btn quiet small a5-manual-add" disabled={busy} onClick={() => { setOpen(false); onManualAdd(); }}>Isi nama vendor secara manual</button>
    </Modal>
  </>;
}
