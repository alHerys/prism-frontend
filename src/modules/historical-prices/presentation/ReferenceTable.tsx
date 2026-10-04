import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { FileXls } from "@phosphor-icons/react/dist/csr/FileXls";
import { bankMoney as money } from "../../../shared/formatting/display";
import type { HistoricalItem } from "../domain/models";
import "../../../shared/styles/bank.css";
export function ReferenceTable({
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
