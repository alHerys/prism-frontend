export type WorkspaceAccent = "forest" | "ocean" | "plum" | "ember";
export type NotificationCategory = "procurement" | "evaluation" | "export" | "publication";
export type WorkspaceTimeZone = "Asia/Jakarta" | "Europe/London" | "Africa/Lagos" | "America/New_York";
export interface WorkspaceProfile {
  name: string;
  email: string;
  role: string;
  bio: string;
  timeZone: WorkspaceTimeZone;
}
export interface WorkspacePreferences {
  profile: WorkspaceProfile;
  accent: WorkspaceAccent;
  notifications: Record<NotificationCategory, boolean>;
}
export interface WorkspacePreferencesStorage {
  load(): WorkspacePreferences | null;
  save(preferences: WorkspacePreferences): void;
}
export function defaultWorkspacePreferences(): WorkspacePreferences {
  return {
    profile: { name: "", email: "", role: "", bio: "", timeZone: "Asia/Jakarta" },
    accent: "forest",
    notifications: { procurement: true, evaluation: true, export: true, publication: true },
  };
}
export function isWorkspacePreferences(value: unknown): value is WorkspacePreferences {
  if (!value || typeof value !== "object") return false;
  const { profile, accent, notifications } = value as Partial<WorkspacePreferences>;
  return !!profile && typeof profile === "object"
    && [profile.name, profile.email, profile.role, profile.bio].every(v => typeof v === "string")
    && ["Asia/Jakarta", "Europe/London", "Africa/Lagos", "America/New_York"].includes(profile.timeZone)
    && ["forest", "ocean", "plum", "ember"].includes(accent ?? "")
    && !!notifications && typeof notifications === "object"
    && ["procurement", "evaluation", "export", "publication"].every(key => typeof notifications[key as NotificationCategory] === "boolean");
}
