import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useToast } from "../../../shared/ui/toast-provider";
import { errorMessage } from "../../../shared/kernel/error-message";
import type { DocumentRecord } from "../domain/models";
import type { PreparedSpreadsheet } from "../application/spreadsheet-ports";

export function useSpreadsheetImport({ prepare, publish: commit, release, successMessage }: {
  prepare: (file: File, progress: (label: string) => void) => Promise<PreparedSpreadsheet>;
  publish: (pendingId: string, sheetId: string) => Promise<DocumentRecord>;
  release: (id: string) => void;
  successMessage: string;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [choice, setChoice] = useState<PreparedSpreadsheet>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [progress, setProgress] = useState("");
  const pending = useRef<{ id: string } | undefined>(undefined);
  const mounted = useRef(true);
  const operation = useRef(0);
  const locked = useRef(false);
  useEffect(() => {
    mounted.current = true;
    // This counter identifies asynchronous imports, rather than a DOM ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { mounted.current = false; operation.current++; if (pending.current) release(pending.current.id); };
  }, [release]);
  function cancel() {
    operation.current++;
    if (pending.current) release(pending.current.id);
    pending.current = undefined;
    setChoice(undefined); setFailure("");
  }
  async function publish(sheetId: string) {
    if (!pending.current) return;
    const document = await commit(pending.current.id, sheetId);
    pending.current = undefined;
    if (mounted.current) {
      setChoice(undefined);
      toast(successMessage);
      void navigate(`/pengadaan/${document.procurementId}/review/${document.id}`);
    }
  }
  async function upload(file: File) {
    if (locked.current) return;
    locked.current = true;
    cancel();
    const token = ++operation.current;
    setBusy(true); setFailure(""); setProgress("Membaca spreadsheet");
    try {
      const result = await prepare(file, label => { if (mounted.current && operation.current === token) setProgress(label); });
      if (!mounted.current || operation.current !== token) { release(result.id); return; }
      pending.current = { id: result.id };
      if (result.sheets.length === 1) await publish(result.sheets[0].id);
      else setChoice(result);
    } catch (error) { if (mounted.current && operation.current === token) setFailure(errorMessage(error)); }
    finally { locked.current = false; if (mounted.current && operation.current === token) { setBusy(false); setProgress(""); } }
  }
  async function choose(sheetId: string) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setFailure("");
    try { await publish(sheetId); }
    catch (error) { if (mounted.current) setFailure(errorMessage(error)); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  return { choice, busy, failure, progress, upload, choose, cancel };
}
