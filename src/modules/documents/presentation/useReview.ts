import type { ReviewModel } from "./view-models";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useDocumentsCommands, useDocumentsData } from "./binding";

import { toPercent, toRatio } from "../../../shared/formatting/review-input";
import type { A5Values } from "../domain/models";
import type { PricePair } from "../../price-deviation/domain/models";
import { useToast } from "../../../shared/ui/toast-provider";
import { useUnsavedReview } from "./useUnsavedReview";

export function useReview() : ReviewModel {
  const { id, documentId } = useParams();
  const service = useDocumentsCommands();
  const state = useDocumentsData();
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
  const source = service.availableSources().find((f) => f.id === d?.sourceId);
  const back = () =>
    navigate(
      d?.vendorId
        ? `/pengadaan/${id}/vendor/${d?.vendorId}`
        : `/pengadaan/${id}?tab=ringkasan`,
    );
  function changeValue(key: keyof A5Values, value: string) {
    setValues((v) => (v ? { ...v, [key]: value } : v));
    setDirty(true);
    setAck(false);
  }
  const saveInput = () => ({ document: d!, values: values ? {
    ...values, tkdn_barang: toRatio(values.tkdn_barang), tkdn_jasa: toRatio(values.tkdn_jasa),
  } : undefined, group, pairs });
  async function save() {
    setFailure("");
    setBusy(true);
    try {
      await service.saveReview(saveInput());
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
      const current = dirty ? await service.saveReview(saveInput()) : d!;
      setDirty(false);
      await service.confirmReview(current, ack);
      setConfirm(false);
      toast("Data terkonfirmasi dan siap dievaluasi.");
      // Let the unsaved-navigation guard observe the saved draft before leaving.
      setTimeout(back, 0);
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
  return {
    id,
    state,
    d,
    showSource,
    setShowSource,
    ack,
    setAck,
    busy,
    confirm,
    setConfirm,
    leave,
    setLeave,
    focused,
    setFocused,
    values,
    pairs,
    group,
    setGroup,
    dirty,
    setDirty,
    failure,
    blocker,
    leavePage,
    p,
    vendor,
    source,
    back,
    changeValue,
    save,
    confirmDocument,
    editPair,
  };
}
