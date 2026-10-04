import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { availableDocuments } from "../../services/registry";
import { useSessionService, useSessionState } from "../../services/session-context";
import { toPercent, toRatio } from "../../shared/formatters/review-input";
import type { A5Values, PricePair } from "../../shared/model/session";
import "../../shared/styles/focus.css";
import { useToast } from "../../shared/ui/feedback";
import { useUnsavedReview } from "./useUnsavedReview";

export function useReview() {
  const { id, documentId } = useParams();
  const service = useSessionService();
  const state = useSessionState();
  const d = state.documents.find(
    (d) => d.id === documentId && d.procurementId === id,
  );
  const navigate = useNavigate();
  const toast = useToast();
  const [showSource, setShowSource] = useState(true);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [leave, setLeave] = useState(false);
  const [focused, setFocused] = useState<string>("hpb");
  const [values, setValues] = useState<A5Values | undefined>(
    d?.reviewed
      ? {
        ...d.reviewed,
        tkdn_barang: toPercent(d.reviewed.tkdn_barang),
        tkdn_jasa: toPercent(d.reviewed.tkdn_jasa),
      }
      : undefined,
  );
  const [pairs, setPairs] = useState<PricePair[]>(() =>
    structuredClone(d?.pairs || []),
  );
  const [group, setGroup] = useState(d?.selectedGroup || "");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState("");
  const blocker = useUnsavedReview(dirty);
  const leavePage = () => {
    if (blocker.state === "blocked") blocker.proceed();
    else back();
  };
  const p = state.procurements.find((p) => p.id === id)!;
  const vendor = state.vendors.find((v) => v.id === d?.vendorId);
  const fixture = availableDocuments().find((f) => f.id === d?.fixtureId);
  const back = () =>
    navigate(
      d?.vendorId
        ? `/pengadaan/${id}/vendor/${d?.vendorId}`
        : `/pengadaan/${id}?tab=dokumen`,
    );
  function changeValue(key: keyof A5Values, value: string) {
    setValues((v) => (v ? { ...v, [key]: value } : v));
    setDirty(true);
    setAck(false);
  }
  async function save() {
    setFailure("");
    setBusy(true);
    try {
      if (values) {
        await service.reviewDocument(
          d!.id,
          {
            ...values,
            tkdn_barang: toRatio(values.tkdn_barang),
            tkdn_jasa: toRatio(values.tkdn_jasa),
          },
          d!.revision,
        );
      } else {
        let current = d!;
        if (group && group !== d!.selectedGroup)
          current = await service.selectGroup(d!.id, group, d!.revision);
        if (current.kind === "OFFER")
          await service.reviewPairs(current.id, pairs, current.revision);
      }
      setDirty(false);
      toast(
        "Perubahan disimpan. Konfirmasi diperlukan untuk data yang berubah.",
      );
      return true;
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : "Perubahan belum dapat disimpan.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function confirmDocument() {
    setFailure("");
    setBusy(true);
    try {
      if (d!.kind === "OFFER")
        await service.confirmPairs(d!.id, d!.revision, ack);
      else await service.confirmDocument(d!.id, d!.revision, ack);
      setConfirm(false);
      toast("Data terkonfirmasi dan siap dievaluasi.");
      back();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Konfirmasi belum berhasil.");
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  function editPair(
    index: number,
    key: "oe" | "offer" | "matched",
    value: string | boolean,
  ) {
    setPairs((old) =>
      old.map((pair, i) => (i === index ? { ...pair, [key]: value } : pair)),
    );
    setDirty(true);
    setAck(false);
  }
  return { id, state, d, showSource, setShowSource, ack, setAck, busy, confirm, setConfirm, leave, setLeave, focused, setFocused, values, pairs, group, setGroup, dirty, setDirty, failure, blocker, leavePage, p, vendor, fixture, back, changeValue, save, confirmDocument, editPair };
}
