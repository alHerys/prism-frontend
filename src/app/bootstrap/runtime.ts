import { createLocalRuntime, createBrowserPreferencesStorage, createPertaminaRuntime } from "../../infrastructure/local/runtime";
import { createApplication } from "./application";
// One runtime, allocated outside React so route remounts and StrictMode share it.
export async function loadApplication() {
  const runtime = import.meta.env.MODE === "pertamina" ? await createPertaminaRuntime() : createLocalRuntime(true, true);
  return createApplication(runtime);
}
export const preferencesStorage = createBrowserPreferencesStorage();
