import { createDemoService } from "../services/demo/service";
// Create once outside React so StrictMode and route remounts share the same session.
export const sessionService = createDemoService(true, true);
