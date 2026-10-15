import type { UploadPanelModel } from "./view-models";
import { useState } from "react";
import { useNavigate } from "react-router";

import { useDocumentsCommands, useDocumentsData } from "./binding";
import { currentOwnerEstimate } from "../application/queries";
import { errorMessage } from "../../../shared/kernel/error-message";
import type { DocumentKind, DocumentRecord } from "../domain/models";
import { useToast } from "../../../shared/ui/toast-provider";
import { useSpreadsheetImport } from "./useSpreadsheetImport";
import { useOwnerEstimateImport } from "./useOwnerEstimateImport";

export function useUploadPanel({
  procurementId,
  vendorId,
  scope = "vendor",
  embedded = false,
  initialKind,
}: {
  procurementId: string;
  vendorId?: string;
  scope?: "vendor" | "procurement";
  embedded?: boolean;
  initialKind?: "FORM_A5" | "OFFER";
}) : UploadPanelModel {
  const service = useDocumentsCommands();
  const state = useDocumentsData();
  const currentDocument = scope === "procurement" ? currentOwnerEstimate(state.documents, procurementId) : undefined;
  const toast = useToast();
  const navigate = useNavigate();
  const [kind, setKind] = useState<DocumentKind>(scope === "procurement" ? "OE" : initialKind ?? "FORM_A5");
  const vendor = vendorId || "";
  const [localBusy, setBusy] = useState(false);
  const [localProcessing, setProcessing] = useState("");
  const [localFailure, setFailure] = useState("");
  const oe = useOwnerEstimateImport(procurementId, currentDocument);
  const offer = useSpreadsheetImport({ prepare: service.prepareOfferSpreadsheet, release: service.releaseOfferSpreadsheet,
    publish: (pendingId, sheetId) => service.publishOfferSpreadsheet({ pendingId, sheetId, procurementId, vendorId: vendor }),
    successMessage: service.reviewWorkflow === "SAVE_CONFIRMS" ? "Tabel penawaran selesai dibaca. Periksa lalu simpan data." : "Tabel penawaran selesai dibaca. Periksa data sebelum konfirmasi.",
  });
  const busy = localBusy || oe.busy || offer.busy;
  const processing = oe.progress || offer.progress || localProcessing;
  const failure = localFailure || oe.failure || offer.failure;
  const [replacing, setReplacing] = useState(false);
  const [removalTarget, setRemovalTarget] = useState<DocumentRecord>();
  const [removalFailure, setRemovalFailure] = useState("");
  const requestRemoval = () => { setRemovalFailure(""); setRemovalTarget(currentDocument); };
  const cancelRemoval = () => { if (!busy) { setRemovalFailure(""); setRemovalTarget(undefined); } };
  async function removeOwnerEstimate() {
    if (!removalTarget || busy) return;
    setBusy(true);
    setRemovalFailure("");
    try {
      await service.removeOwnerEstimate(procurementId, removalTarget.id, removalTarget.revision);
      oe.cancel();
      setRemovalTarget(undefined);
      setReplacing(false);
      setFailure("");
      toast("OE dihapus dari pengadaan. Unggah OE baru untuk melanjutkan evaluasi.");
    } catch (error) {
      setRemovalFailure(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const beginReplacement = () => { setFailure(""); setReplacing(true); };
  const cancelReplacement = () => { if (!busy) { oe.cancel(); setFailure(""); setReplacing(false); } };
  async function upload(file: File) {
    setFailure("");
    if (busy) return;
    if (kind === "OE") { await oe.upload(file); return; }
    if (!vendor) {
      setFailure("Pilih vendor sebelum mengunggah dokumen.");
      return;
    }
    if (kind === "OFFER") { await offer.upload(file); return; }
    setBusy(true);
    try {
      const document = await service.upload({ file, procurementId, kind,
        vendorId: vendor,
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
  return { scope, embedded, kind, setKind, busy, processing, failure, upload, currentDocument, replacing, beginReplacement, cancelReplacement, removalTarget, removalFailure, requestRemoval, cancelRemoval, removeOwnerEstimate, offerChoice: offer.choice, chooseOfferSheet: offer.choose, cancelOfferImport: offer.cancel, oeChoice: oe.choice, chooseOESheet: oe.choose, cancelOEImport: oe.cancel };
}
