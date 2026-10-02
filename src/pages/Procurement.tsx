import { useState } from "react";
import { ProcurementTable } from "./ProcurementTable";
import {
  HeaderAction,
  UploadZone,
  Button,
  Field,
  LoadingState,
  ErrorState,
} from "../components";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import "./review.css";
import { DownloadSimple as Download } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { CheckCircle as CheckCircle2 } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { demoService } from "../domain";
import type {
  DocumentRecord,
  DocumentKind,
  Snapshot,
  Procurement,
} from "../domain";
import { processDemoDocument } from "../services/document-processing";
import { SnapshotInputs } from "./History";
import { downloadSnapshot } from "../export/workbook";
import {
  useDemo,
  useToast,
  money,
  roundedMoney,
  pct,
  date,
  dateTime,
  kindLabel,
  Status,
  Modal,
  Empty,
  Stepper,
} from "../ui";
const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Tindakan belum berhasil. Coba kembali.";
export function ProcurementList() {
  const state = useDemo();
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
      const p = await demoService.createProcurement(form);
      navigate(`/pengadaan/${p.id}`);
      toast("Pengadaan berhasil dibuat. Mulai dengan menambahkan vendor.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <HeaderAction>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus />
          Tambah pengadaan
        </Button>
      </HeaderAction>
      <section className="panel">
        <ProcurementTable
          items={state.procurements}
          search={search}
          onSearchChange={setSearch}
        />
      </section>
      <Modal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          setParams({});
        }}
        title="Tambah pengadaan"
        description="Lengkapi identitas pengadaan sebelum menambahkan vendor dan dokumen."
      >
        <form onSubmit={create}>
          {[
            ["name", "Nama pengadaan"],
            ["number", "Nomor pengadaan"],
            ["functionName", "Fungsi / unit kerja"],
          ].map(([key, label]) => (
            <Field key={key} label={label} htmlFor={key}>
              <input
                id={key}
                required
                maxLength={256}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </Field>
          ))}
          <div className="modal-actions">
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(false)}
            >
              Batal
            </button>
            <button className="btn primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Buat pengadaan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export function ProcurementDetail() {
  const { id } = useParams();
  const state = useDemo();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "ringkasan";
  const p = state.procurements.find((p) => p.id === id);
  const toast = useToast();
  const [vendorOpen, setVendorOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  if (!p)
    return (
      <div className="page">
        <Empty title="Pengadaan tidak ditemukan">
          Kembali ke <Link to="/pengadaan">daftar pengadaan</Link>.
        </Empty>
      </div>
    );
  const docs = state.documents.filter((d) => d.procurementId === id);
  const vendors = state.vendors.filter((v) => v.procurementId === id);
  const results = state.snapshots.filter((s) => s.procurementId === id);
  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    try {
      await demoService.addVendor(p!.id, vendorName);
      setVendorOpen(false);
      setVendorName("");
      toast("Vendor berhasil ditambahkan.");
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  return (
    <div className="page">
      <nav className="procurement-path" aria-label="Tahap pengadaan">
        <button
          className={tab === "ringkasan" ? "current" : ""}
          aria-current={tab === "ringkasan" ? "step" : undefined}
          onClick={() => setParams({ tab: "ringkasan" })}
        >
          <span>1</span>
          <div>
            Identitas & vendor<small>{vendors.length} vendor terdaftar</small>
          </div>
        </button>
        <button
          className={tab === "dokumen" ? "current" : ""}
          aria-current={tab === "dokumen" ? "step" : undefined}
          onClick={() => setParams({ tab: "dokumen" })}
        >
          <span>2</span>
          <div>
            Unggah & verifikasi
            <small>
              {docs.filter((d) => d.status === "CONFIRMED").length} dari{" "}
              {docs.length} dokumen terkonfirmasi
            </small>
          </div>
        </button>
        <button
          className={tab === "hea" || tab === "harga" ? "current" : ""}
          aria-current={tab === "hea" || tab === "harga" ? "step" : undefined}
          onClick={() => setParams({ tab: "hea" })}
        >
          <span>3</span>
          <div>
            Evaluasi<small>HEA atau Harga Timpang</small>
          </div>
        </button>
        <button
          className={tab === "riwayat" ? "current" : ""}
          aria-current={tab === "riwayat" ? "step" : undefined}
          onClick={() => setParams({ tab: "riwayat" })}
        >
          <span>4</span>
          <div>
            Hasil & jejak sumber<small>{results.length} hasil tersimpan</small>
          </div>
        </button>
      </nav>
      <div className="procurement-stage-content">
        {tab === "ringkasan" && (
          <>
            <section className="panel stage-vendors">
              <div className="panel-header">
                <div>
                  <h2>Identitas & vendor</h2>
                  <p className="muted">Daftarkan peserta pengadaan sebelum mengaitkan dokumen penawaran.</p>
                </div>
                <button className="btn primary" onClick={() => setVendorOpen(true)}>
                  <Plus /> Tambah vendor
                </button>
              </div>
              {vendors.length ? vendors.map((v) => (
                <div className="queue-row" key={v.id}>
                  <strong>{v.name}</strong>
                  <small>{docs.filter((d) => d.vendorId === v.id).length} dokumen</small>
                </div>
              )) : <Empty title="Belum ada vendor">Tambahkan vendor untuk memulai pengadaan.</Empty>}
            </section>
            <div className="stage-navigation">
              <button className="btn primary" onClick={() => setParams({ tab: "dokumen" })}>
                Lanjut ke dokumen <ArrowRight />
              </button>
            </div>
          </>
        )}
        {tab === "dokumen" && (
          <>
              <>
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Dokumen per vendor</h2>
                      <p>Pilih vendor untuk mengunggah Form A5 atau dokumen penawarannya.</p>
                    </div>
                  </div>
                  {vendors.length ? vendors.map((v) => {
                    const vendorDocs = docs.filter((d) => d.vendorId === v.id);
                    return (
                      <Link className="vendor-document-row" key={v.id} to={`/pengadaan/${p.id}/vendor/${v.id}`}>
                        <span><strong>{v.name}</strong><small>{vendorDocs.length} dokumen · {vendorDocs.filter((d) => d.status === "CONFIRMED").length} terkonfirmasi</small></span>
                        <span className="vendor-document-action">Buka dokumen <ArrowRight /></span>
                      </Link>
                    );
                  }) : (
                    <Empty title="Belum ada vendor">Kembali ke tahap identitas & vendor untuk menambahkan vendor.</Empty>
                  )}
                </section>
                <UploadPanel procurementId={p.id} scope="procurement" />
                {docs.some((d) => d.kind === "OE") && (
                  <DocumentTable documents={docs.filter((d) => d.kind === "OE")} title="Dokumen OE" />
                )}
                <DocumentTable documents={docs.filter((d) => d.vendorId)} title="Daftar Dokumen Vendor" />
              </>
            <div className="stage-navigation">
              <button className="btn" onClick={() => setParams({ tab: "ringkasan" })}>Kembali</button>
              <button className="btn primary" onClick={() => setParams({ tab: "hea" })}>Lanjut ke evaluasi <ArrowRight /></button>
            </div>
          </>
        )}
        {(tab === "hea" || tab === "harga") && (
          <>
            <div className="evaluation-switch" role="group" aria-label="Pilih modul evaluasi">
              <button className={tab === "hea" ? "selected" : ""} aria-pressed={tab === "hea"} onClick={() => setParams({ tab: "hea" })}>HEA</button>
              <button className={tab === "harga" ? "selected" : ""} aria-pressed={tab === "harga"} onClick={() => setParams({ tab: "harga" })}>Harga Timpang</button>
            </div>
            {tab === "hea" ? <HEAPanel procurement={p} /> : <PDPanel procurement={p} />}
            <div className="stage-navigation">
              <button className="btn" onClick={() => setParams({ tab: "dokumen" })}>Kembali ke dokumen</button>
              <button className="btn primary" onClick={() => setParams({ tab: "riwayat" })}>Lihat hasil & riwayat <ArrowRight /></button>
            </div>
          </>
        )}
        {tab === "riwayat" && (
          <>
            <section className="panel">
              <div className="panel-header"><h2>Hasil evaluasi tersimpan</h2></div>
              {results.length ? results.map((s) => (
                <div className="queue-row" key={s.id}>
                  <div>{s.module === "HEA" ? "HEA / Leaderboard" : "Harga Timpang"}<small>{dateTime(s.createdAt)}</small></div>
                  <button className="btn small" onClick={() => setParams({ tab: s.module === "HEA" ? "hea" : "harga", hasil: s.id })}>Buka hasil</button>
                </div>
              )) : <Empty title="Belum ada hasil evaluasi">Hasil muncul setelah data dikonfirmasi dan evaluasi dijalankan.</Empty>}
            </section>
            <section className="panel">
              <h2>Riwayat pengadaan</h2>
              {state.events
              .filter((e) => e.procurementId === p.id)
              .map((e) => (
                <div className="queue-row" key={e.id}>
                  <div>
                    {e.summary}
                    <small>{dateTime(e.createdAt)}</small>
                  </div>
                  <span className="badge">
                    {e.type === "CONFIRMED"
                      ? "Konfirmasi"
                      : e.type === "EXPORTED"
                        ? "Ekspor"
                        : e.type === "EVALUATED"
                          ? "Evaluasi"
                          : "Aktivitas"}
                  </span>
                </div>
              ))}
            </section>
            <div className="stage-navigation">
              <button className="btn" onClick={() => setParams({ tab: "hea" })}>Kembali ke evaluasi</button>
            </div>
          </>
        )}
        <Modal
          open={vendorOpen}
          onOpenChange={setVendorOpen}
          title="Tambah vendor"
          description="Nama vendor merupakan identitas yang digunakan pada hasil evaluasi."
        >
          <form onSubmit={addVendor}>
            <div className="field">
              <label htmlFor="vendorName">Nama badan usaha</label>
              <input
                id="vendorName"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                maxLength={256}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setVendorOpen(false)}
              >
                Batal
              </button>
              <button className="btn primary">Tambah vendor</button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
export function VendorDocuments() {
  const { id, vendorId } = useParams();
  const state = useDemo();
  const procurement = state.procurements.find((p) => p.id === id);
  const vendor = state.vendors.find((v) => v.id === vendorId && v.procurementId === id);
  const backUrl = `/pengadaan/${id}?tab=dokumen`;

  if (!procurement || !vendor) {
    return (
      <div className="page">
        <Empty title="Vendor tidak ditemukan">
          <Link to={backUrl}>Kembali ke unggah & verifikasi</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className="focus-shell vendor-focus-shell">
      <header className="focus-head">
        <div className="review-header-context">
          <Link className="btn quiet review-back" to={backUrl} aria-label="Kembali ke tahap Unggah & verifikasi">
            <ArrowLeft /> Kembali
          </Link>
          <div className="review-heading">
            <h1>{vendor.name}</h1>
            <p>{procurement.number} · {procurement.name}</p>
          </div>
        </div>
      </header>
      <main className="focus-content">
        <section className="panel vendor-workspace">
          <UploadPanel procurementId={procurement.id} vendorId={vendor.id} embedded />
          <DocumentTable documents={state.documents.filter((d) => d.procurementId === id && d.vendorId === vendor.id)} embedded />
        </section>
      </main>
    </div>
  );
}

export function DocumentTable({
  documents,
  embedded = false,
  title = "Daftar Dokumen Vendor",
}: {
  documents: DocumentRecord[];
  embedded?: boolean;
  title?: string;
}) {
  const state = useDemo();
  return (
    <section className={embedded ? "document-table-embedded" : "panel"}>
      <div className="panel-header">
        <h2>{title}</h2>
        <span className="muted">{documents.length} dokumen</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Dokumen</th>
              <th>Vendor</th>
              <th>Jenis</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.name}</strong>
                  <small>
                    {date(d.uploadedAt)} · Revisi {d.revision}
                  </small>
                </td>
                <td>
                  {state.vendors.find((v) => v.id === d.vendorId)?.name ||
                    "Pengadaan"}
                </td>
                <td>{kindLabel[d.kind]}</td>
                <td>
                  <Status value={d.status} />
                </td>
                <td>
                  <Link
                    className="btn small"
                    to={`/pengadaan/${d.procurementId}/review/${d.id}`}
                  >
                    {d.status === "CONFIRMED" ? "Lihat / koreksi" : "Periksa"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!documents.length && (
          <Empty title="Belum ada dokumen">
            Unggah dokumen untuk memulai pemeriksaan.
          </Empty>
        )}
      </div>
    </section>
  );
}
export function UploadPanel({
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
      const document = await demoService.uploadRegisteredDocument({
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
  return (
    <section className={embedded ? "upload-panel-embedded" : "panel"}>
      <div className="panel-header">
        <div>
          <h2>{scope === "procurement" ? "Unggah Owner Estimate (OE)" : "Unggah dokumen"}</h2>
          <p>{scope === "vendor" ? "Pilih Form A5 atau penawaran untuk vendor ini." : "Owner Estimate ditautkan ke seluruh pengadaan."}</p>
        </div>
        <span className="badge">PDF / XLSX · maks. 10 MiB</span>
      </div>
      {scope === "vendor" ? (
        <div className="field document-kind-field">
          <span className="field-label">Jenis dokumen</span>
          <div className="document-kind-actions" role="group" aria-label="Jenis dokumen">
            <button type="button" className={`btn ${kind === "FORM_A5" ? "selected" : ""}`} aria-pressed={kind === "FORM_A5"} disabled={busy} onClick={() => setKind("FORM_A5")}>Form A5 · PDF</button>
            <button type="button" className={`btn ${kind === "OFFER" ? "selected" : ""}`} aria-pressed={kind === "OFFER"} disabled={busy} onClick={() => setKind("OFFER")}>Penawaran vendor · XLSX</button>
          </div>
        </div>
      ) : (
        <div className="procurement-document-kind">
          <span>Jenis dokumen</span>
          <strong>Owner Estimate · XLSX</strong>
        </div>
      )}
      <UploadZone
        ariaLabel="Pilih berkas dokumen"
        accept={kind === "FORM_A5" ? ".pdf" : ".xlsx"}
        disabled={busy}
        onFiles={(files) => {
          if (files[0]) void upload(files[0]);
        }}
      >
        <p>
          <strong>
            {busy
              ? `${processing}…`
              : "Tarik dokumen ke sini atau pilih berkas"}
          </strong>
        </p>
        <small>Dokumen akan diperiksa sebelum digunakan untuk evaluasi.</small>
        {busy && <LoadingState label={processing} />}
      </UploadZone>
      {failure && (
        <ErrorState
          message={`${failure} Pilih berkas kembali untuk mencoba ulang.`}
        />
      )}
    </section>
  );
}
function percentInput(value: string) {
  const [w, f = ""] = value.split(".");
  const padded = f.padEnd(2, "0");
  const whole = (w + padded.slice(0, 2)).replace(/^0+(?=\d)/, "");
  const rest = padded.slice(2).replace(/0+$/, "");
  return (whole || "0") + (rest ? "." + rest : "");
}
function ratioInput(value: string) {
  const v = value.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(v))
    throw new Error("Isi persentase dengan angka 0 hingga 100.");
  const [w, f = ""] = v.split(".");
  const digits = w.padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}${f}`;
}
export function HEAPanel({ procurement: p }: { procurement: Procurement }) {
  const state = useDemo();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const docs = state.documents.filter(
    (d) => d.procurementId === p.id && d.kind === "FORM_A5",
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({
    barang: p.preferences ? percentInput(p.preferences.preferensi_barang) : "",
    jasa: p.preferences ? percentInput(p.preferences.preferensi_jasa) : "",
  });
  const [busy, setBusy] = useState(false);
  const prefDirty =
    prefs.barang !==
      (p.preferences ? percentInput(p.preferences.preferensi_barang) : "") ||
    prefs.jasa !==
      (p.preferences ? percentInput(p.preferences.preferensi_jasa) : "");
  const chosen =
    state.snapshots.find(
      (s) =>
        s.id === params.get("hasil") &&
        s.procurementId === p.id &&
        s.module === "HEA",
    ) ||
    state.snapshots.find((s) => s.procurementId === p.id && s.module === "HEA");
  async function save() {
    try {
      const saved = await demoService.setPreferences(
        p.id,
        {
          preferensi_barang: ratioInput(prefs.barang),
          preferensi_jasa: ratioInput(prefs.jasa),
        },
        p.preferenceRevision,
      );
      if (saved.preferences) {
        setPrefs({
          barang: percentInput(saved.preferences.preferensi_barang),
          jasa: percentInput(saved.preferences.preferensi_jasa),
        });
      }
      toast("Preferensi disimpan. Konfirmasikan nilai yang akan digunakan.");
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  async function confirm() {
    try {
      await demoService.confirmPreferences(p.id, p.preferenceRevision);
      toast("Preferensi pengadaan terkonfirmasi.");
    } catch (e) {
      toast(errorMessage(e), true);
    }
  }
  async function evaluate() {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const s = await demoService.evaluateHEA(p.id, selected);
      setParams({ tab: "hea", hasil: s.id });
      toast("Evaluasi HEA selesai. Hasil tersimpan.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Stepper
        stage={
          chosen
            ? 4
            : p.preferenceConfirmed
              ? 3
              : docs.some((d) => d.status === "CONFIRMED")
                ? 2
                : docs.length
                  ? 1
                  : 0
        }
      />
      {chosen && <ResultPanel snapshot={chosen} procurement={p} />}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Preferensi pengadaan</h2>
            <p>
              Satu pasangan preferensi berlaku untuk seluruh vendor dalam
              evaluasi.
            </p>
          </div>
          <Status
            value={p.preferenceConfirmed ? "CONFIRMED" : "REVIEW_REQUIRED"}
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="pref-barang">Preferensi barang (%)</label>
            <input
              id="pref-barang"
              inputMode="decimal"
              placeholder="Masukkan persentase"
              value={prefs.barang}
              onChange={(e) => setPrefs({ ...prefs, barang: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="pref-jasa">Preferensi jasa (%)</label>
            <input
              id="pref-jasa"
              inputMode="decimal"
              placeholder="Masukkan persentase"
              value={prefs.jasa}
              onChange={(e) => setPrefs({ ...prefs, jasa: e.target.value })}
            />
          </div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={() => void save()}>
            Simpan preferensi
          </button>
          <button
            className="btn"
            disabled={prefDirty || !p.preferences || p.preferenceConfirmed}
            onClick={() => void confirm()}
          >
            <CheckCircle2 />
            Konfirmasi preferensi
          </button>
          <span className="muted">
            {prefDirty
              ? "Perubahan belum disimpan dan dikonfirmasi"
              : `Revisi ${p.preferenceRevision}`}
          </span>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Pilih Form A5 untuk evaluasi</h2>
            <p>Pilih satu dokumen terkonfirmasi untuk setiap vendor.</p>
          </div>
          <button
            className="btn primary"
            disabled={
              busy || prefDirty || !p.preferenceConfirmed || !selected.length
            }
            onClick={() => void evaluate()}
          >
            {busy ? "Mengevaluasi…" : "Evaluasi HEA"}
            <ArrowRight />
          </button>
        </div>
        {docs.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pilih</th>
                  <th>Vendor / dokumen</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${d.name}`}
                        disabled={d.status !== "CONFIRMED"}
                        checked={selected.includes(d.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, d.id]
                              : selected.filter((x) => x !== d.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <strong>
                        {state.vendors.find((v) => v.id === d.vendorId)?.name}
                      </strong>
                      <small>
                        {d.name} · Revisi {d.revision}
                      </small>
                    </td>
                    <td>
                      <Status value={d.status} />
                    </td>
                    <td>
                      <Link
                        className="btn small"
                        to={`/pengadaan/${p.id}/review/${d.id}`}
                      >
                        Periksa dokumen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Form A5 belum tersedia">
            Unggah Form A5 melalui tab Vendor & Dokumen.
          </Empty>
        )}
      </section>
    </>
  );
}
export function PDPanel({ procurement: p }: { procurement: Procurement }) {
  const state = useDemo();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const docs = state.documents.filter((d) => d.procurementId === p.id);
  const [oe, setOe] = useState("");
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const chosen =
    state.snapshots.find(
      (s) =>
        s.id === params.get("hasil") &&
        s.procurementId === p.id &&
        s.module === "PRICE_DEVIATION",
    ) ||
    state.snapshots.find(
      (s) => s.procurementId === p.id && s.module === "PRICE_DEVIATION",
    );
  async function evaluate() {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const s = await demoService.evaluateDeviation(p.id, oe, offer);
      setParams({ tab: "harga", hasil: s.id });
      toast("Evaluasi Harga Timpang selesai.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Stepper stage={chosen ? 4 : oe && offer ? 2 : 0} />
      {chosen && <ResultPanel snapshot={chosen} procurement={p} />}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Sumber perbandingan harga</h2>
            <p>
              Pilih dokumen OE dan satu set penawaran vendor dalam pengadaan
              ini.
            </p>
          </div>
          <button
            className="btn primary"
            disabled={busy || !oe || !offer}
            onClick={() => void evaluate()}
          >
            {busy ? "Mengevaluasi…" : "Evaluasi harga"}
            <ArrowRight />
          </button>
        </div>
        <div className="form-grid">
          {[
            ["OE pengadaan", "OE", oe, setOe],
            ["Penawaran vendor", "OFFER", offer, setOffer],
          ].map(([label, kind, value, setter]) => (
            <div className="field" key={label as string}>
              <label>{label as string}</label>
              <select
                aria-label={label as string}
                value={value as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
              >
                <option value="">Pilih dokumen</option>
                {docs
                  .filter((d) => d.kind === kind)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.status === "CONFIRMED"
                        ? " · Terkonfirmasi"
                        : " · Perlu ditinjau"}
                    </option>
                  ))}
              </select>
              {value && (
                <Link to={`/pengadaan/${p.id}/review/${value}`}>
                  Periksa sumber dan kelompok harga
                </Link>
              )}
            </div>
          ))}
        </div>
        <div className="alert">
          Harga timpang diperiksa per komponen material dan jasa. Pasangan belum
          valid ditampilkan terpisah dan tidak dikategorikan tidak timpang.
        </div>
      </section>
    </>
  );
}
export function ResultPanel({
  snapshot: s,
  procurement: p,
}: {
  snapshot: Snapshot;
  procurement: Procurement;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(false);
  const [filter, setFilter] = useState("");
  async function exportResult() {
    setBusy(true);
    try {
      await downloadSnapshot(s, p);
      await demoService.recordExport(s.id);
      toast("Laporan Excel berhasil dibuat.");
    } catch (e) {
      toast(errorMessage(e), true);
    } finally {
      setBusy(false);
    }
  }
  const rows = s.rows.filter((r) => !filter || r.category === filter);
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>
            {s.module === "HEA" ? "Leaderboard HEA" : "Hasil Harga Timpang"}
          </h2>
          <p>
            {dateTime(s.createdAt)} · {s.id}
          </p>
        </div>
        <div className="toolbar" style={{ margin: 0 }}>
          <Status value={s.status} />
          <button
            className="btn"
            disabled={busy}
            onClick={() => void exportResult()}
          >
            <Download />
            {busy ? "Membuat laporan…" : "Ekspor Excel"}
          </button>
        </div>
      </div>
      {s.excluded.length > 0 && (
        <div className="alert">
          Hasil parsial · Belum dievaluasi: {s.excluded.join(", ")}.
        </div>
      )}
      {s.module === "HEA" ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Peringkat</th>
                <th>Vendor</th>
                <th className="numeric">Harga Evaluasi Akhir</th>
                <th>Sumber</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span className="result-rank">{r.rank}</span>
                  </td>
                  <td>
                    <strong>{r.vendorName}</strong>
                  </td>
                  <td className="numeric" title={r.hea}>
                    {roundedMoney(r.hea)}
                    <small>Urutan berdasarkan nilai berpresisi penuh</small>
                  </td>
                  <td>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="stats category-stats">
            {(["MATERIAL", "SERVICE"] as const).map((c) => (
              <div className="stat" key={c}>
                <span>{c === "MATERIAL" ? "Material" : "Jasa"}</span>
                <strong>
                  {
                    s.rows.filter(
                      (r) => r.category === c && r.classification === "TIMPANG",
                    ).length
                  }
                </strong>
                <small>
                  komponen timpang dari{" "}
                  {s.rows.filter((r) => r.category === c).length} terverifikasi
                </small>
              </div>
            ))}
          </div>
          <div className="toolbar">
            <select
              aria-label="Filter kategori hasil"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Material & jasa</option>
              <option value="MATERIAL">Material</option>
              <option value="SERVICE">Jasa</option>
            </select>
            <span className="muted">
              {rows.length} komponen ·{" "}
              {rows.filter((r) => r.classification === "TIMPANG").length}{" "}
              timpang
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Item / kategori</th>
                  <th className="numeric">OE</th>
                  <th className="numeric">Penawaran</th>
                  <th className="numeric">Terhadap OE</th>
                  <th>Klasifikasi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{r.description}</strong>
                      <small>
                        {r.category === "MATERIAL" ? "Material" : "Jasa"} ·{" "}
                        {r.unit}
                      </small>
                    </td>
                    <td className="numeric">{money(r.oe)}</td>
                    <td className="numeric">{money(r.offer)}</td>
                    <td className="numeric">
                      {r.percentageAgainstOE ? pct(r.percentageAgainstOE) : "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${r.classification === "TIMPANG" ? "warning" : "success"}`}
                      >
                        {r.classification === "TIMPANG"
                          ? "Timpang"
                          : "Tidak timpang"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="toolbar" style={{ marginTop: 20 }}>
        <button className="inline-link" onClick={() => setDetail(!detail)}>
          {detail ? "Tutup rincian" : "Lihat input dan jejak sumber"}
        </button>
        <span className="muted">
          Hasil evaluasi mendukung pemeriksaan; tidak menetapkan pemenang.
        </span>
      </div>
      {detail && (
        <div className="alert">
          <p>{s.policy}</p>
          <SnapshotInputs value={s.inputs} />
        </div>
      )}
    </section>
  );
}
