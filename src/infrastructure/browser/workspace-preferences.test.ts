import { describe, expect, it } from "vitest";
import { defaultWorkspacePreferences } from "../../shared/kernel/workspace-preferences";
import { createBrowserPreferencesStorage } from "./workspace-preferences";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const key = "prism.ui-preferences.v1";

describe("browser workspace preference storage", () => {
  it("accesses browser storage lazily and round-trips only UI preferences", () => {
    const memory = new MemoryStorage();
    let accesses = 0;
    const storage = createBrowserPreferencesStorage(() => { accesses++; return memory; });
    expect(accesses).toBe(0);
    expect(storage.load()).toBeNull();
    const preferences = defaultWorkspacePreferences();
    preferences.profile = { name: "Rina Evaluator", email: "rina@example.test", role: "Evaluator", bio: "Profil lokal", timeZone: "Europe/London" };
    preferences.accent = "ocean";
    preferences.notifications.export = false;
    storage.save(preferences);
    expect(memory.length).toBe(1);
    expect(memory.key(0)).toBe(key);
    expect(storage.load()).toEqual(preferences);
    expect(memory.getItem(key)).not.toMatch(/documents|procurements|snapshots|token|password/);
    expect(accesses).toBe(3);
  });

  it.each([
    "not json",
    "null",
    JSON.stringify({ profile: { name: "Missing required fields" }, accent: "ocean", notifications: {} }),
    JSON.stringify({ version: 1, preferences: { ...defaultWorkspacePreferences(), accent: "unsupported" } }),
    JSON.stringify({ version: 1, preferences: { ...defaultWorkspacePreferences(), profile: { ...defaultWorkspacePreferences().profile, timeZone: "Invalid/Zone" } } }),
    JSON.stringify({ version: 1, preferences: { ...defaultWorkspacePreferences(), notifications: { ...defaultWorkspacePreferences().notifications, publication: "yes" } } }),
  ])("does not accept corrupted or unsupported preference data (%s)", raw => {
    const memory = new MemoryStorage();
    memory.setItem(key, raw);
    const storage = createBrowserPreferencesStorage(() => memory);
    expect(() => storage.load()).toThrow();
    // Corruption is reported rather than silently rewriting a user's browser data.
    expect(memory.getItem(key)).toBe(raw);
  });

  it("reports denied access and write failures to the provider", () => {
    const denied = createBrowserPreferencesStorage(() => { throw new DOMException("Blocked", "SecurityError"); });
    expect(() => denied.load()).toThrow("Blocked");
    expect(() => denied.save(defaultWorkspacePreferences())).toThrow("Blocked");
    const memory = new MemoryStorage();
    memory.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
    const full = createBrowserPreferencesStorage(() => memory);
    expect(() => full.save(defaultWorkspacePreferences())).toThrow("Full");
    expect(memory.length).toBe(0);
  });
});
