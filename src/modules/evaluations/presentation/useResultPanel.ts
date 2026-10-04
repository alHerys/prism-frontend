import type { ResultPanelModel } from "./view-models";
import { useState } from "react";

import { useEvaluationsCommands } from "./binding";
import { errorMessage } from "../../../shared/kernel/error-message";
import type { Procurement } from "../../procurement/domain/models";
import type { Snapshot } from "../domain/models";
import { useToast } from "../../../shared/ui/toast-provider";

export function useResultPanel({
  snapshot: s,
  procurement: p,
}: {
  snapshot: Snapshot;
  procurement: Procurement;
}) : ResultPanelModel {
  const service = useEvaluationsCommands();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(false);
  const [filter, setFilter] = useState("");
  async function exportResult() {
    setBusy(true);
    try {
      await service.exportSnapshot(s);
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
