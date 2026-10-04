import type { ProcurementDetailModel } from "./view-models";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useProcurementCommands, useProcurementData } from "../../modules/procurement/presentation/binding";
import { errorMessage } from "../../shared/kernel/error-message";
import { useToast } from "../../shared/ui/toast-provider";

export function useProcurementDetail() : ProcurementDetailModel {
  const { id } = useParams();
  const service = useProcurementCommands();
  const state = useProcurementData();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || (state.snapshots.some((s) => s.procurementId === id && s.module === "HEA") ? "hea" : "ringkasan");
  const p = state.procurements.find((p) => p.id === id);
  const toast = useToast();
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const docs = state.documents.filter((d) => d.procurementId === id);
  const vendors = state.vendors.filter((v) => v.procurementId === id);
  const results = state.snapshots.filter((s) => s.procurementId === id);
  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    try {
      await service.addVendor(p!.id, vendorName);
      setVendorOpen(false);
      setVendorName("");
      toast("Vendor berhasil ditambahkan.");
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  return {
    id,
    state,
    setParams,
    tab,
    p,
    vendorOpen,
    setVendorOpen,
    vendorName,
    setVendorName,
    docs,
    vendors,
    results,
    addVendor,
  };
}
