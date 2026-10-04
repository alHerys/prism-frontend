import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CircleNotch } from "@phosphor-icons/react/dist/csr/CircleNotch";
import { CloudArrowUp } from "@phosphor-icons/react/dist/csr/CloudArrowUp";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Sparkle } from "@phosphor-icons/react/dist/csr/Sparkle";
import { useState } from "react";
import {
  type HistoricalItem,
  type Snapshot
} from "../domain";
import { useSessionService, useSessionState } from "../services/session-context";
import type { SessionService } from "../services/session-service";
import { bankMoney as money } from "../shared/formatters/display";
import "../shared/styles/bank.css";
import { HeaderAction, PageTabs } from "../shared/ui/components";
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export interface BankPageProps {
  service?: SessionService;
  onExport?: (snapshot: Snapshot) => Promise<void> | void;
}
export function BankPage({ service: serviceOverride, onExport }: BankPageProps) {
  const service = useSessionService(serviceOverride);
  const state = useSessionState(service);
  const preparedEstimate = state.estimates[0];
  const [tab, setTab] = useState(preparedEstimate ? "Statistik Harga" : "Dokumen Historis");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [functionFilter, setFunctionFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() => preparedEstimate?.referenceIds ?? []);
  const [detail, setDetail] = useState<HistoricalItem>();
  const [showUpload, setShowUpload] = useState(false);
  const [draftId, setDraftId] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [period, setPeriod] = useState("");
  const [procurementId, setProcurementId] = useState(
    state.procurements[0]?.id ?? "",
  );
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [need, setNeed] = useState(preparedEstimate?.description ?? "");
  const [unit, setUnit] = useState(preparedEstimate?.unit ?? "m²");
  const [quantity, setQuantity] = useState(preparedEstimate?.quantity ?? "");
  const [estimateId, setEstimateId] = useState(preparedEstimate?.id ?? "");
  const draft = state.documents.find((d) => d.id === draftId);
  const estimate = state.estimates.find((e) => e.id === estimateId);
  const filtered = state.historicalItems.filter(
    (item) =>
      `${item.description} ${item.documentName}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")) &&
      (!year || item.period === year) &&
      (!functionFilter || item.functionName === functionFilter),
  );
  const selected = state.historicalItems.filter((item) =>
    selectedIds.includes(item.id),
  );
  const statistics = service.getPreparedStatistics(selectedIds);
  const statsReady = !!statistics;
  const years = [
    ...new Set(state.historicalItems.map((item) => item.period)),
  ].sort();
  const functions = [
    ...new Set(state.historicalItems.map((item) => item.functionName)),
  ];
  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Proses belum berhasil. Silakan coba kembali.",
      );
    } finally {
      setBusy("");
    }
  };
  const toggle = (id: string) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  const upload = async (file?: File) => {
    if (!file) return;
    await run("Membaca dokumen", async () => {
      const { processDemoDocument } = await import("../services/document-processing");
      const registered = await processDemoDocument(file, "HISTORICAL_OE", setBusy);
      const record = await service.uploadRegisteredDocument({
        procurementId,
        kind: "HISTORICAL_OE",
        fixtureId: registered.id,
        name: file.name,
      });
      setDraftId(record.id);
      setPeriod(record.period ?? "");
      setFunctionName("");
      setShowUpload(false);
      setNotice(
        "Dokumen selesai dibaca. Periksa metadata dan sumber sebelum publikasi.",
      );
    });
  };
  const saveDraft = async () => {
    if (!draft) return;
    await run("Menyimpan perubahan", async () => {
      await service.setHistoricalMetadata(
        draft.id,
        { functionName, period },
        draft.revision,
      );
      setNotice("Metadata tersimpan. Konfirmasi dokumen sebelum publikasi.");
    });
  };
  const confirmDraft = async () => {
    if (!draft) return;
    await run("Mengonfirmasi dokumen", async () => {
      await service.confirmDocument(draft.id, draft.revision, true);
      setNotice("Dokumen terkonfirmasi dan siap dipublikasikan.");
    });
  };
  const publishDraft = async () => {
    if (!draft) return;
    await run("Mempublikasikan dokumen", async () => {
      await service.publishHistory(draft.id, draft.revision);
      setNotice("Dokumen telah ditambahkan ke Bank Data OE.");
      setDraftId("");
    });
  };
  const exportStats = async () => {
    await run("Menyiapkan laporan", async () => {
      const result = await service.createBankSnapshot(selectedIds);
      if (onExport) await onExport(result);
      else {
        const { downloadSnapshot } = await import("../services/export/workbook.ts");
        const p = state.procurements.find((p) => p.id === result.procurementId);
        await downloadSnapshot(
          result,
          p ?? { name: "Bank Data OE", number: "OE-HISTORIS" },
        );
        await service.recordExport(result.id);
      }
      setNotice("Laporan referensi berhasil disiapkan.");
    });
  };
  return (
    <div className="page bank-page">
      <HeaderAction>
        <button
          className="btn primary"
          onClick={() => {
            setShowUpload(!showUpload);
            setDraftId("");
            setError("");
          }}
        >
          <Plus size={17} />
          Tambah dokumen historis
        </button>
      </HeaderAction>
      <PageTabs
        ariaLabel="Bagian Bank Data OE"
        value={tab}
        items={[
          "Dokumen Historis",
          "Pencarian Referensi",
          "Statistik Harga",
          "Bantuan Estimasi",
        ].map((label) => ({ label, value: label }))}
        onValueChange={(value) => {
          setTab(value);
          setDetail(undefined);
          setError("");
        }}
      >
        {error && (
          <p role="alert" className="bank-notice bank-error">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="bank-notice">
            {notice}
          </p>
        )}
        {busy && (
          <p role="status" className="bank-notice">
            <CircleNotch size={16} className="spin" /> {busy}…
          </p>
        )}
        {showUpload && (
          <section className="panel">
            <div className="bank-section-heading">
              <div>
                <h2>Unggah OE historis</h2>
                <p className="muted">
                  Periksa dokumen dan metadata sebelum menjadi referensi.
                </p>
              </div>
              <button className="btn" onClick={() => setShowUpload(false)}>
                Tutup
              </button>
            </div>
            <div className="bank-draft-form">
              <label className="field">
                Pengadaan sumber
                <select
                  value={procurementId}
                  onChange={(e) => setProcurementId(e.target.value)}
                >
                  {state.procurements.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="bank-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!busy) void upload(e.dataTransfer.files[0]);
                }}
              >
                <CloudArrowUp size={28} />
                <strong>Pilih file atau tarik dokumen ke sini</strong>
                <span className="muted">
                  OE dalam format XLSX · maksimal 10 MiB
                </span>
                <input
                  aria-label="Pilih OE historis"
                  type="file"
                  accept=".xlsx"
                  disabled={!!busy || !procurementId}
                  onChange={(e) => {
                    void upload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>
        )}
        {tab === "Dokumen Historis" &&
          state.documents.some(
            (d) => d.kind === "HISTORICAL_OE" && !d.published,
          ) && (
            <section className="panel">
              <div className="bank-section-heading">
                <h2>Draft belum dipublikasikan</h2>
              </div>
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Dokumen</th>
                      <th>Fungsi / periode</th>
                      <th>Status</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.documents
                      .filter((d) => d.kind === "HISTORICAL_OE" && !d.published)
                      .map((d) => (
                        <tr key={d.id}>
                          <td>
                            <div className="bank-document-identity">
                              <span className="bank-document-icon">
                                <FileXls size={23} />
                              </span>
                              <strong>{d.name}</strong>
                            </div>
                          </td>
                          <td>
                            {d.functionName || "Belum diisi"} ·{" "}
                            {d.period || "Belum diisi"}
                          </td>
                          <td>
                            <span className="badge warning">
                              {d.status === "CONFIRMED"
                                ? "Siap publikasi"
                                : "Perlu ditinjau"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn"
                              onClick={() => {
                                setDraftId(d.id);
                                setFunctionName(d.functionName ?? "");
                                setPeriod(d.period ?? "");
                              }}
                            >
                              Review dokumen <ArrowUpRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        {draft && (
          <section className="panel">
            <div className="bank-section-heading">
              <div>
                <h2>Review dokumen historis</h2>
                <p className="muted">
                  {draft.name} · revisi {draft.revision}
                </p>
              </div>
              <span
                className={`badge ${draft.status === "CONFIRMED" ? "success" : "warning"}`}
              >
                {draft.status === "CONFIRMED"
                  ? "Terkonfirmasi"
                  : "Perlu ditinjau"}
              </span>
            </div>
            <ol
              className="bank-publication-stages"
              aria-label="Tahap publikasi historis"
            >
              <li data-complete={!!draft.functionName && !!draft.period}>
                Lengkapi metadata
              </li>
              <li data-complete={draft.status === "CONFIRMED"}>
                Konfirmasi dokumen
              </li>
              <li>Publikasikan referensi</li>
            </ol>
            <div className="bank-two-col bank-details">
              <div>
                <h3 className="bank-source-title">
                  <FileXls size={20} /> Bukti sumber
                </h3>
                <p className="muted">
                  {[
                    ...new Set(draft.sources.map((source) => source.location)),
                  ].join(" · ") || "Periksa berkas sumber"}
                </p>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pekerjaan</th>
                      <th>Satuan</th>
                      <th>Harga satuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.historicalItems?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{item.unit}</td>
                        <td className="numeric">{money(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bank-draft-form">
                <label className="field">
                  Fungsi
                  <input
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                    placeholder="Masukkan fungsi pemilik OE"
                  />
                </label>
                <label className="field">
                  Periode
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="Tahun sumber dokumen"
                  />
                </label>
                <div className="toolbar">
                  <button
                    className="btn"
                    disabled={!!busy || !functionName || !period}
                    onClick={saveDraft}
                  >
                    Simpan metadata
                  </button>
                  <button
                    className="btn"
                    disabled={
                      !!busy ||
                      !draft.functionName ||
                      draft.functionName !== functionName ||
                      draft.period !== period ||
                      draft.status === "CONFIRMED"
                    }
                    onClick={confirmDraft}
                  >
                    <CheckCircle size={16} />
                    Konfirmasi
                  </button>
                  <button
                    className="btn primary"
                    disabled={
                      !!busy ||
                      draft.status !== "CONFIRMED" ||
                      draft.functionName !== functionName ||
                      draft.period !== period
                    }
                    onClick={publishDraft}
                  >
                    Publikasikan
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
        {tab !== "Bantuan Estimasi" && (
          <section className="bank-filters">
            <label className="bank-search">
              <MagnifyingGlass size={17} />
              <input
                aria-label="Cari referensi OE"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari pekerjaan atau nama dokumen…"
              />
            </label>
            <label className="field">
              Fungsi
              <select
                value={functionFilter}
                onChange={(e) => setFunctionFilter(e.target.value)}
              >
                <option value="">Semua fungsi</option>
                {functions.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Periode
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Semua periode</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
          </section>
        )}
        {(tab === "Dokumen Historis" || tab === "Pencarian Referensi") && (
          <section className="panel">
            <div className="bank-section-heading">
              <div>
                <h2>
                  {tab === "Dokumen Historis"
                    ? "Dokumen terpublikasi"
                    : "Referensi harga satuan"}
                </h2>
                <p className="muted">{filtered.length} referensi tersedia</p>
              </div>
            </div>
            {filtered.length ? (
              <ReferenceTable
                items={filtered}
                selected={selectedIds}
                toggle={toggle}
                onDetail={setDetail}
                onCompare={(id, value) =>
                  run("Memperbarui kesebandingan", () =>
                    service.setComparable(id, value),
                  )
                }
                showSelection={tab === "Pencarian Referensi"}
              />
            ) : (
              <Empty
                title="Referensi belum ditemukan"
                text="Ubah kata pencarian atau filter fungsi dan periode."
              />
            )}
            {tab === "Pencarian Referensi" && (
              <div className="bank-reference-selection">
                <span>
                  {selected.length} referensi dipilih ·{" "}
                  {selected.filter((i) => i.comparable).length} dinyatakan
                  sebanding
                </span>
                <button
                  className="btn primary"
                  disabled={!selected.length}
                  onClick={() => setTab("Statistik Harga")}
                >
                  Lihat statistik <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}
        {detail && (
          <section className="panel">
            <div className="bank-section-heading">
              <h2>Jejak sumber referensi</h2>
              <button className="btn" onClick={() => setDetail(undefined)}>
                Tutup rincian
              </button>
            </div>
            <div className="bank-details">
              <dl>
                <dt>Dokumen</dt>
                <dd>{detail.documentName}</dd>
                <dt>Pekerjaan</dt>
                <dd>{detail.description}</dd>
                <dt>Fungsi / periode</dt>
                <dd>
                  {detail.functionName} · {detail.period}
                </dd>
                <dt>Sumber</dt>
                <dd>{detail.source}</dd>
                <dt>Harga satuan</dt>
                <dd>
                  {money(detail.price)} / {detail.unit}
                </dd>
              </dl>
              <p className="bank-subtle muted">
                Periksa lingkup pekerjaan, spesifikasi, satuan, dan konteks
                periode sebelum menyatakan referensi sebanding.
              </p>
              <label className="bank-comparability">
                <input
                  type="checkbox"
                  checked={
                    state.historicalItems.find((i) => i.id === detail.id)
                      ?.comparable ?? false
                  }
                  onChange={(e) =>
                    void run("Memperbarui kesebandingan", () =>
                      service.setComparable(detail.id, e.target.checked),
                    )
                  }
                />
                Saya telah memeriksa kesebandingan item ini
              </label>
            </div>
          </section>
        )}
        {tab === "Statistik Harga" && (
          <section className="panel">
            <div className="bank-section-heading">
              <div>
                <h2>Perkembangan harga referensi</h2>
                <p className="muted">
                  Referensi yang dipilih pada Pencarian Referensi.
                </p>
              </div>
              <button
                className="btn"
                disabled={!statsReady || !!busy}
                onClick={exportStats}
              >
                <DownloadSimple size={16} />
                Ekspor Excel
              </button>
            </div>
            {statistics ? (
              <>
                <div className="bank-stat-strip bank-price-stats">
                  <div>
                    <span className="muted">Minimum / {statistics.unit}</span>
                    <strong>{money(statistics.min)}</strong>
                  </div>
                  <div>
                    <span className="muted">Median / {statistics.unit}</span>
                    <strong>{money(statistics.median)}</strong>
                  </div>
                  <div>
                    <span className="muted">Maksimum / {statistics.unit}</span>
                    <strong>{money(statistics.max)}</strong>
                  </div>
                </div>
                <figure className="bank-figure">
                  <svg
                    className="bank-chart"
                    viewBox="0 0 720 220"
                    role="img"
                    aria-label={`Harga ${statistics.description.toLowerCase()}: ${statistics.observations.map((item) => `${item.period} ${money(item.price)}`).join(", ")}`}
                  >
                    {statistics.chart.ticks.map((tick) => (
                      <g key={tick.price}>
                        <line
                          x1="80"
                          y1={tick.y}
                          x2="650"
                          y2={tick.y}
                          stroke="#e2e8f0"
                        />
                        <text x="0" y={tick.y + 4}>
                          {money(tick.price)}
                        </text>
                      </g>
                    ))}
                    <path
                      d={statistics.chart.points
                        .map(
                          (point, index) =>
                            `${index ? "L" : "M"}${point.x} ${point.y}`,
                        )
                        .join(" ")}
                    />
                    {statistics.chart.points.map((point) => (
                      <g key={point.period}>
                        <circle cx={point.x} cy={point.y} r="5" />
                        <text x={point.x} y="208" textAnchor="middle">
                          {point.period}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <figcaption>
                    {statistics.description} · rupiah per {statistics.unit}.
                    Harga historis bukan penetapan harga pasar.
                  </figcaption>
                </figure>
                <ReferenceTable
                  items={selected}
                  selected={selectedIds}
                  toggle={toggle}
                  onDetail={setDetail}
                  onCompare={(id, value) =>
                    run("Memperbarui kesebandingan", () =>
                      service.setComparable(id, value),
                    )
                  }
                />
              </>
            ) : (
              <Empty
                title={
                  selected.length === 1
                    ? "Satu pengamatan belum membentuk tren"
                    : "Pilih referensi yang sebanding"
                }
                text="Pilih tiga pengamatan lintas periode dan periksa kesebandingannya melalui Pencarian Referensi."
              />
            )}
            <div className="bank-reference-selection">
              <button
                className="btn"
                onClick={() => setTab("Pencarian Referensi")}
              >
                Atur referensi
              </button>
              <button
                className="btn primary"
                disabled={!statsReady}
                onClick={() => setTab("Bantuan Estimasi")}
              >
                Lanjut ke bantuan estimasi <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
        )}
        {tab === "Bantuan Estimasi" && (
          <>
            <section className="panel">
              <div className="bank-section-heading">
                <div>
                  <h2>Susun kebutuhan estimasi</h2>
                  <p className="muted">
                    Gunakan referensi yang telah diperiksa untuk membantu
                    penyusunan OE.
                  </p>
                </div>
                <Sparkle size={20} />
              </div>
              <form
                className="bank-details"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run("Menelaah referensi dan kebutuhan", async () => {
                    await pause(800);
                    const result = await service.estimate({
                      description: need,
                      unit,
                      quantity,
                      referenceIds: selectedIds,
                    });
                    setEstimateId(result.id);
                    setNotice(
                      "Estimasi selesai. Tinjau sumber dan batas penggunaannya.",
                    );
                  });
                }}
              >
                <div className="bank-estimate-inputs">
                  <label className="field">
                    Uraian pekerjaan
                    <input
                      required
                      value={need}
                      onChange={(e) => setNeed(e.target.value)}
                      placeholder="Contoh: Pengecatan tangki"
                    />
                  </label>
                  <label className="field">
                    Satuan
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    >
                      <option>m²</option>
                      <option>m</option>
                      <option>unit</option>
                    </select>
                  </label>
                  <label className="field">
                    Kuantitas
                    <input
                      required
                      inputMode="decimal"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Masukkan jumlah"
                    />
                  </label>
                </div>
                <p className="muted bank-subtle">
                  {selected.length} referensi dipilih. Referensi harus memiliki
                  satuan, lingkup, dan spesifikasi yang sebanding.
                </p>
                <div className="toolbar">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setTab("Pencarian Referensi")}
                  >
                    Pilih referensi
                  </button>
                  <button
                    className="btn primary"
                    disabled={!!busy || !selected.length}
                  >
                    <Sparkle size={16} />
                    Buat estimasi
                  </button>
                </div>
              </form>
            </section>
            {estimate && (
              <section className="panel">
                <div className="bank-section-heading">
                  <div>
                    <h2>Hasil estimasi · {estimate.description}</h2>
                    <p className="muted">
                      {estimate.referenceIds.length} referensi · dibuat{" "}
                      {new Date(estimate.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="bank-details">
                  <dl>
                    <dt>Harga satuan</dt>
                    <dd>
                      <strong>
                        {money(estimate.unitPrice)} / {estimate.unit}
                      </strong>
                    </dd>
                    <dt>Kuantitas</dt>
                    <dd>
                      {estimate.quantity} {estimate.unit}
                    </dd>
                    <dt>Estimasi total</dt>
                    <dd>
                      <strong>{money(estimate.total)}</strong>
                    </dd>
                    <dt>Rentang referensi</dt>
                    <dd>
                      {money(estimate.min)} – {money(estimate.max)} /{" "}
                      {estimate.unit}
                    </dd>
                  </dl>
                  <p className="bank-notice">
                    Estimasi menggunakan median tiga referensi historis. Tinjau
                    kondisi lokasi, spesifikasi, dan periode sebelum digunakan
                    dalam penyusunan OE. Hasil ini memerlukan keputusan
                    evaluator.
                  </p>
                </div>
              </section>
            )}
          </>
        )}
      </PageTabs>
    </div>
  );
}
function ReferenceTable({
  items,
  selected,
  toggle,
  onDetail,
  onCompare,
  showSelection = false,
}: {
  items: HistoricalItem[];
  selected: string[];
  toggle: (id: string) => void;
  onDetail: (item: HistoricalItem) => void;
  onCompare: (id: string, value: boolean) => Promise<void>;
  showSelection?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="table bank-reference-table">
        <thead>
          <tr>
            {showSelection && <th>Pilih</th>}
            <th>Dokumen / pekerjaan</th>
            <th>Fungsi</th>
            <th>Periode</th>
            <th className="numeric">Harga satuan</th>
            <th>Kesebandingan</th>
            <th>Sumber</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {showSelection && (
                <td>
                  <input
                    aria-label={`Pilih ${item.documentName}`}
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                </td>
              )}
              <td>
                <div className="bank-document-identity">
                  <span className="bank-document-icon">
                    <FileXls size={23} />
                  </span>
                  <div>
                    <strong>{item.description}</strong>
                    <div className="muted bank-meta">{item.documentName}</div>
                  </div>
                </div>
              </td>
              <td>{item.functionName}</td>
              <td>{item.period}</td>
              <td className="numeric nowrap">
                {money(item.price)}
                <div className="muted bank-meta">per {item.unit}</div>
              </td>
              <td>
                <label className="bank-comparability">
                  <input
                    type="checkbox"
                    aria-label={`Sebanding ${item.documentName}`}
                    checked={item.comparable}
                    onChange={(e) => void onCompare(item.id, e.target.checked)}
                  />
                  {item.comparable ? "Sebanding" : "Perlu ditinjau"}
                </label>
              </td>
              <td className="bank-action-cell">
                <button className="btn" onClick={() => onDetail(item)}>
                  Lihat sumber <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <FileXls size={28} />
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  );
}
export default BankPage;
