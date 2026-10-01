import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ToastProvider } from "./ui";
import App from "./App";
import "./styles.css";
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <ToastProvider>
        <App />
      </ToastProvider>
    ),
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
