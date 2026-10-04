import { createBrowserRouter } from "react-router";
import { ToastProvider } from "../shared/ui/feedback";

import { AppShell } from "./AppShell";

import { demoService } from "../domain/service";
import { SessionProvider } from "../services/session-context";
export const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <SessionProvider service={demoService}><ToastProvider>
        <AppShell />
      </ToastProvider></SessionProvider>
    ),
  },
]);
