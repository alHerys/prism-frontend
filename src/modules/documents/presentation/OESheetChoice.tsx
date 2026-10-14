import { useState } from "react";
import type { PreparedOE } from "../application/owner-estimate-ports";

export function OESheetChoice({ choice, busy, onChoose, onCancel }: { choice: PreparedOE; busy: boolean; onChoose: (id: string) => Promise<void>; onCancel: () => void }) {
  const [sheet, setSheet] = useState("");
  return <div className="field">
    <label htmlFor="oe-sheet-choice">Pilih tabel detail dari {choice.name}</label>
    <select id="oe-sheet-choice" disabled={busy} value={sheet} onChange={event => setSheet(event.target.value)}>
      <option value="">Pilih tabel</option>
      {choice.sheets.map(s => <option key={s.id} value={s.id}>{s.name} · {s.rows} baris</option>)}
    </select>
    <div className="modal-actions"><button className="btn" disabled={busy} onClick={onCancel}>Batal</button><button className="btn primary" disabled={busy || !sheet} onClick={() => void onChoose(sheet)}>{busy ? "Menyiapkan OE…" : "Gunakan Tabel"}</button></div>
  </div>;
}
