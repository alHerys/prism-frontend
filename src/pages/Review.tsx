import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { ArrowsOut } from "@phosphor-icons/react/dist/csr/ArrowsOut";
import { CheckCircle as CheckCircle2 } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeSlash as EyeOff } from "@phosphor-icons/react/dist/csr/EyeSlash";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { FloppyDisk as Save } from "@phosphor-icons/react/dist/csr/FloppyDisk";
import { useEffect, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router";
import { useSessionService, useSessionState } from "../services/session-context";
import { SourcePanel } from "../shared/ui/components";
import { CurrencyInput } from "../shared/ui/currency-input";
import "../shared/styles/focus.css";

import type { A5Values, PricePair } from "../shared/model/session";

import { availableDocuments } from "../services/registry";
import { kindLabel, money, pct } from "../shared/formatters/display";
import { Empty, Modal, Status, useToast } from "../shared/ui/feedback";

const fields: Record<keyof A5Values, string> = {
  hpb: "Harga Penawaran Barang",
  hpj: "Harga Penawaran Jasa",
  tkdn_barang: "TKDN barang",
  tkdn_jasa: "TKDN jasa",
  knb: "Komponen Bukan Biaya",
};
function toPercent(s: string) {
  return pct(s).replace("%", "").replace(",", ".");
}
function toRatio(s: string) {
  const text = s.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(text))
    throw new Error("Masukkan persentase berupa angka 0 hingga 100.");
  const [w, f = ""] = text.split(".");
  const digits = w.padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}${f}`;
}
export function Review() {
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
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  const leavePage = () => {
    if (blocker.state === "blocked") blocker.proceed();
    else back();
  };
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  if (!d)
    return (
      <div className="page">
        <Empty title="Dokumen tidak ditemukan">
          Buka pengadaan untuk memilih dokumen yang tersedia.
        </Empty>
        <Link className="btn" to="/pengadaan">
          Kembali ke pengadaan
        </Link>
      </div>
    );
  const p = state.procurements.find((p) => p.id === id)!;
  const vendor = state.vendors.find((v) => v.id === d.vendorId);
  const fixture = availableDocuments().find((f) => f.id === d.fixtureId);
  const back = () =>
    navigate(
      d.vendorId
        ? `/pengadaan/${id}/vendor/${d.vendorId}`
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
  return (
    <div className="focus-shell">
      <header className="focus-head">
        <div className="review-header-context">
          <button
            className="btn quiet review-back"
            onClick={() => (dirty ? setLeave(true) : back())}
          >
            <ArrowLeft />
            Kembali ke pengadaan
          </button>
          <div className="review-heading">
            <h1>Periksa {kindLabel[d.kind]}</h1>
            <p>
              {p.number} · {vendor?.name || p.name}
            </p>
          </div>
        </div>
      </header>
      <main className="focus-content">
        <div className="review-document-bar">
          <div className="review-document-identity">
            <span className="review-file-icon">
              <FileText aria-hidden="true" />
            </span>
            <div>
              <strong>{d.name}</strong>
              <p>
                Revisi {d.revision} · {kindLabel[d.kind]}
              </p>
            </div>
            <Status value={dirty ? "REVIEW_REQUIRED" : d.status} />
          </div>
          <button
            className="btn"
            aria-expanded={showSource}
            aria-controls="review-source"
            onClick={() => setShowSource((shown) => !shown)}
          >
            {showSource ? <EyeOff /> : <Eye />}
            {showSource ? "Tutup bukti sumber" : "Tampilkan bukti sumber"}
          </button>
        </div>
        <div
          className="review-grid"
          style={!showSource ? { gridTemplateColumns: "1fr" } : undefined}
        >
          {showSource && (
            <SourcePanel
              id="review-source"
              className="review-source"
              title="Bukti sumber"
              action={
                fixture && (
                  <a
                    className="btn small"
                    href={fixture.path}
                    target={d.kind === "FORM_A5" ? "_blank" : undefined}
                    rel={d.kind === "FORM_A5" ? "noreferrer" : undefined}
                    download={d.kind === "FORM_A5" ? undefined : true}
                    aria-label={d.kind === "FORM_A5" ? "Perbesar PDF di tab baru" : "Buka berkas"}
                    title={d.kind === "FORM_A5" ? "Perbesar PDF" : "Buka berkas"}
                  >
                    {d.kind === "FORM_A5" ? <ArrowsOut aria-hidden="true" /> : <><FileText /> Buka berkas</>}
                  </a>
                )
              }
            >
              {d.kind === "FORM_A5" && fixture ? (
                <iframe
                  className="review-pdf-preview"
                  src={fixture.path}
                  title={`Preview PDF ${d.name}`}
                />
              ) : (
                <div className="paper">
                  <div className="paper-header">
                    <h3>
                      {d.kind === "FORM_A5"
                        ? "FORM A5 · KOMITMEN TKDN"
                        : "RINCIAN HARGA SATUAN"}
                    </h3>
                    <small>{vendor?.name || p.name}</small>
                  </div>
                  {d.candidate ? (
                    <dl>
                      {Object.entries(d.candidate).map(([key, value]) => (
                        <div
                          key={key}
                          className={`review-source-value${focused === key ? " selected" : ""}`}
                        >
                          <dt>{fields[key as keyof A5Values]}</dt>
                          <dd>
                            {key.startsWith("tkdn")
                              ? d.sources.find((s) => s.field === key)?.quote ||
                              pct(value)
                              : money(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Komponen</th>
                          <th>Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(d.priceItems || []).map((pair) => (
                          <tr key={pair.id}>
                            <td>
                              {pair.description}
                              <small>
                                {pair.category === "MATERIAL"
                                  ? "Material"
                                  : "Jasa"}{" "}
                                · {pair.unit}
                              </small>
                            </td>
                            <td>
                              {money(d.kind === "OE" ? pair.oe : pair.offer)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {d.sources
                    .filter((s) => d.kind !== "FORM_A5" || s.field === focused)
                    .map((s, i) => (
                      <div className="evidence" key={i}>
                        <strong>{s.location}</strong>
                        <p>{s.quote}</p>
                      </div>
                    ))}
                </div>
              )}
            </SourcePanel>
          )}
          <section className="panel review-editor">
            <div className="panel-header">
              <div>
                <h2>
                  {values
                    ? "Nilai hasil pembacaan"
                    : "Kelompok harga dan pasangan"}
                </h2>
                <p>
                  Cocokkan nilai dengan sumber di sebelah kiri. Simpan koreksi
                  sebelum mengonfirmasi data.
                </p>
              </div>
            </div>
            {values ? (
              <div className="form-grid">
                {(Object.keys(fields) as (keyof A5Values)[]).map((key) => (
                  <div className="field" key={key}>
                    <label htmlFor={key}>
                      {fields[key]} {key.startsWith("tkdn") ? "(%)" : "(Rp)"}
                    </label>
                    {key.startsWith("tkdn") ? <input
                      id={key}
                      value={values[key]}
                      inputMode="decimal"
                      onFocus={() => setFocused(key)}
                      onChange={(e) => changeValue(key, e.target.value)}
                    /> : <CurrencyInput
                      id={key}
                      value={values[key]}
                      onFocus={() => setFocused(key)}
                      onValueChange={(value) => changeValue(key, value)}
                    />}
                    <small>
                      Nilai awal:{" "}
                      {key.startsWith("tkdn")
                        ? pct(d.candidate![key])
                        : money(d.candidate![key])}
                    </small>
                    {values[key] !==
                      (key.startsWith("tkdn")
                        ? toPercent(d.candidate![key])
                        : d.candidate![key]) && (
                        <span
                          className="badge info"
                          style={{ width: "fit-content" }}
                        >
                          Dikoreksi
                        </span>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="group">Kelompok harga yang digunakan</label>
                  <select
                    id="group"
                    value={group}
                    onChange={(e) => {
                      setGroup(e.target.value);
                      setDirty(true);
                      setAck(false);
                    }}
                  >
                    <option value="">Pilih kelompok secara eksplisit</option>
                    {d.groups.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                  <small>
                    Ringkasan total tidak digunakan untuk perbandingan harga
                    satuan.
                  </small>
                </div>
                {d.kind === "OFFER" && (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Pasangan</th>
                          <th>OE (Rp)</th>
                          <th>Penawaran (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pairs.map((pair, i) => (
                          <tr key={pair.id}>
                            <td>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={pair.matched}
                                  onChange={(e) =>
                                    editPair(i, "matched", e.target.checked)
                                  }
                                />{" "}
                                {pair.description}
                              </label>
                              <small>
                                {pair.category === "MATERIAL"
                                  ? "Material"
                                  : "Jasa"}{" "}
                                · {pair.unit}
                              </small>
                              <small>{pair.source}</small>
                              {!pair.matched && (
                                <span className="badge warning">
                                  Periksa pasangan
                                </span>
                              )}
                            </td>
                            <td>
                              <input
                                aria-label={`OE ${pair.description}`}
                                style={{ width: 110 }}
                                value={pair.oe}
                                onChange={(e) =>
                                  editPair(i, "oe", e.target.value)
                                }
                              />
                            </td>
                            <td>
                              <input
                                aria-label={`Penawaran ${pair.description}`}
                                style={{ width: 110 }}
                                value={pair.offer}
                                onChange={(e) =>
                                  editPair(i, "offer", e.target.value)
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            {d.warnings.length > 0 && (
              <div className="alert">
                <strong>Perlu verifikasi evaluator</strong>
                {d.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
                <label className="notice">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                  />
                  Saya telah memeriksa peringatan dan memastikan nilai serta
                  pasangan sesuai sumber.
                </label>
              </div>
            )}
            {failure && (
              <div className="alert error" role="alert">
                {failure}
              </div>
            )}
            <div className="review-action">
              <div className="review-save-state" role="status">
                <strong>
                  {dirty
                    ? "Perubahan belum disimpan"
                    : d.status === "CONFIRMED"
                      ? "Data terkonfirmasi"
                      : "Siap diperiksa"}
                </strong>
                <small>
                  {dirty
                    ? "Simpan koreksi agar dapat dikonfirmasi."
                    : `Revisi ${d.revision} · ${d.status === "CONFIRMED" ? "Siap digunakan untuk evaluasi" : "Konfirmasi setelah nilai dan sumber sesuai"}`}
                </small>
              </div>
              <button
                className="btn"
                disabled={!dirty || busy}
                onClick={() => void save()}
              >
                <Save />
                {busy ? "Menyimpan…" : "Simpan perubahan"}
              </button>
              <button
                className="btn primary"
                disabled={
                  dirty ||
                  busy ||
                  d.status === "CONFIRMED" ||
                  (d.warnings.length > 0 && !ack) ||
                  (!values && !d.selectedGroup)
                }
                onClick={() => setConfirm(true)}
              >
                <CheckCircle2 />
                Konfirmasi data
              </button>
            </div>
          </section>
        </div>
      </main>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title="Konfirmasi data dokumen"
        description="Anda telah memeriksa nilai, sumber, dan peringatan. Data terkonfirmasi akan menjadi input evaluasi."
      >
        <div className="modal-actions">
          <button className="btn" onClick={() => setConfirm(false)}>
            Kembali memeriksa
          </button>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => void confirmDocument()}
          >
            {busy ? "Mengonfirmasi…" : "Konfirmasi data"}
          </button>
        </div>
      </Modal>
      <Modal
        open={leave || blocker.state === "blocked"}
        onOpenChange={(value) => {
          setLeave(value);
          if (!value && blocker.state === "blocked") blocker.reset();
        }}
        title="Perubahan belum disimpan"
        description="Simpan koreksi sebelum meninggalkan halaman, atau buang perubahan yang belum tersimpan."
      >
        <div className="modal-actions">
          <button
            className="btn quiet"
            onClick={() => {
              setLeave(false);
              if (blocker.state === "blocked") blocker.reset();
            }}
          >
            Tetap di halaman
          </button>
          <button
            className="btn"
            onClick={() => {
              setDirty(false);
              if (blocker.state === "blocked") blocker.proceed();
              else setTimeout(leavePage, 0);
            }}
          >
            Buang perubahan
          </button>
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              if (await save()) setTimeout(leavePage, 0);
            }}
          >
            Simpan & kembali
          </button>
        </div>
      </Modal>
    </div>
  );
}
