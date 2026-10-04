import { CloudArrowUp } from "@phosphor-icons/react/dist/csr/CloudArrowUp";
import "../../../shared/styles/bank.css";
import type { useBankPage } from "./useBankPage";
export function HistoricalUpload({ state, showUpload, setShowUpload, procurementId, setProcurementId, busy, upload }: Pick<ReturnType<typeof useBankPage>, "state" | "showUpload" | "setShowUpload" | "procurementId" | "setProcurementId" | "busy" | "upload">) {
  return (
    <>
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
    </>
  );
}
