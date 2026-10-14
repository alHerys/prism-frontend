import { useEffect, useRef } from "react";
import type { OEField, OERow } from "../../domain/owner-estimate";
import { parseOEMoney } from "../../domain/owner-estimate";
import { oeCellInput, oeCellKey } from "../../application/oe-review-draft";
import { exactMoney } from "../../../../shared/formatting/display";
import type { OEReviewModel } from "./useOEReview";
import type { ChangeEvent, KeyboardEvent } from "react";

const labels: Record<OEField, string> = { description: "Uraian Pekerjaan", material: "Jumlah Harga Material", services: "Jumlah Harga Jasa", combined: "Jumlah Harga Gabungan" };
export function OECell({ row, field, model, active, selected, onSelect, onStart, onKeyDown, onStop, register }: {
  row: OERow; field: OEField; model: OEReviewModel; active: boolean; selected: boolean;
  onSelect: () => void; onStart: () => void; onStop: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => void;
  register: (node: HTMLTableCellElement | null) => void;
}) {
  const key = oeCellKey(row.id, field);
  const raw = model.draft[key] ?? oeCellInput(row, field);
  const issue = model.issues.find(issue => issue.rowId === row.id && issue.field === field);
  const input = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => { if (active) { input.current?.focus(); input.current?.select(); } }, [active]);
  const amount = field === "description" ? undefined : row[field];
  let display = raw;
  if (field !== "description") {
    try { const value = parseOEMoney(raw); display = value === null ? "" : exactMoney(value); } catch { /* Keep the invalid draft visible until corrected. */ }
  }
  const errorId = `oe-error-${row.sourceRow}-${field}`;
  const accessible = `${labels[field]} ${row.number || `baris ${row.sourceRow}`}`;
  const inputProps = { "aria-label": accessible, "aria-invalid": !!issue, "aria-describedby": issue ? errorId : undefined,
    value: raw, disabled: model.busy, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => model.change(row.id, field, event.target.value), onBlur: onStop };
  return <td role="gridcell" ref={register} tabIndex={selected ? 0 : -1} aria-selected={model.edit && selected} aria-readonly={!model.edit}
    className={`oe-cell oe-${field}${model.changed.has(key) ? " is-changed" : ""}${issue ? " has-issue" : ""}`}
    data-field={field} data-changed={model.changed.has(key) || undefined} colSpan={field === "combined" ? 2 : field === "description" && row.scope === "NONE" ? 3 : undefined}
    onClick={onSelect} onDoubleClick={() => { if (model.edit && !model.busy) onStart(); }} onKeyDown={onKeyDown}>
    {active ? <div className="oe-cell-editor">
      {field === "description" ? <textarea ref={node => { input.current = node; }} {...inputProps} rows={2} /> : <input ref={node => { input.current = node; }} {...inputProps} inputMode="decimal" autoComplete="off" />}
      {amount?.state === "UNAVAILABLE" && <button type="button" className="inline-link" onMouseDown={event => event.preventDefault()} onClick={() => { model.change(row.id, field, ""); onStop(); }}>Tandai kosong</button>}
      {issue && <span className="oe-cell-error" id={errorId}>{issue.message}</span>}
    </div> : <span className="oe-cell-content" style={field === "description" ? { paddingInlineStart: `${row.level * 18}px` } : undefined}>
      {display || (issue ? <span className="oe-unavailable">Belum tersedia</span> : "")}
    </span>}
  </td>;
}
