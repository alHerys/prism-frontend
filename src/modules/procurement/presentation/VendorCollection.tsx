import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { BuildingOffice } from "@phosphor-icons/react/dist/csr/BuildingOffice";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { ListBullets } from "@phosphor-icons/react/dist/csr/ListBullets";
import { MinusCircle } from "@phosphor-icons/react/dist/csr/MinusCircle";
import { useState } from "react";
import { Link } from "react-router";
import type { Vendor } from "../domain/models";
import type { DocumentRecord } from "../../documents/domain/models";
import { DataTable } from "../../../shared/ui/data-table";
import { useWorkspaceTime } from "../../../shared/ui/workspace-time";
import { vendorRows } from "./vendor-rows";
import type { VendorRow } from "./vendor-rows";
import "./vendors.css";

function vendorUrl(vendor: Vendor) {
  return `/pengadaan/${vendor.procurementId}/vendor/${vendor.id}`;
}

function VendorCard({ row: { vendor, documentCount, confirmedCount } }: { row: VendorRow }) {
  return (
    <article className="procurement-vendor-card">
      <span className="procurement-vendor-symbol"><BuildingOffice size={25} aria-hidden="true" /></span>
      <h3>{vendor.name}</h3>
      <div className="procurement-vendor-document-count">
        <span><FileText size={14} aria-hidden="true" /> {documentCount} dokumen</span>
        <span><CheckCircle size={14} aria-hidden="true" /> {confirmedCount} terkonfirmasi</span>
      </div>
      <Link className="btn procurement-vendor-link" to={vendorUrl(vendor)} aria-label={`${vendor.name} · Buka dokumen`}>
        Buka dokumen <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

function DocumentChip({ label, available }: { label: string; available: boolean }) {
  const Icon = available ? CheckCircle : MinusCircle;
  return (
    <span className={`vendor-document-chip${available ? " available" : ""}`}>
      <Icon size={14} aria-hidden="true" /> {label} · {available ? "Ada" : "Belum ada"}
    </span>
  );
}

function VendorTable({ rows }: { rows: VendorRow[] }) {
  const dateTime = useWorkspaceTime();
  return (
    <div className="table-wrap vendor-list-table" role="region" aria-label="Daftar vendor" tabIndex={0}>
      <DataTable rows={rows} label="vendor" columns={[
        { label: "Nama Vendor", value: row => row.vendor.name },
        { label: "Tanggal Ditambahkan", value: row => row.vendor.createdAt },
        { label: "Dokumen", filter: row => row.hasA5 && row.hasOffer ? "A5 & penawaran tersedia" : row.hasA5 ? "A5 tersedia" : row.hasOffer ? "Penawaran tersedia" : "Belum ada dokumen" },
      ]}>
        {row => <tr key={row.vendor.id}>
          <td><Link className="vendor-name-link" to={vendorUrl(row.vendor)} aria-label={`${row.vendor.name} · Buka dokumen`}>{row.vendor.name}</Link></td>
          <td>{row.vendor.createdAt ? <time dateTime={row.vendor.createdAt}>{dateTime(row.vendor.createdAt)}</time> : <span className="muted">Tidak tercatat</span>}</td>
          <td><div className="vendor-document-chips"><DocumentChip label="A5 · PDF" available={row.hasA5} /><DocumentChip label="Penawaran · XLSX" available={row.hasOffer} /></div></td>
        </tr>}
      </DataTable>
    </div>
  );
}

export function VendorCollection({ vendors, documents, layoutControl = true }: {
  vendors: Vendor[];
  documents: DocumentRecord[];
  layoutControl?: boolean;
}) {
  const [layout, setLayout] = useState<"grid" | "table">("grid");
  const rows = vendorRows(vendors, documents);
  return (
    <div className="vendor-collection">
      {layoutControl && <div className="vendor-layout-switch" role="group" aria-label="Tampilan daftar vendor">
        <button type="button" className="btn small" aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}><SquaresFour size={17} aria-hidden="true" />Petak</button>
        <button type="button" className="btn small" aria-pressed={layout === "table"} onClick={() => setLayout("table")}><ListBullets size={17} aria-hidden="true" />Tabel</button>
      </div>}
      {layout === "grid" ? <div className="procurement-vendor-grid">{rows.map(row => <VendorCard key={row.vendor.id} row={row} />)}</div> : <VendorTable rows={rows} />}
    </div>
  );
}
