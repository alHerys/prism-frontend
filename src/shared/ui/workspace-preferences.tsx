import { createContext, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { defaultWorkspacePreferences } from "../kernel/workspace-preferences";
import type { NotificationCategory, WorkspaceAccent, WorkspacePreferences, WorkspacePreferencesStorage, WorkspaceProfile } from "../kernel/workspace-preferences";

interface WorkspacePreferencesValue {
  preferences: WorkspacePreferences;
  persistence: "device" | "session";
  storageIssue: string;
  saveProfile(profile: WorkspaceProfile): void;
  setAccent(accent: WorkspaceAccent): void;
  setNotification(category: NotificationCategory, enabled: boolean): void;
}
const defaults = defaultWorkspacePreferences();
const Context = createContext<WorkspacePreferencesValue>({
  preferences: defaults, persistence: "session", storageIssue: "",
  saveProfile() {}, setAccent() {}, setNotification() {},
});
export const useWorkspacePreferences = () => useContext(Context);

function initialize(storage?: WorkspacePreferencesStorage) {
  try {
    return { preferences: storage?.load() ?? defaultWorkspacePreferences(), persistence: storage ? "device" as const : "session" as const, storageIssue: "" };
  } catch {
    return { preferences: defaultWorkspacePreferences(), persistence: "session" as const, storageIssue: "Preferensi perangkat tidak dapat dimuat. Perubahan hanya berlaku selama sesi ini sampai penyimpanan berhasil." };
  }
}
export function WorkspacePreferencesProvider({ storage, children }: { storage?: WorkspacePreferencesStorage; children: ReactNode }) {
  const [state, setState] = useState(() => initialize(storage));
  const current = useRef(state.preferences);
  function commit(preferences: WorkspacePreferences) {
    current.current = preferences;
    let persistence: "device" | "session" = "session";
    let storageIssue = "";
    try {
      if (storage) { storage.save(preferences); persistence = "device"; }
    } catch {
      storageIssue = "Penyimpanan perangkat tidak tersedia. Perubahan hanya berlaku selama sesi ini.";
    }
    setState({ preferences, persistence, storageIssue });
  }
  return <Context.Provider value={{
    ...state,
    saveProfile(profile) { commit({ ...current.current, profile: { ...profile, name: profile.name.trim(), email: profile.email.trim(), role: profile.role.trim(), bio: profile.bio.trim() } }); },
    setAccent(accent) { commit({ ...current.current, accent }); },
    setNotification(category, enabled) { commit({ ...current.current, notifications: { ...current.current.notifications, [category]: enabled } }); },
  }}>{children}</Context.Provider>;
}
