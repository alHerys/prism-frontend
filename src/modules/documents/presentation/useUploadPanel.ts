import type { UploadPanelModel } from "./view-models";
import { useState } from "react";
import { useNavigate } from "react-router";

import { useDocumentsCommands, useDocumentsData } from "./binding";
import { currentOwnerEstimate } from "../application/queries";
import { errorMessage } from "../../../shared/kernel/error-message";
import type { DocumentKind } from "../domain/models";
import { useToast } from "../../../shared/ui/toast-provider";

export function useUploadPanel({
  procurementId,
  vendorId,
  scope = "vendor",
  embedded = false,
}: {
  procurementId: string;
  vendorId?: string;
  scope?: "vendor" | "procurement";
  embedded?: boolean;
}) : UploadPanelModel {
  const service = useDocumentsCommands();
  const state = useDocumentsData();
  const currentDocument = scope === "procurement" ? currentOwnerEstimate(state.documents, procurementId) : undefined;
  const toast = useToast();
  const navigate = useNavigate();
  const [kind, setKind] = useState<DocumentKind>(scope === "procurement" ? "OE" : "FORM_A5");
  const vendor = vendorId || "";
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState("");
  const [failure, setFailure] = useState("");
  const [replacing, setReplacing] = useState(false);
  const beginReplacement = () => { setFailure(""); setReplacing(true); };
  const cancelReplacement = () => { setFailure(""); setReplacing(false); };
  async function upload(file: File) {
    setFailure("");
    if (busy) return;
    if (kind !== "OE" && !vendor) {
      setFailure("Pilih vendor sebelum mengunggah dokumen.");
      return;
    }
    setBusy(true);
    try {
      const document = await service.upload({ file, procurementId, kind,
        vendorId: kind === "OE" ? undefined : vendor,
        ...(currentDocument ? { replacement: { id: currentDocument.id, revision: currentDocument.revision } } : {}),
      }, setProcessing);
      toast("Dokumen selesai dibaca. Periksa data sebelum konfirmasi.");
      navigate(`/pengadaan/${procurementId}/review/${document.id}`);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
      setProcessing("");
    }
  }
  return { scope, embedded, kind, setKind, busy, processing, failure, upload, currentDocument, replacing, beginReplacement, cancelReplacement };
}
