import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useDocumentsCommands } from "./binding";
import { useToast } from "../../../shared/ui/toast-provider";
import { errorMessage } from "../../../shared/kernel/error-message";
import type { DocumentRecord, UploadInput } from "../domain/models";
import type { PreparedOE } from "../application/owner-estimate-ports";

export function useOwnerEstimateImport(procurementId: string, current?: DocumentRecord) {
  const commands = useDocumentsCommands();
  const navigate = useNavigate();
  const toast = useToast();
  const [choice, setChoice] = useState<PreparedOE>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [progress, setProgress] = useState("");
  const pending = useRef<{ id: string; replacement?: UploadInput["replacement"] } | undefined>(undefined);
  const mounted = useRef(true);
  const operation = useRef(0);
  const locked = useRef(false);
  useEffect(() => {
    mounted.current = true;
    // This counter identifies asynchronous imports, rather than a DOM ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { mounted.current = false; operation.current++; if (pending.current) commands.releaseOwnerEstimate(pending.current.id); };
  }, [commands]);
  function cancel() {
    operation.current++;
    if (pending.current) commands.releaseOwnerEstimate(pending.current.id);
    pending.current = undefined;
    setChoice(undefined); setFailure("");
  }
  async function publish(sheetId: string) {
    if (!pending.current) return;
    const document = await commands.publishOwnerEstimate({ pendingId: pending.current.id, sheetId, procurementId, replacement: pending.current.replacement });
    pending.current = undefined;
    if (mounted.current) {
      setChoice(undefined);
      toast("Tabel OE selesai dibaca. Periksa data sebelum konfirmasi.");
      void navigate(`/pengadaan/${procurementId}/review/${document.id}`);
    }
  }
  async function upload(file: File) {
    if (locked.current) return;
    locked.current = true;
    cancel();
    const token = ++operation.current;
    const replacement = current ? { id: current.id, revision: current.revision } : undefined;
    setBusy(true); setFailure(""); setProgress("Membaca tabel OE");
    try {
      const result = await commands.prepareOwnerEstimate(file, label => { if (mounted.current && operation.current === token) setProgress(label); });
      if (!mounted.current || operation.current !== token) { commands.releaseOwnerEstimate(result.id); return; }
      pending.current = { id: result.id, replacement };
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
