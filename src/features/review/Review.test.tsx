import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { transferableAbortController } from "node:util";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createLocalSession } from "../../infrastructure/local/service";
import { SessionProvider } from "../../services/session-context";
import { ToastProvider } from "../../shared/ui/feedback";
import { Review } from "./Review";
// The Node Request constructor requires a Node AbortSignal rather than jsdom's.
beforeEach(() => vi.stubGlobal("AbortController", transferableAbortController().constructor));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function openReview(documentId: string) {
  const service = createLocalSession();
  const router = createMemoryRouter([
    { path: "/pengadaan/:id/review/:documentId", element: <Review /> },
    { path: "/pengadaan/:id/vendor/:vendorId", element: <p>Dokumen vendor</p> },
  ], { initialEntries: [`/pengadaan/proc-terminal/review/${documentId}`] });
  render(<SessionProvider service={service}><ToastProvider><RouterProvider router={router} /></ToastProvider></SessionProvider>);
  return service;
}
it("renders unavailable document routes without initializing an editor", () => {
  openReview("unknown");
  expect(screen.getByText("Dokumen tidak ditemukan")).toBeInTheDocument();
  expect(screen.queryByLabelText("TKDN jasa (%)")).not.toBeInTheDocument();
});
it("keeps corrections while toggling evidence and protects navigation until explicit discard", async () => {
  const service = openReview("doc-21");
  fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "31" } });
  fireEvent.click(screen.getByRole("button", { name: "Tutup bukti sumber" }));
  fireEvent.click(screen.getByRole("button", { name: "Tampilkan bukti sumber" }));
  expect(screen.getByLabelText("TKDN jasa (%)")).toHaveValue("31");
  expect(screen.getByRole("button", { name: "Konfirmasi data" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke pengadaan" }));
  expect(screen.getByRole("dialog", { name: "Perubahan belum disimpan" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tetap di halaman" }));
  expect(screen.getByLabelText("TKDN jasa (%)")).toHaveValue("31");
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke pengadaan" }));
  fireEvent.click(screen.getByRole("button", { name: "Buang perubahan" }));
  expect(await screen.findByText("Dokumen vendor")).toBeInTheDocument();
  expect(service.getState().documents[0].reviewed?.tkdn_jasa).toBe("0.3");
});
