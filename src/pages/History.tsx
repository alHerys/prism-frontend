import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { ClipboardText } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { Clock } from "@phosphor-icons/react/dist/csr/Clock";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { useMemo, useState } from "react";
import { useSessionService, useSessionState } from "../services/session-context";
import type { SessionService } from "../services/session-service";
import { exactMoney, roundedMoney, historyTime as time } from "../shared/formatters/display";
import type { Snapshot } from "../shared/model/session";
import { SnapshotInputs } from "../shared/snapshot/SnapshotInputs";
import { PageTabs } from "../shared/ui/components";

import "../shared/styles/bank.css";
const moduleLabel: Record<string, string> = {
  HEA: "HEA",
  PRICE_DEVIATION: "Harga Timpang",
  BANK: "Bank Data OE",
  PROCUREMENT: "Pengadaan",
};
const eventLabel: Record<string, string> = {
  CREATED: "Pengadaan dibuat",
  VENDOR_ADDED: "Vendor ditambahkan",
  UPLOADED: "Dokumen diunggah",
  CORRECTED: "Data dikoreksi",
  CONFIRMED: "Data dikonfirmasi",
  EVALUATED: "Evaluasi selesai",
  PUBLISHED: "OE dipublikasikan",
  ESTIMATED: "Estimasi selesai",
  EXPORTED: "Laporan diekspor",
  PREFERENCES_UPDATED: "Preferensi diperbarui",
  PREFERENCES_CONFIRMED: "Preferensi dikonfirmasi",
  METADATA_UPDATED: "Metadata diperbarui",
  GROUP_SELECTED: "Kelompok harga dipilih",
};
const categoryLabel: Record<string, string> = {
  MATERIAL: "Material",
  SERVICE: "Jasa",
};
const classificationLabel: Record<string, string> = {
  TIMPANG: "Timpang",
  TIDAK_TIMPANG: "Tidak timpang",
};
export interface HistoryPageProps {
  service?: SessionService;
  onOpenResult?: (id: string) => void;
  onExport?: (snapshot: Snapshot) => Promise<void> | void;
}
export function HistoryPage({
  service: serviceOverride,
  onOpenResult,
  onExport,
}: HistoryPageProps) {
  const service = useSessionService(serviceOverride);
  const state = useSessionState(service);
  const [tab, setTab] = useState("Aktivitas");
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("");
  const [procurement, setProcurement] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selected, setSelected] = useState<Snapshot>();
  const [notice, setNotice] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [noticeError, setNoticeError] = useState(false);
  const localDay = (date: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  const matchesDate = (date: string) =>
    (!start || localDay(date) >= start) && (!end || localDay(date) <= end);
  const events = state.events.filter(
    (event) =>
      (!module || event.module === module) &&
      (!procurement || event.procurementId === procurement) &&
      matchesDate(event.createdAt) &&
      `${event.summary} ${event.type}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")),
  );
  const results = state.snapshots.filter(
    (result) =>
      (!module || result.module === module) &&
      (!procurement || result.procurementId === procurement) &&
      matchesDate(result.createdAt) &&
      `${moduleLabel[result.module]} ${state.procurements.find((p) => p.id === result.procurementId)?.name ?? ""}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")),
  );
  const activityChart = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const day = localDay(event.createdAt);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return [...counts].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  }, [events]);
  const maxCount = Math.max(1, ...activityChart.map(([, count]) => count));
  const visibleDocuments = state.documents.filter(
    (d) =>
      (!procurement || d.procurementId === procurement) &&
      matchesDate(d.uploadedAt) &&
      (!module ||
        (d.kind === "FORM_A5"
          ? "HEA"
          : d.kind === "HISTORICAL_OE"
            ? "BANK"
            : "PRICE_DEVIATION") === module),
  );
  const procurementName = (id?: string) =>
    state.procurements.find((p) => p.id === id)?.name ?? "Bank Data OE";
  const exportSelected = async () => {
    if (!selected || exportBusy) return;
    setExportBusy(true);
    setNoticeError(false);
    setNotice("");
    try {
      if (onExport) await onExport(selected);
      else {
        const { downloadSnapshot } = await import("../services/export/workbook.ts");
        const p = state.procurements.find(
          (p) => p.id === selected.procurementId,
        );
        await downloadSnapshot(
          selected,
          p ?? { name: "Bank Data OE", number: "OE-HISTORIS" },
        );
        await service.recordExport(selected.id);
      }
      setNotice("Laporan berhasil disiapkan.");
    } catch (error) {
      setNoticeError(true);
      setNotice(
        error instanceof Error
          ? error.message
          : "Laporan belum dapat dibuat. Silakan coba kembali.",
      );
    } finally {
      setExportBusy(false);
    }
  };
  return (
    <div className="page bank-page bank-history">
      <PageTabs
        ariaLabel="Bagian riwayat"
        value={tab}
        items={["Aktivitas", "Hasil Evaluasi", "Statistik Aktivitas"].map(
          (label) => ({ label, value: label }),
        )}
        onValueChange={(value) => {
          setTab(value);
          setSelected(undefined);
        }}
      >
        <section className="bank-filters" aria-label="Filter riwayat">
          <label className="bank-search">
            <MagnifyingGlass size={17} />
            <input
              aria-label="Cari aktivitas atau hasil"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari aktivitas atau pengadaan…"
            />
          </label>
          <label className="field">
            Modul
            <select value={module} onChange={(e) => setModule(e.target.value)}>
              <option value="">Semua modul</option>
              {Object.entries(moduleLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Pengadaan
            <select
              value={procurement}
              onChange={(e) => setProcurement(e.target.value)}
            >
              <option value="">Semua pengadaan</option>
              {state.procurements.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Dari tanggal
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="field">
            Sampai tanggal
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </section>
        {notice && (
          <p
            role={noticeError ? "alert" : "status"}
            className={`bank-notice ${noticeError ? "bank-error" : ""}`}
          >
            {notice}
          </p>
        )}
        {tab === "Aktivitas" && (
          <section className="panel">
            <div className="bank-section-heading">
              <h2>Catatan aktivitas</h2>
              <span className="muted">{events.length} aktivitas</span>
            </div>
            {events.length ? (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Aktivitas</th>
                      <th>Pengadaan</th>
                      <th>Modul</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...events]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .map((event) => (
                        <tr key={event.id}>
                          <td className="nowrap">{time(event.createdAt)}</td>
                          <td>
                            <div className="bank-document-identity">
                              <span className="bank-document-icon">
                                <Clock size={22} />
                              </span>
                              <div>
                                <strong>{event.summary}</strong>
                                <div className="muted bank-meta">
                                  {eventLabel[event.type] ?? "Perubahan data"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{procurementName(event.procurementId)}</td>
                          <td>
                            <span className="badge">
                              {moduleLabel[event.module]}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Belum ada aktivitas pada pilihan ini"
                text="Ubah filter atau mulai pekerjaan melalui Pengadaan dan Bank Data OE."
              />
            )}
          </section>
        )}
        {tab === "Hasil Evaluasi" && (
          <section className="panel">
            <div className="bank-section-heading">
              <h2>Hasil evaluasi tersimpan</h2>
              <span className="muted">{results.length} hasil</span>
            </div>
            {results.length ? (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Pengadaan</th>
                      <th>Evaluasi</th>
                      <th>Waktu</th>
                      <th>Status</th>
                      <th>Rincian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...results]
                      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                      .map((result) => (
                        <tr key={result.id}>
                          <td>
                            <strong>
                              {procurementName(result.procurementId)}
                            </strong>
                            <div className="muted bank-meta">
                              {result.rows.length} baris hasil
                            </div>
                          </td>
                          <td>{moduleLabel[result.module]}</td>
                          <td>{time(result.createdAt)}</td>
                          <td>
                            <span
                              className={`badge ${result.status === "COMPLETE" ? "success" : "warning"}`}
                            >
                              {result.status === "COMPLETE"
                                ? "Lengkap"
                                : "Parsial"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn"
                              onClick={() => setSelected(result)}
                            >
                              Lihat hasil <ArrowUpRight size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="Belum ada hasil evaluasi"
                text="Hasil yang berhasil dibuat akan tersimpan di sini beserta input dan sumbernya."
              />
            )}
          </section>
        )}
        {tab === "Statistik Aktivitas" && (
          <>
            <section className="panel bank-stat-strip">
              {[
                {
                  label: "Pengadaan terkait",
                  value: new Set(
                    events
                      .filter((e) => e.procurementId)
                      .map((e) => e.procurementId),
                  ).size,
                  icon: ClipboardText,
                },
                {
                  label: "Aktivitas tercatat",
                  value: events.length,
                  icon: Clock,
                },
                {
                  label: "Hasil evaluasi",
                  value: results.length,
                  icon: FileText,
                },
                {
                  label: "Dokumen diproses",
                  value: visibleDocuments.length,
                  icon: FileText,
                },
                {
                  label: "Dokumen perlu review",
                  value: visibleDocuments.filter(
                    (d) => d.status === "REVIEW_REQUIRED",
                  ).length,
                  icon: ClipboardText,
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <stat.icon size={20} />
                  <span className="muted">{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </section>
            <section className="panel">
              <div className="bank-section-heading">
                <div>
                  <h2>Aktivitas per hari</h2>
                  <p className="muted">
                    Jumlah aktivitas sesuai filter yang dipilih.
                  </p>
                </div>
              </div>
              {activityChart.length ? (
                <>
                  <div
                    className="bank-bars"
                    role="img"
                    aria-label={`Aktivitas per hari: ${activityChart.map(([day, count]) => `${day}: ${count}`).join(", ")}`}
                  >
                    {activityChart.map(([day, count]) => (
                      <div className="bank-bar-column" key={day}>
                        <strong>{count}</strong>
                        <div
                          className="bank-bar"
                          style={{
                            height: `${Math.max(8, (count / maxCount) * 140)}px`,
                          }}
                        />
                        <span>
                          {day.slice(8, 10)}/{day.slice(5, 7)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Jumlah aktivitas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityChart.map(([day, count]) => (
                        <tr key={day}>
                          <td>
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "medium",
                            }).format(new Date(`${day}T12:00:00`))}
                          </td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <Empty
                  title="Belum cukup aktivitas untuk ditampilkan"
                  text="Aktivitas yang tercatat akan membentuk grafik dan rincian di halaman ini."
                />
              )}
            </section>
          </>
        )}
        {selected && (
          <section
            className="panel bank-result-detail"
            aria-label="Rincian snapshot"
          >
            <div className="bank-section-heading">
              <div>
                <h2>
                  {moduleLabel[selected.module]} ·{" "}
                  {procurementName(selected.procurementId)}
                </h2>
                <p className="muted">
                  Hasil tersimpan {time(selected.createdAt)} · {selected.id}
                </p>
              </div>
              <button className="btn" onClick={() => setSelected(undefined)}>
                Tutup rincian
              </button>
            </div>
            <p>{selected.policy}</p>
            {selected.excluded.length > 0 && (
              <p className="bank-notice">
                Tidak disertakan: {selected.excluded.join(", ")}
              </p>
            )}
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor / item</th>
                    <th>Kategori</th>
                    <th>HEA / penawaran</th>
                    <th>Klasifikasi</th>
                    <th>Sumber</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.rows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.vendorName ?? row.description}</td>
                      <td>
                        {row.category
                          ? (categoryLabel[row.category] ?? row.category)
                          : "—"}
                      </td>
                      <td
                        className="numeric"
                        title={exactMoney(row.hea ?? row.offer)}
                      >
                        {roundedMoney(row.hea ?? row.offer)}
                      </td>
                      <td>
                        {row.classification
                          ? (classificationLabel[row.classification] ??
                            row.classification)
                          : row.rank
                            ? `Peringkat ${row.rank}`
                            : "—"}
                      </td>
                      <td>{row.source ?? "Form A5 terkonfirmasi"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details className="bank-input-details">
              <summary>Input dan revisi saat evaluasi</summary>
              <SnapshotInputs value={selected.inputs} />
            </details>
            <div className="toolbar">
              {onOpenResult && (
                <button
                  className="btn"
                  onClick={() => onOpenResult(selected.id)}
                >
                  Buka dalam pengadaan <ArrowUpRight size={16} />
                </button>
              )}
              <button
                className="btn primary"
                onClick={exportSelected}
                disabled={exportBusy}
                aria-busy={exportBusy}
              >
                <DownloadSimple size={16} />
                {exportBusy ? "Menyiapkan laporan…" : "Ekspor Excel"}
              </button>
            </div>
          </section>
        )}
      </PageTabs>
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Clock size={26} />
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  );
}
export default HistoryPage;
