import type { IntakeItem } from "../domain/intake";
import type { A5Values } from "../domain/models";
import type { A5IntakeUseCases } from "../application/intake-use-cases";
import { toPercent, toRatio } from "../../../shared/formatting/review-input";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { A5ValueFields } from "./A5ValueFields";

export function A5IntakeEditor({ item, batchId, commands, pending, conflict, onConflict, onConfirm, error }: {
  item: IntakeItem; batchId: string; commands: A5IntakeUseCases; pending: boolean;
  conflict: boolean; onConflict: () => void; onConfirm: () => void; error: string;
}) {
  const percent = item.percentInputs ?? {
    tkdn_barang: item.values.tkdn_barang ? toPercent(item.values.tkdn_barang) : "",
    tkdn_jasa: item.values.tkdn_jasa ? toPercent(item.values.tkdn_jasa) : "",
  };
  const displayed = { ...item.values, ...percent };
  function changeValue(key: keyof A5Values, value: string) {
    if (key === "tkdn_barang" || key === "tkdn_jasa") {
      let ratio: string;
      try { ratio = value ? toRatio(value) : ""; } catch { ratio = "invalid"; }
      commands.edit(batchId, item.id, { values: { ...item.values, [key]: ratio }, percentInputs: { ...percent, [key]: value } });
    } else commands.edit(batchId, item.id, { values: { ...item.values, [key]: value } });
  }
  const fixed = item.phase === "confirmed" || item.phase === "skipped";
  const saveConfirms = commands.reviewWorkflow === "SAVE_CONFIRMS";
  return <section className="panel review-editor a5-intake-editor">
    <div className="panel-header"><div><h2>Periksa vendor & data</h2><p>Sesuaikan identitas dan nilai dengan Form A5.</p></div></div>
    {!item.candidate ? <div className="a5-extraction-state" role="status">
      <strong>{item.phase === "failed" ? "PDF belum dapat dibaca" : item.phase === "skipped" ? "Dokumen dilewati" : "Membaca Form A5…"}</strong>
      <p>{item.error || "PDF dapat diperiksa sambil menunggu hasil ekstraksi."}</p>
      {conflict && <button className="btn" onClick={onConflict}>Pilih PDF yang digunakan</button>}
      {item.phase === "failed" && <button className="btn" onClick={() => commands.retry(batchId, item.id)}>Coba lagi</button>}
      {!fixed && <button className="btn quiet" onClick={() => commands.skip(batchId, item.id)}>Lewati dokumen</button>}
    </div> : <>
      <fieldset disabled={fixed || item.publishing} className="a5-intake-fields">
        <div className="field"><label htmlFor="intake-vendor-name">Nama vendor</label><input id="intake-vendor-name" value={item.vendorName} maxLength={200} onChange={e => commands.edit(batchId, item.id, { vendorName: e.target.value })} />
          {item.candidate.sources.find(s => s.field === "vendor_name")?.quote && <small className="a5-identity-evidence">Sumber: {item.candidate.sources.find(s => s.field === "vendor_name")!.quote}</small>}
        </div>
        <A5ValueFields values={displayed} candidate={item.candidate.values} onChange={changeValue} idPrefix="intake-" />
        {item.candidate.warnings.length > 0 && <div className="alert review-warning"><strong>Perlu diperiksa</strong>{item.candidate.warnings.map((w, i) => <p key={i}>{w}</p>)}{!saveConfirms && <label className="notice"><input type="checkbox" checked={item.acknowledged} onChange={e => commands.edit(batchId, item.id, { acknowledged: e.target.checked })} />Saya telah memeriksa peringatan dan memastikan data sesuai sumber.</label>}</div>}
      </fieldset>
      {item.target && <p className="a5-target-notice">{item.target.document ? `Mengganti ${item.target.document.name}` : `Menambahkan A5 untuk ${item.target.name}`}</p>}
      {(error || item.error) && <p className="alert error" role="alert">{error || item.error}</p>}
      {fixed ? <div className="a5-target-notice" role="status">{item.phase === "confirmed" ? saveConfirms ? "Vendor dan data telah disimpan." : "Vendor dan data telah dikonfirmasi." : "Dokumen ini dilewati."}</div> : <div className="review-action">
        {conflict ? <button className="btn" onClick={onConflict}>Pilih A5 yang digunakan</button> : <button className="btn primary" disabled={pending || item.publishing || (!saveConfirms && item.candidate.warnings.length > 0 && !item.acknowledged)} onClick={onConfirm}><CheckCircle aria-hidden="true" />{item.publishing ? "Menyimpan…" : saveConfirms ? "Simpan" : "Konfirmasi vendor & data"}</button>}
        {pending && <small>Menunggu pembacaan batch selesai.</small>}
        <button className="btn quiet" disabled={item.publishing} onClick={() => commands.skip(batchId, item.id)}>Lewati dokumen</button>
      </div>}
    </>}
  </section>;
}
