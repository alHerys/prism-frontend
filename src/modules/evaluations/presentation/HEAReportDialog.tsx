import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react/dist/csr/X";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/csr/ArrowSquareOut";
import { Modal } from "../../../shared/ui/modal";
import { useEvaluationsCommands } from "./binding";
import type { Snapshot } from "../domain/models";
import "./hea-report-dialog.css";

/** The preview owns its blob URL; neither bytes nor URL enter session stores. */
export function HEAReportDialog({ snapshot, onClose }: { snapshot: Snapshot; onClose: () => void }) {
  const commands = useEvaluationsCommands();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let resource = "";
    void commands.previewHEA(snapshot).then(bytes => {
      if (cancelled) return;
      resource = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
      setUrl(resource);
    }).catch(failure => { if (!cancelled) setError(failure instanceof Error ? failure.message : "PDF belum dapat dibuat."); });
    return () => { cancelled = true; if (resource) URL.revokeObjectURL(resource); };
  }, [commands, snapshot, attempt]);
  return <Modal open onOpenChange={open => { if (!open) onClose(); }} title="Detail perhitungan HEA" className="hea-report-dialog">
    <button className="icon-button hea-report-close" type="button" aria-label="Tutup detail HEA" onClick={onClose}><X size={22} aria-hidden="true" /></button>
    {error ? <div className="hea-report-state" role="alert"><p>{error}</p><button className="btn" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Coba lagi</button></div> : !url ? <div className="hea-report-state" role="status">Menyiapkan laporan PDF…</div> : <>
      <div className="hea-report-actions"><a className="btn small" href={url} target="_blank" rel="noreferrer"><ArrowSquareOut size={18} aria-hidden="true" />Buka PDF</a><a className="btn small" href={url} download={`Perhitungan-HEA-${snapshot.id}.pdf`}>Unduh PDF</a></div>
      <embed className="hea-report-pdf" src={`${url}#view=FitH`} type="application/pdf" title="PDF detail perhitungan HEA" />
    </>}
  </Modal>;
}
