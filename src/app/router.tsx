import { ApplicationProviders } from "./providers/ApplicationProviders";
import { createBrowserRouter } from "react-router";
import { ToastProvider } from "../shared/ui/feedback";

import { AppShell } from "./AppShell";

import { application, sessionService } from "./session";

import { SessionProvider } from "../services/session-context";
export const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <ApplicationProviders application={application}><SessionProvider service={sessionService}><ToastProvider>
        <AppShell />
      </ToastProvider></SessionProvider></ApplicationProviders>
    ),
  },
]);
