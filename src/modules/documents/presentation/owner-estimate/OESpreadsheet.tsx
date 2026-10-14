import { useEffect, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { editableOEFields } from "../../domain/owner-estimate";
import type { OEField, OERow } from "../../domain/owner-estimate";
import { oeCellKey } from "../../application/oe-review-draft";
import type { OEReviewModel } from "./useOEReview";
import { OECell } from "./OECell";
import type { KeyboardEvent } from "react";

interface Selection { rowId: string; field: OEField; }
const column: Record<OEField, number> = { description: 1, material: 2, services: 3, combined: 2 };

export function OESpreadsheet({ model, onLeaveGrid }: { model: OEReviewModel; onLeaveGrid: () => void }) {
  const { rows } = model;
  const [selected, setSelected] = useState<Selection>();
  const [editing, setEditing] = useState<Selection & { before?: string }>();
  const nodes = useRef(new Map<string, HTMLTableCellElement>());
  const first = rows[0] ? { rowId: rows[0].id, field: "description" as const } : undefined;
  const selection = selected && rows.some(row => row.id === selected.rowId) ? selected : first;
  const isSelected = (row: OERow, field: OEField) => selection?.rowId === row.id && selection.field === field;
  const isEditing = (row: OERow, field: OEField) => model.edit && !model.archived && editing?.rowId === row.id && editing.field === field;
  useEffect(() => { if (!model.edit) setEditing(undefined); }, [model.edit]);
  function focus(target: Selection) {
    setSelected(target);
    nodes.current.get(oeCellKey(target.rowId, target.field))?.focus({ preventScroll: true });
    nodes.current.get(oeCellKey(target.rowId, target.field))?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  useEffect(() => {
    if (!model.attention) return;
    const target = model.attention;
    // Wait for a leave dialog to release its focus trap before focusing the error.
    const timer = window.setTimeout(() => {
      setSelected(target); setEditing(target);
      nodes.current.get(oeCellKey(target.rowId, target.field))?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [model.attention]);
  function start(row: OERow, field: OEField, initial?: string) {
    if (!model.edit || model.busy || model.archived) return;
    setSelected({ rowId: row.id, field });
    setEditing({ rowId: row.id, field, before: model.draft[oeCellKey(row.id, field)] });
    if (initial !== undefined) model.change(row.id, field, initial);
  }
  function move(row: OERow, field: OEField, key: string, reverse: boolean) {
    const targets = rows.flatMap(r => editableOEFields(r).map(f => ({ rowId: r.id, field: f })));
    const position = targets.findIndex(t => t.rowId === row.id && t.field === field);
    let target: Selection | undefined;
    if (["Tab", "ArrowLeft", "ArrowRight"].includes(key)) target = targets[position + (reverse || key === "ArrowLeft" ? -1 : 1)];
    else {
      const index = rows.findIndex(r => r.id === row.id);
      const step = reverse || key === "ArrowUp" ? -1 : 1;
      for (let i = index + step; i >= 0 && i < rows.length; i += step) {
        const next = editableOEFields(rows[i]).find(f => column[f] === column[field]);
        if (next) { target = { rowId: rows[i].id, field: next }; break; }
      }
    }
    if (target) focus(target); else if (key === "Tab") onLeaveGrid();
  }
  function keyboard(event: KeyboardEvent<HTMLTableCellElement>, row: OERow, field: OEField) {
    if (model.busy || event.target instanceof HTMLButtonElement) return;
    const active = isEditing(row, field);
    if (active && event.key === "Escape") {
      event.preventDefault(); model.change(row.id, field, editing?.before); setEditing(undefined); focus({ rowId: row.id, field });
    } else if (active && ["Tab", "Enter"].includes(event.key) && !(event.altKey && field === "description")) {
      event.preventDefault(); setEditing(undefined); move(row, field, event.key, event.shiftKey);
    } else if (!active && ["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault(); move(row, field, event.key, event.shiftKey);
    } else if (!active && model.edit && ["Enter", "F2"].includes(event.key)) {
      event.preventDefault(); start(row, field);
    } else if (!active && model.edit && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); start(row, field, event.key);
    }
  }
  return <div className="oe-table-scroll" role="region" aria-label="Spreadsheet Owner Estimate" tabIndex={-1}>
    <table className="oe-spreadsheet" role="treegrid" aria-label="Rincian Owner Estimate" aria-readonly={!model.edit} aria-colcount={4}>
      <colgroup><col className="oe-col-no" /><col className="oe-col-description" /><col className="oe-col-price" /><col className="oe-col-price" /></colgroup>
      <thead><tr><th rowSpan={2} className="oe-no" scope="col">No.</th><th rowSpan={2} className="oe-description" scope="col">Uraian Pekerjaan</th><th colSpan={2} scope="colgroup">Jumlah Harga</th></tr><tr><th scope="col">Material</th><th scope="col">Jasa</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id} role="row" aria-level={row.level + 1} aria-expanded={model.children.has(row.id) ? !model.collapsed.has(row.id) || !!model.query.trim() : undefined} data-source-row={row.sourceRow} className={`oe-row oe-row-${row.kind.toLowerCase()}`}>
        <td className="oe-no" role="gridcell"><div className="oe-number">{model.children.has(row.id) && <button type="button" className="oe-expand" disabled={!!model.query.trim()} aria-label={`${model.collapsed.has(row.id) ? "Buka" : "Tutup"} ${row.description}`} aria-expanded={!model.collapsed.has(row.id)} onClick={() => { setEditing(undefined); model.toggle(row.id); }}>{model.collapsed.has(row.id) ? <CaretRight size={16} aria-hidden="true" /> : <CaretDown size={16} aria-hidden="true" />}</button>}<span>{row.number}</span></div></td>
        {editableOEFields(row).map(field => <OECell key={field} row={row} field={field} model={model} active={!!isEditing(row, field)} selected={!!isSelected(row, field)}
          register={node => { const key = oeCellKey(row.id, field); if (node) nodes.current.set(key, node); else nodes.current.delete(key); }}
          onSelect={() => setSelected({ rowId: row.id, field })} onStart={() => start(row, field)} onStop={() => setEditing(undefined)} onKeyDown={event => keyboard(event, row, field)} />)}
      </tr>)}</tbody>
    </table>
    {!rows.length && <p className="oe-empty">Tidak ada baris sesuai pencarian.</p>}
  </div>;
}
