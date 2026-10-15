import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { createAppRouter } from "./app/router/router";
import { loadApplication } from "./app/bootstrap/runtime";
import "./styles.css";
const root = ReactDOM.createRoot(document.getElementById("root")!);
void loadApplication().then(application => {
  root.render(<React.StrictMode><RouterProvider router={createAppRouter(application)} /></React.StrictMode>);
}).catch(error => {
  root.render(<main className="page"><section className="panel" role="alert"><h1>Aplikasi belum dapat dimuat</h1><p>{error instanceof Error ? error.message : "Sumber aplikasi tidak tersedia."}</p><button className="btn" onClick={() => location.reload()}>Coba lagi</button></section></main>);
});
