import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Link } from "react-router";
import { dateTime } from "../../shared/formatters/display";
import "../../shared/styles/focus.css";
import { Empty, Modal } from "../../shared/ui/feedback";
import { HEAPanel } from "../hea/HEAPanel";
import { PDPanel } from "../price-deviation/PDPanel";
import { DocumentTable } from "../../modules/documents/presentation/DocumentTable";
import { UploadPanel } from "../../modules/documents/presentation/UploadPanel";
import type { useProcurementDetail } from "./useProcurementDetail";

export function ProcurementDetailView({
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
}: ReturnType<typeof useProcurementDetail>) {
  if (!p)
    return (
      <div className="page">
        <Empty title="Pengadaan tidak ditemukan">
          Kembali ke <Link to="/pengadaan">daftar pengadaan</Link>.
        </Empty>
      </div>
    );
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
