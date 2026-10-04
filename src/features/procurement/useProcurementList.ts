import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useSessionService, useSessionState } from "../../services/session-context";
import { errorMessage } from "../../shared/errors/message";
import { useToast } from "../../shared/ui/feedback";

export function useProcurementList() {
  const service = useSessionService();
  const state = useSessionState();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("baru") === "1");
  const search = params.get("cari") || "";
  const setSearch = (value: string) =>
    setParams(value ? { cari: value } : {}, { replace: true });
  const [form, setForm] = useState({ name: "", number: "", functionName: "" });
  const [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const p = await service.createProcurement(form);
      navigate(`/pengadaan/${p.id}`);
      toast("Pengadaan berhasil dibuat. Mulai dengan menambahkan vendor.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return { state, setParams, open, setOpen, search, setSearch, form, setForm, busy, create };
}
