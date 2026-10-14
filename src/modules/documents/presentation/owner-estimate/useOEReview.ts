import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router";
import { useDocumentsCommands } from "../binding";
import type { DocumentRecord } from "../../domain/models";
import type { OEField, OESheet } from "../../domain/owner-estimate";
import { oeCellKey, reviewOEDraft, visibleOERows } from "../../application/oe-review-draft";
import type { OEDraft } from "../../application/oe-review-draft";
import { useToast } from "../../../../shared/ui/toast-provider";

export function useOEReview(document: DocumentRecord) {
  const commands = useDocumentsCommands();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const stored = document.ownerEstimate?.reviewed ?? document.ownerEstimate?.candidate;
  const [editingSource, setEditingSource] = useState<{ sheet: OESheet; revision: number }>();
  const baseline = editingSource?.sheet ?? stored;
  const archived = !!(document.removedAt || document.supersededBy);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<OEDraft>({});
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [ack, setAck] = useState(document.acknowledged);
  const [exit, setExit] = useState<"back" | "mode">();
  const [attention, setAttention] = useState<{ rowId: string; field: OEField; token: number; before?: string }>();
  const lock = useRef(false);
  const mounted = useRef(true);
  const afterClean = useRef<(() => void) | undefined>(undefined);
  const assessment = useMemo(() => baseline ? reviewOEDraft(baseline, draft) : { edits: [], issues: [], dirty: false, changed: new Set<string>() }, [baseline, draft]);
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
  const rows = useMemo(() => baseline ? visibleOERows(baseline.rows, query, draft) : [], [baseline, query, draft]);
  function back() {
    const path = `/pengadaan/${document.procurementId}`;
    const origin: unknown = location.state?.reviewReturnTo;
    const validOrigin = typeof origin === "string" && origin.split("?")[0] === path && ["hea", "harga"].includes(new URLSearchParams(origin.split("?")[1]).get("tab") ?? "");
    void navigate(validOrigin ? origin as string : `${path}?tab=ringkasan`);
  }
  function requestExit(target: "back" | "mode") {
    if (busy) return;
    if (dirty) setExit(target);
    else if (target === "back") back();
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
  }
  function discard() {
    afterClean.current = finishExit;
    setDraft({}); setEditingSource(undefined); setEdit(false); setFailure("");
  }
  function change(rowId: string, field: OEField, value: string | undefined) {
    setDraft(previous => {
      const next = { ...previous };
      const key = oeCellKey(rowId, field);
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
      setAttention(previous => ({ rowId: first.rowId, field: first.field, token: (previous?.token ?? 0) + 1, before: draft[oeCellKey(first.rowId, first.field)] }));
      return;
    }
    if (archived) { setFailure("Dokumen ini sudah dihapus atau diganti."); return; }
    if (document.warnings.length && !ack) { setFailure("Periksa dan tandai peringatan sumber sebelum menyimpan."); return; }
    lock.current = true; setBusy(true); setFailure("");
    try {
      await commands.saveAndConfirmOwnerEstimate({ documentId: document.id, expectedRevision: editingSource?.revision ?? document.revision, edits: assessment.edits, acknowledged: ack });
      if (!mounted.current) return;
      if (leave) afterClean.current = finishExit;
      setDraft({}); setEditingSource(undefined); setEdit(false);
      toast("OE disimpan dan terkonfirmasi.");
    } catch (error) { if (mounted.current) setFailure(error instanceof Error ? error.message : "OE belum dapat disimpan."); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return { baseline, archived, edit, enterEdit, draft, query, setQuery, rows,
    busy, failure, ack, setAck, dirty, changed: assessment.changed, issues: assessment.issues, attention,
    dialogOpen: exit !== undefined || blocker.state === "blocked", requestExit, continueEditing, discard, save, change };
}
export type OEReviewModel = ReturnType<typeof useOEReview>;
