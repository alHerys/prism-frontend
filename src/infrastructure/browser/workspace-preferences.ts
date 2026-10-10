import { isWorkspacePreferences } from "../../shared/kernel/workspace-preferences";
import type { WorkspacePreferencesStorage } from "../../shared/kernel/workspace-preferences";

export const WORKSPACE_PREFERENCES_KEY = "prism.ui-preferences.v1";
type BrowserStorage = Pick<Storage, "getItem" | "setItem">;
// Resolve storage only when called: import and factory creation remain browser-free.
export function createBrowserPreferencesStorage(getStorage: () => BrowserStorage = () => window.localStorage): WorkspacePreferencesStorage {
  return {
    load() {
      const raw = getStorage().getItem(WORKSPACE_PREFERENCES_KEY);
      if (raw === null) return null;
      const decoded: unknown = JSON.parse(raw);
      if (!decoded || typeof decoded !== "object" || !("version" in decoded) || decoded.version !== 1 || !("preferences" in decoded) || !isWorkspacePreferences(decoded.preferences)) {
        throw new Error("Preferensi perangkat tidak dapat dibaca.");
      }
      const { profile, accent, notifications } = decoded.preferences;
      return {
        profile: { name: profile.name, email: profile.email, role: profile.role, bio: profile.bio, timeZone: profile.timeZone },
        accent,
        notifications: { procurement: notifications.procurement, evaluation: notifications.evaluation, export: notifications.export, publication: notifications.publication },
      };
    },
    save(preferences) {
      getStorage().setItem(WORKSPACE_PREFERENCES_KEY, JSON.stringify({ version: 1, preferences }));
    },
  };
}
