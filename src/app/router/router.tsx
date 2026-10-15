import { ApplicationProviders } from "../providers/ApplicationProviders";
import { createBrowserRouter } from "react-router";
import { ToastProvider } from "../../shared/ui/toast-provider";

import { AppShell } from "../layout/AppShell";

import { preferencesStorage } from "../bootstrap/runtime";
import type { Application } from "../bootstrap/application";

export const createAppRouter = (application: Application) => createBrowserRouter([
  {
    path: "*",
    element: (
      <ApplicationProviders application={application} preferencesStorage={preferencesStorage}><ToastProvider>
        <AppShell />
      </ToastProvider></ApplicationProviders>
    ),
  },
]);
