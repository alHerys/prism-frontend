import { ApplicationProviders } from "../providers/ApplicationProviders";
import { createBrowserRouter } from "react-router";
import { ToastProvider } from "../../shared/ui/toast-provider";

import { AppShell } from "../layout/AppShell";

import { application, preferencesStorage } from "../bootstrap/runtime";

export const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <ApplicationProviders application={application} preferencesStorage={preferencesStorage}><ToastProvider>
        <AppShell />
      </ToastProvider></ApplicationProviders>
    ),
  },
]);
