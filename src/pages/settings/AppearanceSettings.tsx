import { Check } from "@phosphor-icons/react/dist/csr/Check";
import type { WorkspaceAccent } from "../../shared/kernel/workspace-preferences";

const accents = [
  { value: "forest", label: "Forest", color: "#155a37" },
  { value: "ocean", label: "Ocean", color: "#1f4fa8" },
  { value: "plum", label: "Plum", color: "#6a3fb0" },
  { value: "ember", label: "Ember", color: "#b1491d" },
] satisfies { value: WorkspaceAccent; label: string; color: string }[];

export function AppearanceSettings({ value, change }: { value: WorkspaceAccent; change: (value: WorkspaceAccent) => void }) {
  return (
    <section className="settings-card" aria-labelledby="appearance-heading">
      <header className="settings-section-heading"><h2 id="appearance-heading">Tampilan ruang kerja</h2><p>Pilih warna aksen untuk navigasi dan kontrol. Perubahan langsung diterapkan.</p></header>
      <fieldset className="settings-accents">
        <legend>Warna aksen</legend>
        <div className="settings-swatch-grid">
          {accents.map((accent) => (
            <label className="settings-swatch-option" key={accent.value}>
              <input type="radio" name="workspace-accent" value={accent.value} checked={value === accent.value} onChange={() => change(accent.value)} />
              <span className="settings-swatch" style={{ backgroundColor: accent.color }} aria-hidden="true">{value === accent.value && <Check size={24} weight="bold" />}</span>
              <span>{accent.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="settings-safety-note">Warna status konfirmasi, peringatan, dan kesalahan tetap mengikuti maknanya.</p>
    </section>
  );
}
