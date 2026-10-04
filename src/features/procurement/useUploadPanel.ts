import { useState } from "react";
import { useNavigate } from "react-router";
import { processDemoDocument } from "../../services/document-processing";
import { useSessionService } from "../../services/session-context";
import { errorMessage } from "../../shared/errors/message";
import type { DocumentKind } from "../../shared/model/session";
import "../../shared/styles/focus.css";
import { useToast } from "../../shared/ui/feedback";

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
}) {
  const service = useSessionService();
  const toast = useToast();
  const navigate = useNavigate();
  const [kind, setKind] = useState<DocumentKind>(scope === "procurement" ? "OE" : "FORM_A5");
  const vendor = vendorId || "";
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState("");
  const [failure, setFailure] = useState("");
  async function upload(file: File) {
    setFailure("");
    if (busy) return;
    if (kind !== "OE" && !vendor) {
      setFailure("Pilih vendor sebelum mengunggah dokumen.");
      return;
    }
    setBusy(true);
    try {
      const fixture = await processDemoDocument(file, kind, setProcessing);
      const document = await service.uploadRegisteredDocument({
        procurementId,
        kind,
        vendorId: kind === "OE" ? undefined : vendor,
        fixtureId: fixture.id,
        name: file.name,
      });
      toast("Dokumen selesai dibaca. Periksa data sebelum konfirmasi.");
      navigate(`/pengadaan/${procurementId}/review/${document.id}`);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
      setProcessing("");
    }
  }
  return { scope, embedded, kind, setKind, busy, processing, failure, upload };
}
