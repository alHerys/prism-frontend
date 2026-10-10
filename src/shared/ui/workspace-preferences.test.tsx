import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultWorkspacePreferences, isWorkspacePreferences } from "../kernel/workspace-preferences";
import type { WorkspacePreferencesStorage } from "../kernel/workspace-preferences";
import { WorkspacePreferencesProvider, useWorkspacePreferences } from "./workspace-preferences";

const profile = { name: "  Rina Evaluator  ", email: "  rina@example.test  ", role: "  Evaluator  ", bio: "  Profil lokal  ", timeZone: "Europe/London" as const };

function Probe({ label = "Preferensi" }: { label?: string }) {
  const state = useWorkspacePreferences();
  return <section aria-label={label}>
    <output data-testid="preferences">{JSON.stringify(state.preferences)}</output>
    <output data-testid="persistence">{state.persistence}</output>
    <p role="status" aria-label="Status penyimpanan">{state.storageIssue}</p>
    <button onClick={() => state.saveProfile(profile)}>Simpan profil</button>
    <button onClick={() => state.setAccent("forest")}>Forest</button>
    <button onClick={() => state.setNotification("export", false)}>Matikan ekspor</button>
    <button onClick={() => { state.saveProfile(profile); state.setAccent("plum"); state.setNotification("evaluation", false); }}>Terapkan bersama</button>
  </section>;
}

function memoryPort(initial = defaultWorkspacePreferences()) {
  let value = initial;
  const storage: WorkspacePreferencesStorage = {
    load: vi.fn(() => value),
    save: vi.fn(next => { value = next; }),
  };
  return { storage, value: () => value };
}

afterEach(cleanup);

describe("workspace preferences provider", () => {
  it("starts without fabricated identity and creates independent defaults", () => {
    const first = defaultWorkspacePreferences();
    const second = defaultWorkspacePreferences();
    first.profile.name = "Local";
    first.notifications.procurement = false;
    expect(second.profile.name).toBe("");
    expect(second.profile.email).toBe("");
    expect(second.accent).toBe("ocean");
    expect(Object.values(second.notifications)).toEqual([true, true, true, true]);
    expect(isWorkspacePreferences(second)).toBe(true);
    expect(isWorkspacePreferences({ ...second, accent: "invalid" })).toBe(false);
    expect(isWorkspacePreferences({ ...second, profile: { ...second.profile, timeZone: "Invalid/Zone" } })).toBe(false);
  });

  it("loads once and persists trimmed profile without replacing appearance or notification preferences", () => {
    const loaded = defaultWorkspacePreferences();
    loaded.accent = "ember";
    loaded.notifications.publication = false;
    const port = memoryPort(loaded);
    const rendered = render(<WorkspacePreferencesProvider storage={port.storage}><Probe /></WorkspacePreferencesProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Simpan profil" }));
    expect(port.storage.load).toHaveBeenCalledTimes(1);
    expect(port.storage.save).toHaveBeenCalledTimes(1);
    expect(port.value()).toEqual({ ...loaded, profile: { name: "Rina Evaluator", email: "rina@example.test", role: "Evaluator", bio: "Profil lokal", timeZone: "Europe/London" } });
    expect(loaded.profile.name).toBe("");
    expect(screen.getByTestId("persistence")).toHaveTextContent("device");
    rendered.rerender(<WorkspacePreferencesProvider storage={port.storage}><Probe key="remounted-page" /></WorkspacePreferencesProvider>);
    expect(screen.getByTestId("preferences")).toHaveTextContent("Rina Evaluator");
    expect(port.storage.load).toHaveBeenCalledTimes(1);
  });

  it("keeps consecutive updates in a single React event instead of losing preceding changes", () => {
    const port = memoryPort();
    render(<WorkspacePreferencesProvider storage={port.storage}><Probe /></WorkspacePreferencesProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Terapkan bersama" }));
    expect(port.value().profile.name).toBe("Rina Evaluator");
    expect(port.value().accent).toBe("plum");
    expect(port.value().notifications.evaluation).toBe(false);
    expect(port.value().notifications.export).toBe(true);
    expect(port.storage.save).toHaveBeenCalledTimes(3);
  });

  it("isolates preferences between provider instances", () => {
    const first = memoryPort();
    const second = memoryPort();
    render(<><WorkspacePreferencesProvider storage={first.storage}><Probe label="Pertama" /></WorkspacePreferencesProvider><WorkspacePreferencesProvider storage={second.storage}><Probe label="Kedua" /></WorkspacePreferencesProvider></>);
    fireEvent.click(within(screen.getByRole("region", { name: "Pertama" })).getByRole("button", { name: "Forest" }));
    expect(first.value().accent).toBe("forest");
    expect(second.value().accent).toBe("ocean");
    expect(second.storage.save).not.toHaveBeenCalled();
  });

  it("supports a session-only runtime without a browser storage adapter", () => {
    render(<WorkspacePreferencesProvider><Probe /></WorkspacePreferencesProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Matikan ekspor" }));
    expect(screen.getByTestId("preferences")).toHaveTextContent('"export":false');
    expect(screen.getByTestId("persistence")).toHaveTextContent("session");
    expect(screen.getByRole("status", { name: "Status penyimpanan" })).toHaveTextContent("");
  });

  it("reports unreadable storage and still accepts local updates", () => {
    const storage: WorkspacePreferencesStorage = { load() { throw new Error("Corrupted"); }, save() { throw new Error("Denied"); } };
    render(<WorkspacePreferencesProvider storage={storage}><Probe /></WorkspacePreferencesProvider>);
    expect(screen.getByTestId("preferences")).toHaveTextContent('"accent":"ocean"');
    expect(screen.getByRole("status", { name: "Status penyimpanan" })).toHaveTextContent(/tidak dapat dimuat/);
    fireEvent.click(screen.getByRole("button", { name: "Forest" }));
    expect(screen.getByTestId("preferences")).toHaveTextContent('"accent":"forest"');
    expect(screen.getByTestId("persistence")).toHaveTextContent("session");
    expect(screen.getByRole("status", { name: "Status penyimpanan" })).toHaveTextContent(/hanya berlaku selama sesi ini/);
  });

  it("does not claim device persistence after a failed write and recovers on the next successful save", () => {
    let fail = true;
    const storage: WorkspacePreferencesStorage = { load: () => null, save() { if (fail) throw new Error("Quota exceeded"); } };
    render(<WorkspacePreferencesProvider storage={storage}><Probe /></WorkspacePreferencesProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Simpan profil" }));
    expect(screen.getByTestId("preferences")).toHaveTextContent("Rina Evaluator");
    expect(screen.getByTestId("persistence")).toHaveTextContent("session");
    expect(screen.getByRole("status", { name: "Status penyimpanan" })).toHaveTextContent(/hanya berlaku selama sesi ini/);
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Forest" }));
    expect(screen.getByTestId("persistence")).toHaveTextContent("device");
    expect(screen.getByRole("status", { name: "Status penyimpanan" })).toHaveTextContent("");
  });
});
