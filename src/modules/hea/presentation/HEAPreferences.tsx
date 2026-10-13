import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import type { HEAPanelModel } from "./view-models";

export function HEAPreferences({ p, prefs, setPrefs, busy, prefDirty, eligibleDocumentIds, save, confirm, evaluate }: Pick<HEAPanelModel, "p" | "prefs" | "setPrefs" | "busy" | "prefDirty" | "eligibleDocumentIds" | "save" | "confirm" | "evaluate">) {
  return <section className="panel hea-preferences">
    <div className="panel-header"><h2>Preferensi pengadaan</h2></div>
    <div className="preference-form">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="pref-barang">Preferensi barang (%)</label>
          <input id="pref-barang" inputMode="decimal" placeholder="Masukkan persentase" value={prefs.barang} disabled={busy} onChange={event => setPrefs({ ...prefs, barang: event.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="pref-jasa">Preferensi jasa (%)</label>
          <input id="pref-jasa" inputMode="decimal" placeholder="Masukkan persentase" value={prefs.jasa} disabled={busy} onChange={event => setPrefs({ ...prefs, jasa: event.target.value })} />
        </div>
      </div>
      {prefDirty && <p className="muted preference-draft">Perubahan preferensi belum disimpan.</p>}
      <div className="toolbar">
        <button className="btn" disabled={busy} onClick={() => void save()}>Simpan preferensi</button>
        <button className="btn" disabled={busy || prefDirty || !p.preferences || p.preferenceConfirmed} onClick={() => void confirm()}><CheckCircle aria-hidden="true" />Konfirmasi preferensi</button>
        <button className="btn primary" disabled={busy || prefDirty || !p.preferenceConfirmed || !eligibleDocumentIds.length} onClick={() => void evaluate()}>{busy ? "Mengevaluasi…" : "Evaluasi HEA"}<ArrowRight aria-hidden="true" /></button>
      </div>
    </div>
  </section>;
}
