import * as Tabs from "@radix-ui/react-tabs";
import { Bell } from "@phosphor-icons/react/dist/csr/Bell";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { Users } from "@phosphor-icons/react/dist/csr/Users";
import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import type { WorkspaceProfile } from "../../shared/kernel/workspace-preferences";
import { Modal } from "../../shared/ui/modal";
import { useWorkspacePreferences } from "../../shared/ui/workspace-preferences";
import "../../shared/styles/features/settings.css";
import { AppearanceSettings } from "./AppearanceSettings";
import { NotificationSettings } from "./NotificationSettings";
import { ProfileSettings } from "./ProfileSettings";
import { useUnsavedProfile } from "./useUnsavedProfile";

const sections = [
  { value: "profile", label: "Profil", Icon: Users },
  { value: "notifications", label: "Notifikasi", Icon: Bell },
  { value: "appearance", label: "Tampilan", Icon: SquaresFour },
];
function subscribeLayout(listener: () => void) {
  const media = window.matchMedia("(max-width: 1023px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export default function SettingsPage() {
  const { preferences, persistence, storageIssue, saveProfile, setAccent, setNotification } = useWorkspacePreferences();
  const [tab, setTab] = useState("profile");
  const [draft, setDraft] = useState<WorkspaceProfile>(() => ({ ...preferences.profile }));
  const [nameError, setNameError] = useState("");
  const [saved, setSaved] = useState(false);
  const narrow = useSyncExternalStore(subscribeLayout, () => window.matchMedia("(max-width: 1023px)").matches, () => false);
  const dirty = Object.keys(draft).some((key) => draft[key as keyof WorkspaceProfile] !== preferences.profile[key as keyof WorkspaceProfile]);
  const blocker = useUnsavedProfile(dirty);

  function change(field: keyof WorkspaceProfile, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
    if (field === "name") setNameError("");
  }
  function discard() {
    setDraft({ ...preferences.profile });
    setNameError("");
    setSaved(false);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setNameError("Masukkan nama lengkap Anda.");
      event.currentTarget.querySelector<HTMLInputElement>("#profile-name")?.focus();
      return;
    }
    const profile = { ...draft, name: draft.name.trim(), email: draft.email.trim(), role: draft.role.trim(), bio: draft.bio.trim() };
    saveProfile(profile);
    setDraft(profile);
    setSaved(true);
  }

  return (
    <div className="page settings-page">
      <p className={`settings-persistence${persistence === "session" ? " settings-session" : ""}`} role="status">
        {saved && !dirty ? "Profil disimpan. " : ""}
        {persistence === "device" ? "Pengaturan tersimpan di perangkat ini." : "Pengaturan hanya tersimpan selama sesi ini."}
        {storageIssue && <span> {storageIssue}</span>}
      </p>
      <Tabs.Root className="settings-layout" value={tab} onValueChange={setTab} orientation={narrow ? "horizontal" : "vertical"} activationMode="manual">
        <Tabs.List className="settings-navigation" aria-label="Bagian pengaturan">
          {sections.map(({ value, label, Icon }) => (
            <Tabs.Trigger key={value} value={value} className="settings-nav-item" aria-label={label}>
              <Icon size={20} aria-hidden="true" /><span>{label}</span>{value === "profile" && dirty && <span className="settings-dirty-dot" aria-hidden="true" />}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <div className="settings-content">
          <Tabs.Content value="profile" className="settings-tab-content"><ProfileSettings draft={draft} change={change} dirty={dirty} nameError={nameError} submit={submit} discard={discard} /></Tabs.Content>
          <Tabs.Content value="notifications" className="settings-tab-content"><NotificationSettings values={preferences.notifications} change={setNotification} /></Tabs.Content>
          <Tabs.Content value="appearance" className="settings-tab-content"><AppearanceSettings value={preferences.accent} change={setAccent} /></Tabs.Content>
          {tab !== "profile" && dirty && <p className="settings-draft-note" role="status">Perubahan profil belum disimpan. Buka tab Profil untuk menyimpan atau membuangnya.</p>}
        </div>
      </Tabs.Root>
      <Modal open={blocker.state === "blocked"} onOpenChange={(open) => { if (!open && blocker.state === "blocked") blocker.reset(); }} title="Perubahan profil belum disimpan" description="Tetap di pengaturan untuk menyimpan profil, atau tinggalkan halaman dan buang perubahan yang belum disimpan.">
        <div className="modal-actions"><button className="btn" onClick={() => { if (blocker.state === "blocked") blocker.reset(); }}>Tetap di pengaturan</button><button className="btn danger" onClick={() => { discard(); if (blocker.state === "blocked") blocker.proceed(); }}>Buang dan tinggalkan</button></div>
      </Modal>
    </div>
  );
}
