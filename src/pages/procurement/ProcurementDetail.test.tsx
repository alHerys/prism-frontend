import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { transferableAbortController } from "node:util";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApplication } from "../../app/bootstrap/application";
import { ApplicationProviders } from "../../app/providers/ApplicationProviders";
import { createLocalRuntime } from "../../infrastructure/local/runtime";
import { ToastProvider } from "../../shared/ui/toast-provider";
import { ProcurementDetail } from "./ProcurementDetail";
import { VendorDocuments } from "./VendorDocuments";

beforeEach(() => vi.stubGlobal("AbortController", transferableAbortController().constructor));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function setup(url: string) {
  const runtime = createLocalRuntime(true, true);
  const router = createMemoryRouter([
    { path: "/pengadaan/:id", element: <ProcurementDetail /> },
    { path: "/pengadaan/:id/vendor/:vendorId", element: <VendorDocuments /> },
  ], { initialEntries: [url] });
  render(<ApplicationProviders application={createApplication(runtime)}><ToastProvider><RouterProvider router={router} /></ToastProvider></ApplicationProviders>);
  return { runtime, router };
}

it("redirects the retired document stage while preserving parameters and all workspace actions", async () => {
  const { runtime, router } = setup("/pengadaan/proc-showcase?tab=dokumen&hasil=kept");
  await waitFor(() => expect(router.state.location.search).toBe("?tab=ringkasan&hasil=kept"));
  expect(screen.getByRole("heading", { name: "Identitas pengadaan" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Owner Estimate (OE)" })).toBeInTheDocument();
  const stages = screen.getByRole("navigation", { name: "Tahap pengadaan" });
  expect(within(stages).getAllByRole("button")).toHaveLength(3);
  expect(within(stages).getByRole("button", { name: /Identitas & vendor/ })).toHaveAttribute("aria-current", "step");
  fireEvent.click(screen.getByRole("button", { name: "Tabel" }));
  fireEvent.click(screen.getByRole("button", { name: "Tambah vendor" }));
  fireEvent.change(screen.getByLabelText("Nama badan usaha"), { target: { value: "Vendor Gabungan" } });
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Tambah vendor" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(within(screen.getByRole("table", { name: "vendor" })).getByRole("link", { name: "Vendor Gabungan · Buka dokumen" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tabel" })).toHaveAttribute("aria-pressed", "true");
  expect(runtime.procurement.queries.getSnapshot().vendors.some(vendor => vendor.name === "Vendor Gabungan")).toBe(true);
});

it("returns from the vendor workspace and evaluation to the combined identity and OE workspace", async () => {
  const { router } = setup("/pengadaan/proc-showcase?tab=ringkasan");
  fireEvent.click(screen.getByRole("link", { name: "PT Nusa Teknik Mandiri · Buka dokumen" }));
  expect(await screen.findByRole("heading", { name: "PT Nusa Teknik Mandiri" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Kembali ke identitas & vendor" }));
  await waitFor(() => expect(router.state.location.search).toBe("?tab=ringkasan"));
  expect(screen.getByRole("heading", { name: "Identitas pengadaan" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Lanjut ke evaluasi" }));
  expect(await screen.findByRole("heading", { name: "Evaluasi pengadaan" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke identitas & vendor" }));
  expect(screen.getByRole("heading", { name: "Owner Estimate (OE)" })).toBeInTheDocument();
  expect(screen.queryByText("Unggah & verifikasi")).not.toBeInTheDocument();
});
