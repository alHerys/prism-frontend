import { useEffect, useRef, useState } from "react";
import { editableSpreadsheetFields } from "../../domain/spreadsheet";
import type { SpreadsheetField, SpreadsheetRow } from "../../domain/spreadsheet";
import { spreadsheetCellKey } from "../../application/spreadsheet-draft";
import type { SpreadsheetReviewModel } from "./useSpreadsheetReview";
import { SpreadsheetCell } from "./SpreadsheetCell";
import { spreadsheetRowLayout } from "./row-layout";
import type { KeyboardEvent } from "react";
import type { SpreadsheetProfile } from "./profiles";

interface Selection { rowId: string; field: SpreadsheetField; }
// Combined totals start in the material column for vertical keyboard navigation.
const verticalColumn: Record<SpreadsheetField, string> = { description: "description", material: "material", services: "services", combined: "material" };

export function SpreadsheetGrid({ model, profile, onLeaveGrid }: { model: SpreadsheetReviewModel; profile: SpreadsheetProfile; onLeaveGrid: () => void }) {
  const { rows } = model;
  const [selected, setSelected] = useState<Selection>();
  const [editing, setEditing] = useState<Selection & { before?: string }>();
  const nodes = useRef(new Map<string, HTMLTableCellElement>());
  const firstRow = rows.find(row => editableSpreadsheetFields(row).length > 0);
  const first = firstRow ? { rowId: firstRow.id, field: "description" as const } : undefined;
  const selection = selected && rows.some(row => row.id === selected.rowId) ? selected : first;
  const isSelected = (row: SpreadsheetRow, field: SpreadsheetField) => selection?.rowId === row.id && selection.field === field;
  const isEditing = (row: SpreadsheetRow, field: SpreadsheetField) => model.edit && !model.archived && editing?.rowId === row.id && editing.field === field;
  useEffect(() => { if (!model.edit) setEditing(undefined); }, [model.edit]);
  function focus(target: Selection) {
    setSelected(target);
    nodes.current.get(spreadsheetCellKey(target.rowId, target.field))?.focus({ preventScroll: true });
    nodes.current.get(spreadsheetCellKey(target.rowId, target.field))?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  useEffect(() => {
    if (!model.attention) return;
    const target = model.attention;
    // Wait for a leave dialog to release its focus trap before focusing the error.
    const timer = window.setTimeout(() => {
      setSelected(target); setEditing(target);
      nodes.current.get(spreadsheetCellKey(target.rowId, target.field))?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [model.attention]);
  function start(row: SpreadsheetRow, field: SpreadsheetField, initial?: string) {
    if (!model.edit || model.busy || model.archived) return;
    setSelected({ rowId: row.id, field });
    setEditing({ rowId: row.id, field, before: model.draft[spreadsheetCellKey(row.id, field)] });
    if (initial !== undefined) model.change(row.id, field, initial);
  }
  function move(row: SpreadsheetRow, field: SpreadsheetField, key: string, reverse: boolean) {
    const targets = rows.flatMap(r => editableSpreadsheetFields(r).map(f => ({ rowId: r.id, field: f })));
    const position = targets.findIndex(t => t.rowId === row.id && t.field === field);
    let target: Selection | undefined;
    if (["Tab", "ArrowLeft", "ArrowRight"].includes(key)) target = targets[position + (reverse || key === "ArrowLeft" ? -1 : 1)];
    else {
      const index = rows.findIndex(r => r.id === row.id);
      const step = reverse || key === "ArrowUp" ? -1 : 1;
      for (let i = index + step; i >= 0 && i < rows.length; i += step) {
        const next = editableSpreadsheetFields(rows[i]).find(f => verticalColumn[f] === verticalColumn[field]);
        if (next) { target = { rowId: rows[i].id, field: next }; break; }
      }
    }
    if (target) focus(target); else if (key === "Tab") onLeaveGrid();
  }
  function keyboard(event: KeyboardEvent<HTMLTableCellElement>, row: SpreadsheetRow, field: SpreadsheetField) {
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
  return <div className="oe-table-scroll" role="region" aria-label={`Spreadsheet ${profile.title}`} tabIndex={-1}>
    <table className="oe-spreadsheet" role="treegrid" aria-label={`Rincian ${profile.title}`} aria-readonly={!model.edit} aria-colcount={5} style={profile.tableStyle(model.baseline)}>
      <colgroup><col className="oe-col-no" /><col className="oe-col-marker" /><col className="oe-col-description" /><col className="oe-col-price" /><col className="oe-col-price" /></colgroup>
      <thead><tr><th rowSpan={2} className="oe-no" scope="col">No.</th><th rowSpan={2} colSpan={2} className="oe-description" scope="colgroup">Uraian Pekerjaan</th><th colSpan={2} scope="colgroup">Jumlah Harga</th></tr><tr><th scope="col">Material</th><th scope="col">Jasa</th></tr></thead>
      <tbody>{rows.map(row => {
        const layout = spreadsheetRowLayout(row);
        return <tr key={row.id} role="row" aria-level={row.level + 1} data-source-row={row.sourceRow} className={`oe-row oe-row-${row.kind.toLowerCase()}`} style={profile.rowStyle(row)}>
          <td className="oe-no" role="gridcell" aria-readonly="true" style={profile.cellStyle(row, "number")}><div className="oe-number"><span>{layout.mainNumber}</span></div></td>
          {layout.childMarker !== null && <td className="oe-marker" role="gridcell" aria-readonly="true" style={profile.cellStyle(row, "number")}>{layout.childMarker}</td>}
          {row.kind === "EMPTY" && <td colSpan={4} role="gridcell" aria-readonly="true" /> }
          {editableSpreadsheetFields(row).map(field => <SpreadsheetCell key={field} row={row} field={field} layout={layout} profile={profile} model={model} active={!!isEditing(row, field)} selected={!!isSelected(row, field)}
            register={node => { const key = spreadsheetCellKey(row.id, field); if (node) nodes.current.set(key, node); else nodes.current.delete(key); }}
            onSelect={() => setSelected({ rowId: row.id, field })} onStart={() => start(row, field)} onStop={() => setEditing(undefined)} onKeyDown={event => keyboard(event, row, field)} />)}
        </tr>;
      })}</tbody>
    </table>
    {!rows.length && <p className="oe-empty">Tidak ada baris sesuai pencarian.</p>}
  </div>;
}
