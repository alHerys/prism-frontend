import { createBrowserRouter } from "react-router";
import { ToastProvider } from "../shared/ui/feedback";

import { AppShell } from "./AppShell";

import { sessionService } from "./session";

import { SessionProvider } from "../services/session-context";
export const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <SessionProvider service={sessionService}><ToastProvider>
        <AppShell />
      </ToastProvider></SessionProvider>
    ),
  },
]);
