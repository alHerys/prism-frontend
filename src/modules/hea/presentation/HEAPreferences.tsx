import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import type { HEAPanelModel } from "./view-models";

export function HEAPreferences({ prefs, setPrefs, busy, prefsComplete, evaluate }: Pick<HEAPanelModel, "prefs" | "setPrefs" | "busy" | "prefsComplete" | "evaluate">) {
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
      <div className="toolbar">
        <button className="btn primary" disabled={busy || !prefsComplete} onClick={() => void evaluate()}>{busy ? "Mengevaluasi…" : "Simpan"}<ArrowRight aria-hidden="true" /></button>
      </div>
    </div>
  </section>;
}
