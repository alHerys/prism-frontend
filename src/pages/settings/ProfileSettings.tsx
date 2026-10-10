import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import type { FormEvent } from "react";
import type { WorkspaceProfile } from "../../shared/kernel/workspace-preferences";

const timeZones = [
  ["Asia/Jakarta", "Jakarta — Asia/Jakarta"],
  ["Europe/London", "London — Europe/London"],
  ["Africa/Lagos", "Lagos — Africa/Lagos"],
  ["America/New_York", "New York — America/New_York"],
];

export function ProfileSettings({ draft, change, dirty, nameError, submit, discard }: {
  draft: WorkspaceProfile;
  change: (field: keyof WorkspaceProfile, value: string) => void;
  dirty: boolean;
  nameError: string;
  submit: (event: FormEvent<HTMLFormElement>) => void;
  discard: () => void;
}) {
  const initials = draft.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("id-ID") || "PR";

  return (
    <section className="settings-card" aria-labelledby="profile-heading">
      <header className="settings-profile-identity settings-section-heading">
        <span className="settings-avatar" aria-hidden="true">{initials}</span>
        <div><h2 id="profile-heading">Profil</h2><p>Atur profil lokal dan zona waktu. Profil ini tidak mengubah akses pengadaan.</p></div>
      </header>
      <form onSubmit={submit}>
        <div className="settings-profile-fields">
          <div className="field">
            <label htmlFor="profile-name">Nama lengkap <span className="settings-required">*</span></label>
            <input id="profile-name" name="name" autoComplete="name" required maxLength={100} value={draft.name} onChange={(event) => change("name", event.target.value)} aria-invalid={!!nameError} aria-describedby={nameError ? "profile-name-error" : undefined} />
            {nameError && <p className="field-error" id="profile-name-error" role="alert">{nameError}</p>}
          </div>
          <div className="field">
            <label htmlFor="profile-email">Email <span className="settings-required">*</span></label>
            <input id="profile-email" name="email" type="email" autoComplete="email" required maxLength={254} value={draft.email} onChange={(event) => change("email", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="profile-role">Peran atau jabatan <span className="settings-optional">(opsional)</span></label>
            <input id="profile-role" name="role" maxLength={100} value={draft.role} onChange={(event) => change("role", event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="profile-timezone">Zona waktu</label>
            <span className="settings-select">
              <select id="profile-timezone" name="timeZone" value={draft.timeZone} onChange={(event) => change("timeZone", event.target.value)}>{timeZones.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <CaretDown size={16} aria-hidden="true" />
            </span>
          </div>
          <div className="field settings-field-wide">
            <label htmlFor="profile-bio">Bio <span className="settings-optional">(opsional)</span></label>
            <textarea id="profile-bio" name="bio" rows={4} maxLength={500} value={draft.bio} onChange={(event) => change("bio", event.target.value)} />
          </div>
        </div>
        <footer className="settings-profile-actions">
          <p>{dirty ? "Perubahan profil belum disimpan." : "Nama dan email wajib diisi."}</p>
          <div><button className="btn" type="button" disabled={!dirty} onClick={discard}>Batalkan perubahan</button><button className="btn primary" type="submit" disabled={!dirty}>Simpan perubahan</button></div>
        </footer>
      </form>
    </section>
  );
}
