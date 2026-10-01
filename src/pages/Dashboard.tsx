import { Link } from "react-router";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { useDemo, kindLabel, dateTime, Empty } from "../ui";
import { ProcurementTable } from "./ProcurementTable";
import "./dashboard.css";
export function Dashboard() {
  const state = useDemo();
  const pending = state.documents.filter((d) => d.status !== "CONFIRMED");
  const next = pending[0];
  return (
    <div className="page dashboard-page">
      <section className="dashboard-banner">
        <div>
          <h2>
            {next
              ? "Lanjutkan pemeriksaan dokumen"
              : "Siapkan evaluasi pengadaan berikutnya"}
          </h2>
          <p>
            {next
              ? `${next.name} menunggu pemeriksaan nilai dan sumber sebelum dikonfirmasi.`
              : "Semua dokumen telah ditinjau. Buka pengadaan untuk melanjutkan evaluasi."}
          </p>
          <Link
            className="btn"
            to={
              next
                ? `/pengadaan/${next.procurementId}/review/${next.id}`
                : "/pengadaan"
            }
          >
            {next ? "Periksa dokumen" : "Buka pengadaan"}{" "}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="banner-context">
          <strong>{next ? kindLabel[next.kind] : "Evaluasi pengadaan"}</strong>
          <span>
            {next
              ? state.procurements.find((p) => p.id === next.procurementId)
                  ?.name
              : "HEA dan Harga Timpang"}
          </span>
        </div>
      </section>
      <dl className="dashboard-overview" aria-label="Ringkasan ruang kerja">
        {[
          ["Pengadaan aktif", state.procurements.length, "Dalam ruang kerja"],
          ["Dokumen", state.documents.length, "Tercatat pada pengadaan"],
          ["Perlu ditinjau", pending.length, "Menunggu konfirmasi"],
          [
            "Evaluasi tersimpan",
            state.snapshots.length,
            "Hasil dan jejak sumber",
          ],
        ].map(([label, value, detail]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
            <small>{detail}</small>
          </div>
        ))}
      </dl>
      <div className="dashboard-pair">
        <section
          className="panel dashboard-review"
          aria-labelledby="dashboard-review-title"
        >
          <div className="panel-header">
            <div>
              <h2 id="dashboard-review-title">Antrean pemeriksaan</h2>
              <p>Dokumen yang membutuhkan keputusan evaluator.</p>
            </div>
            <span className={`badge ${pending.length ? "warning" : "success"}`}>
              {pending.length} perlu ditinjau
            </span>
          </div>
          {pending.length ? (
            pending.slice(0, 3).map((d) => (
              <Link
                key={d.id}
                className="dashboard-review-row"
                to={`/pengadaan/${d.procurementId}/review/${d.id}`}
              >
                <span className="document-icon">
                  <FileText size={22} />
                </span>
                <div>
                  <strong>{d.name}</strong>
                  <small>
                    {kindLabel[d.kind]} ·{" "}
                    {
                      state.procurements.find((p) => p.id === d.procurementId)
                        ?.number
                    }
                  </small>
                </div>
                <CaretRight size={18} />
              </Link>
            ))
          ) : (
            <Empty title="Semua dokumen telah ditinjau">
              Unggah dokumen baru untuk melanjutkan evaluasi.
            </Empty>
          )}
          {pending.length > 3 && (
            <Link className="dashboard-more" to="/pengadaan">
              Lihat pengadaan untuk {pending.length - 3} dokumen lainnya{" "}
              <ArrowRight size={15} />
            </Link>
          )}
        </section>
        <section
          className="panel dashboard-activity"
          aria-labelledby="dashboard-activity-title"
        >
          <div className="panel-header">
            <div>
              <h2 id="dashboard-activity-title">Aktivitas terbaru</h2>
              <p>Jejak pekerjaan dalam ruang kerja.</p>
            </div>
            <ClockCounterClockwise size={22} className="muted" />
          </div>
          {state.events.length ? (
            <ol>
              {state.events.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <Link
                    to={
                      e.procurementId
                        ? `/pengadaan/${e.procurementId}?tab=riwayat`
                        : "/riwayat"
                    }
                  >
                    {e.summary}
                  </Link>
                  <small>{dateTime(e.createdAt)}</small>
                </li>
              ))}
            </ol>
          ) : (
            <Empty title="Belum ada aktivitas">
              Aktivitas dicatat setelah Anda mulai bekerja.
            </Empty>
          )}
          <Link className="dashboard-more" to="/riwayat">
            Lihat riwayat <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section
        className="panel dashboard-procurements"
        aria-labelledby="dashboard-procurements-title"
      >
        <div className="panel-header">
          <div>
            <h2 id="dashboard-procurements-title">Pengadaan</h2>
            <p>Lanjutkan pekerjaan dari pengadaan terkait.</p>
          </div>
          <Link className="btn primary" to="/pengadaan?baru=1">
            <Plus /> Tambah pengadaan
          </Link>
        </div>
        <ProcurementTable
          items={state.procurements}
          searchLabel="Cari pengadaan pada ringkasan"
        />
      </section>
    </div>
  );
}
