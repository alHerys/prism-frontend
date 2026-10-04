import { Link } from "react-router";
import { useDocumentsData } from "./binding";

import { date, kindLabel } from "../../../shared/formatters/display";
import type { DocumentRecord } from "../../../shared/model/session";
import "../../../shared/styles/focus.css";
import { Empty, Status } from "../../../shared/ui/feedback";

export function DocumentTable({
  documents,
  embedded = false,
  title = "Daftar Dokumen Vendor",
}: {
  documents: DocumentRecord[];
  embedded?: boolean;
  title?: string;
}) {
  const state = useDocumentsData();
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
