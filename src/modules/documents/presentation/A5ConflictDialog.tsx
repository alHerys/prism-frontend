import { useState } from "react";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { Modal } from "../../../shared/ui/modal";
import type { IntakeConflict } from "../domain/intake";

export function A5ConflictDialog({ open, conflicts, onClose, onResolve }: {
  open: boolean; conflicts: IntakeConflict[]; onClose: () => void; onResolve: (key: string, selected: string) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  return <Modal open={open && conflicts.length > 0} onOpenChange={value => { if (!value) onClose(); }} className="a5-conflict-dialog" title="Pilih Form A5 yang digunakan" description="Ada dokumen untuk vendor yang sama. Pilih satu sebelum konfirmasi.">
    <button className="icon-button a5-dialog-close" aria-label="Tutup konflik" onClick={onClose}><X size={20} aria-hidden="true" /></button>
    <div className="a5-conflict-groups">{conflicts.map(conflict => <fieldset key={conflict.key}><legend>{conflict.name}</legend>
      {conflict.existing?.document && <label className="a5-conflict-option"><input type="radio" name={`conflict-${conflict.key}`} checked={selected[conflict.key] === conflict.existing.id} onChange={() => setSelected(s => ({ ...s, [conflict.key]: conflict.existing!.id }))} /><span><strong>{conflict.existing.document.name}</strong><small>Dokumen lama · tetap digunakan</small></span></label>}
      {conflict.items.map(item => <label className="a5-conflict-option" key={item.id}><input type="radio" name={`conflict-${conflict.key}`} checked={selected[conflict.key] === item.id} onChange={() => setSelected(s => ({ ...s, [conflict.key]: item.id }))} /><span><strong>{item.source.name}</strong><small>Unggahan baru{conflict.existing?.document ? " · mengganti setelah konfirmasi" : ""}</small></span></label>)}
    </fieldset>)}</div>
    <div className="modal-actions"><button className="btn primary" disabled={conflicts.some(c => !selected[c.key] || (!c.items.some(i => i.id === selected[c.key]) && selected[c.key] !== c.existing?.id))} onClick={() => { for (const c of conflicts) onResolve(c.key, selected[c.key]); onClose(); }}>Gunakan pilihan</button></div>
  </Modal>;
}
