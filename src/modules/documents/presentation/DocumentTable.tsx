import { DataTable } from "../../../shared/ui/data-table";
import { Link } from "react-router";
import { useDocumentsData } from "./binding";

import { date, kindLabel } from "../../../shared/formatting/display";
import type { DocumentRecord } from "../domain/models";
import "../../../shared/styles/focus.css";
import "../../../shared/styles/fernly-evaluation.css";
import { EmptyState as Empty } from "../../../shared/ui/empty-state";
import { Status } from "../../../shared/ui/status";

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
    <section className={`fernly-documents ${embedded ? "document-table-embedded" : "panel"}`}>
      <div className="panel-header">
        <h2>{title}</h2>
        <span className="muted">{documents.length} dokumen</span>
      </div>
      <div className="table-wrap" role="region" aria-label={title} tabIndex={0}>
        <DataTable rows={documents} label={title} empty={<Empty title="Belum ada dokumen">Unggah dokumen untuk memulai pemeriksaan.</Empty>} columns={[
  { label: "Dokumen", value: d => d.name },
  { label: "Vendor", value: d => state.vendors.find(v => v.id === d.vendorId)?.name || "Pengadaan" },
  { label: "Jenis", value: d => kindLabel[d.kind], filter: d => kindLabel[d.kind] },
  { label: "Status", value: d => d.status, filter: d => d.status === "CONFIRMED" ? "Terkonfirmasi" : "Perlu ditinjau" },
  { label: "Tindakan" },
]}>{(d) => (
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
            )}</DataTable>
      </div>
    </section>
  );
}
