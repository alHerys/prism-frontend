import type { ProcurementDetailModel } from "./view-models";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useProcurementCommands, useProcurementData } from "../../modules/procurement/presentation/binding";
import { errorMessage } from "../../shared/kernel/error-message";
import { useToast } from "../../shared/ui/toast-provider";

const retiredTabs: Record<string, string> = { dokumen: "ringkasan", riwayat: "hea" };

export function useProcurementDetail() : ProcurementDetailModel {
  const { id } = useParams();
  const service = useProcurementCommands();
  const state = useProcurementData();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const replacementTab = requestedTab ? retiredTabs[requestedTab] : undefined;
  const defaultTab = state.snapshots.some(s => s.procurementId === id && s.module === "HEA") ? "hea" : "ringkasan";
  const tab = replacementTab || requestedTab || defaultTab;
  useEffect(() => {
    if (!replacementTab) return;
    const next = new URLSearchParams(params);
    next.set("tab", replacementTab);
    setParams(next, { replace: true });
  }, [replacementTab, params, setParams]);
  const p = state.procurements.find((p) => p.id === id);
  const toast = useToast();
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const docs = state.documents.filter((d) => d.procurementId === id);
  const vendors = state.vendors.filter((v) => v.procurementId === id);
  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    try {
      await service.addVendor(p!.id, vendorName);
      setVendorOpen(false);
      setVendorName("");
      toast("Vendor berhasil ditambahkan.", false, "procurement");
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  return {
    id,
    setParams,
    tab,
    p,
    vendorOpen,
    setVendorOpen,
    vendorName,
    setVendorName,
    docs,
    vendors,
    addVendor,
  };
}
