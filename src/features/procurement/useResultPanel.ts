import { useState } from "react";
import "../../shared/styles/focus.css";
import { downloadSnapshot } from "../../services/export/workbook";
import { useSessionService } from "../../services/session-context";
import { errorMessage } from "../../shared/errors/message";
import type { Procurement, Snapshot } from "../../shared/model/session";
import { useToast } from "../../shared/ui/feedback";

export function useResultPanel({
  snapshot: s,
  procurement: p,
}: {
  snapshot: Snapshot;
  procurement: Procurement;
}) {
  const service = useSessionService();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(false);
  const [filter, setFilter] = useState("");
  async function exportResult() {
    setBusy(true);
    try {
      await downloadSnapshot(s, p);
      await service.recordExport(s.id);
      toast("Laporan Excel berhasil dibuat.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  const rows = s.rows.filter((r) => !filter || r.category === filter);
  return { s, p, busy, detail, setDetail, filter, setFilter, exportResult, rows };
}
