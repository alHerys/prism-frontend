import { FilePdf } from "@phosphor-icons/react/dist/csr/FilePdf";
import { Link, useLocation } from "react-router";
import { roundedMoney } from "../../../shared/formatting/display";
import { heaSourceDocument } from "../application/source-query";
import type { Snapshot } from "../domain/models";
import { rankLabel } from "../application/rank-label";

/** Snapshot order is authoritative. This table deliberately has no view sorting. */
export function HEALeaderboard({ snapshot }: { snapshot: Snapshot }) {
  const location = useLocation();
  return <div className="table-wrap" role="region" aria-label="Leaderboard HEA" tabIndex={0}>
    <table className="table hea-leaderboard" aria-label="Leaderboard HEA">
      <thead><tr><th scope="col">Peringkat</th><th scope="col">Vendor</th><th scope="col" className="numeric">Harga Evaluasi Akhir</th><th scope="col">Sumber</th></tr></thead>
      <tbody>{snapshot.rows.map((row, index) => {
        const source = heaSourceDocument(snapshot, row);
        return <tr key={row.vendorId ?? index}>
          <td><span className="result-rank">{rankLabel(row, snapshot.rows)}</span></td>
          <td><strong>{row.vendorName}</strong></td>
          <td className="numeric" title={row.hea}>{roundedMoney(row.hea)}</td>
          <td>{source ? <Link state={{ reviewReturnTo: location.pathname + location.search }} className="result-source-link" to={`/pengadaan/${source.procurementId}/review/${source.id}`}><FilePdf size={19} aria-hidden="true" />{source.name}</Link> : <span className="result-source-file"><FilePdf size={19} aria-hidden="true" />{row.source ?? "Sumber tidak tersedia"}</span>}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
