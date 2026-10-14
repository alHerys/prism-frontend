import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker } from "react-router";
import type { DocumentRecord } from "../../domain/models";
import type { SpreadsheetEdit } from "../../domain/spreadsheet";
import type { SpreadsheetField, SpreadsheetSheet } from "../../domain/spreadsheet";
import { spreadsheetCellKey, reviewSpreadsheetDraft, visibleSpreadsheetRows } from "../../application/spreadsheet-draft";
import type { SpreadsheetDraft } from "../../application/spreadsheet-draft";
import { useToast } from "../../../../shared/ui/toast-provider";

interface SpreadsheetReviewOptions {
  document: DocumentRecord;
  stored: SpreadsheetSheet | undefined;
  warnings: string[];
  acknowledged: boolean;
  save: (input: { documentId: string; expectedRevision: number; edits: SpreadsheetEdit[]; acknowledged: boolean }) => Promise<unknown>;
  onBack: () => void;
  successMessage: string;
}
export function useSpreadsheetReview({ document, stored, warnings, acknowledged, save: persist, onBack, successMessage }: SpreadsheetReviewOptions) {
  const toast = useToast();
  const [editingSource, setEditingSource] = useState<{ sheet: SpreadsheetSheet; revision: number }>();
  const baseline = editingSource?.sheet ?? stored;
  const archived = !!(document.removedAt || document.supersededBy);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<SpreadsheetDraft>({});
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [ack, setAck] = useState(acknowledged);
  const [exit, setExit] = useState<"back" | "mode" | (() => void)>();
  const [attention, setAttention] = useState<{ rowId: string; field: SpreadsheetField; token: number; before?: string }>();
  const lock = useRef(false);
  const mounted = useRef(true);
  const afterClean = useRef<(() => void) | undefined>(undefined);
  const assessment = useMemo(() => baseline ? reviewSpreadsheetDraft(baseline, draft) : { edits: [], issues: [], dirty: false, changed: new Set<string>() }, [baseline, draft]);
  const dirty = assessment.dirty;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  useEffect(() => {
    mounted.current = true;
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", guard);
    return () => { mounted.current = false; window.removeEventListener("beforeunload", guard); };
  }, [dirty]);
  useEffect(() => {
    if (!dirty && !busy && afterClean.current) { const action = afterClean.current; afterClean.current = undefined; action(); }
  }, [dirty, busy]);
  const rows = useMemo(() => baseline ? visibleSpreadsheetRows(baseline.rows, query, draft) : [], [baseline, query, draft]);
  const back = onBack;
  function requestExit(target: "back" | "mode" | (() => void)) {
    if (busy) return;
    if (dirty) setExit(() => target);
    else if (target === "back") back();
    else if (typeof target === "function") target();
    else { setDraft({}); setEditingSource(undefined); setEdit(false); setFailure(""); }
  }
  function enterEdit() {
    if (!stored || archived || busy) return;
    setEditingSource({ sheet: stored, revision: document.revision });
    setEdit(true);
  }
  function continueEditing() { setExit(undefined); if (blocker.state === "blocked") blocker.reset(); }
  function finishExit() {
    setExit(undefined);
    if (blocker.state === "blocked") blocker.proceed();
    else if (exit === "back") back();
    else if (typeof exit === "function") exit();
  }
  function discard() {
    afterClean.current = finishExit;
    setDraft({}); setEditingSource(undefined); setEdit(false); setFailure("");
  }
  function change(rowId: string, field: SpreadsheetField, value: string | undefined) {
    setDraft(previous => {
      const next = { ...previous };
      const key = spreadsheetCellKey(rowId, field);
      if (value === undefined) delete next[key]; else next[key] = value;
      return next;
    });
    setFailure("");
  }
  async function save(leave = false) {
    if (lock.current || !baseline) return;
    const first = assessment.issues[0];
    if (first) {
      if (!editingSource) setEditingSource({ sheet: baseline, revision: document.revision });
      setFailure(first.message); setEdit(true); setQuery("");
      continueEditing();
      setAttention(previous => ({ rowId: first.rowId, field: first.field, token: (previous?.token ?? 0) + 1, before: draft[spreadsheetCellKey(first.rowId, first.field)] }));
      return;
    }
    if (archived) { setFailure("Dokumen ini sudah dihapus atau diganti."); return; }
    if (warnings.length && !ack) { setFailure("Periksa dan tandai peringatan sumber sebelum menyimpan."); return; }
    lock.current = true; setBusy(true); setFailure("");
    try {
      await persist({ documentId: document.id, expectedRevision: editingSource?.revision ?? document.revision, edits: assessment.edits, acknowledged: ack });
      if (!mounted.current) return;
      if (leave) afterClean.current = finishExit;
      setDraft({}); setEditingSource(undefined); setEdit(false);
      toast(successMessage);
    } catch (error) { if (mounted.current) setFailure(error instanceof Error ? error.message : "Spreadsheet belum dapat disimpan."); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return { baseline, archived, edit, enterEdit, draft, query, setQuery, rows,
    busy, failure, ack, setAck, dirty, changed: assessment.changed, issues: assessment.issues, attention,
    dialogOpen: exit !== undefined || blocker.state === "blocked", requestExit, continueEditing, discard, save, change };
}
export type SpreadsheetReviewModel = ReturnType<typeof useSpreadsheetReview>;
