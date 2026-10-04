import { ApplicationProviders } from "./providers/ApplicationProviders";
import { createBrowserRouter } from "react-router";
import { ToastProvider } from "../shared/ui/feedback";

import { AppShell } from "./AppShell";

import { application } from "./session";

export const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <ApplicationProviders application={application}><ToastProvider>
        <AppShell />
      </ToastProvider></ApplicationProviders>
    ),
  },
]);
