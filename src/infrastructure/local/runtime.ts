export { createLocalRuntime } from "./runtime-factory";
export { createBrowserPreferencesStorage } from "../browser/workspace-preferences";

export async function createPertaminaRuntime() {
  const { loadPertaminaRuntime } = await import("../pertamina/runtime");
  return loadPertaminaRuntime();
}
