import { createLocalRuntime } from "../infrastructure/local/runtime";
import { createApplication } from "./bootstrap/application";
// One runtime, allocated outside React so route remounts and StrictMode share it.
const runtime = createLocalRuntime(true, true);
export const application = createApplication(runtime);
export const sessionService = runtime.session; // Transitional consumers only.
