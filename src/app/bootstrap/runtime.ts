import { createLocalRuntime, createBrowserPreferencesStorage } from "../../infrastructure/local/runtime";
import { createApplication } from "./application";
// One runtime, allocated outside React so route remounts and StrictMode share it.
const runtime = createLocalRuntime(true, true);
export const application = createApplication(runtime);
export const preferencesStorage = createBrowserPreferencesStorage();
