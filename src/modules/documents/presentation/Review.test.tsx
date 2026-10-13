import { createTestSession } from "../../../infrastructure/local/test-session";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { transferableAbortController } from "node:util";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ApplicationProviders } from "../../../app/providers/ApplicationProviders";
import { createApplication } from "../../../app/bootstrap/application";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { ToastProvider } from "../../../shared/ui/toast-provider";
import { Review } from "./Review";
// The Node Request constructor requires a Node AbortSignal rather than jsdom's.
beforeEach(() => vi.stubGlobal("AbortController", transferableAbortController().constructor));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function openReview(documentId: string, reviewReturnTo?: string) {
  const runtime = createLocalRuntime();
    const service = createTestSession(true, false, runtime);
  const router = createMemoryRouter([
    { path: "/pengadaan/:id/review/:documentId", element: <Review /> },
    { path: "/pengadaan/:id", element: <p>Dokumen vendor</p> },
  ], { initialEntries: [{ pathname: `/pengadaan/proc-terminal/review/${documentId}`, state: { reviewReturnTo } }] });
  const application = createApplication(runtime);
  render(<ApplicationProviders application={application}><ToastProvider><RouterProvider router={router} /></ToastProvider></ApplicationProviders>);
  return { ...service, commands: application.documents.commands, runtime, router };
}
it("renders unavailable document routes without initializing an editor", () => {
  openReview("unknown");
  expect(screen.getByText("Dokumen tidak ditemukan")).toBeInTheDocument();
  expect(screen.queryByLabelText("TKDN jasa (%)")).not.toBeInTheDocument();
});
it("keeps corrections while toggling the review drawer and protects navigation until explicit discard", async () => {
  const service = openReview("doc-21");
  fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "31" } });
  fireEvent.click(screen.getByRole("button", { name: "Tutup nilai" }));
  fireEvent.click(screen.getByRole("button", { name: "Periksa nilai" }));
  expect(screen.getByLabelText("TKDN jasa (%)")).toHaveValue("31");
  expect(screen.getByRole("button", { name: "Konfirmasi data" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke pengadaan" }));
  expect(screen.getByRole("dialog", { name: "Perubahan belum disimpan" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tutup dialog" }));
  expect(screen.getByLabelText("TKDN jasa (%)")).toHaveValue("31");
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke pengadaan" }));
  fireEvent.click(screen.getByRole("button", { name: "Buang perubahan" }));
  expect(await screen.findByText("Dokumen vendor")).toBeInTheDocument();
  expect(service.getState().documents[0].reviewed?.tkdn_jasa).toBe("0.3");
});

async function confirmDraft() {
  fireEvent.click(screen.getByRole("button", { name: "Konfirmasi data" }));
  const dialog = screen.getByRole("dialog", { name: "Konfirmasi data dokumen" });
  fireEvent.click(dialog.querySelector("button.btn.primary")!);
}
it("saves corrected values and confirms the returned revision only after explicit approval", async () => {
  const service = openReview("doc-21");
  const confirm = vi.spyOn(service.commands, "confirmReview");
  fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "31" } });
  expect(screen.queryByRole("button", { name: "Simpan perubahan" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Konfirmasi data" }));
  expect(service.getState().documents[0].revision).toBe(1);
  fireEvent.click(screen.getByRole("button", { name: "Kembali memeriksa" }));
  expect(screen.getByLabelText("TKDN jasa (%)")).toHaveValue("31");
  await confirmDraft();
  expect(await screen.findByText("Dokumen vendor")).toBeInTheDocument();
  const document = service.getState().documents[0];
  expect(document.reviewed?.tkdn_jasa).toBe("0.31");
  expect(document.status).toBe("CONFIRMED");
  expect(confirm.mock.calls[0][0].revision).toBe(2);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("keeps invalid corrections on screen and never confirms a rejected save", async () => {
  const service = openReview("doc-21");
  const confirm = vi.spyOn(service.commands, "confirmReview");
  fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "101" } });
  await confirmDraft();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.getByLabelText("TKDN jasa (%)")).toHaveValue("101");
  expect(confirm).not.toHaveBeenCalled();
  expect(service.getState().documents[0].revision).toBe(1);
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke pengadaan" }));
  expect(screen.getByRole("dialog", { name: "Perubahan belum disimpan" })).toBeInTheDocument();
});
it("saves selected group and pairs before confirming their returned revision", async () => {
  const service = openReview("doc-24");
  const confirm = vi.spyOn(service.commands, "confirmReview");
  fireEvent.change(screen.getByLabelText("Kelompok harga yang digunakan"), { target: { value: "Harga satuan material dan jasa" } });
  expect(screen.getByRole("button", { name: "Konfirmasi data" })).toBeEnabled();
  await confirmDraft();
  expect(await screen.findByText("Dokumen vendor")).toBeInTheDocument();
  const document = service.getState().documents.find(d => d.id === "doc-24")!;
  expect(document.selectedGroup).toBe("Harga satuan material dan jasa");
  expect(document.status).toBe("CONFIRMED");
  expect(confirm.mock.calls[0][0].revision).toBe(document.revision);
  expect(confirm.mock.calls[0][1]).toBe(false);
});
it("requires fresh warning acknowledgement after a correction", async () => {
  const service = openReview("doc-22");
  expect(globalThis.document.querySelector(".review-editor .review-warning")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Konfirmasi data" }));
  const confirmation = () => within(screen.getByRole("dialog", { name: "Konfirmasi data dokumen" }));
  expect(confirmation().getByRole("button", { name: "Konfirmasi data" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: /Saya telah memeriksa/ }));
  fireEvent.click(screen.getByRole("button", { name: "Kembali memeriksa" }));
  fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "35" } });
  fireEvent.click(screen.getByRole("button", { name: "Konfirmasi data" }));
  expect(confirmation().getByRole("button", { name: "Konfirmasi data" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: /Saya telah memeriksa/ }));
  fireEvent.click(confirmation().getByRole("button", { name: "Konfirmasi data" }));
  expect(await screen.findByText("Dokumen vendor")).toBeInTheDocument();
  const document = service.getState().documents.find(d => d.id === "doc-22")!;
  expect(document.status).toBe("CONFIRMED");
  expect(document.reviewed?.tkdn_jasa).toBe("0.35");
  expect(document.acknowledged).toBe(true);
});
it("shows loading during save and lets a failed confirmation retry the saved revision", async () => {
  const service = openReview("doc-21");
  const save = service.commands.saveReview;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const saveSpy = vi.spyOn(service.commands, "saveReview").mockImplementation(async input => { await pending; return save(input); });
  const confirm = vi.spyOn(service.commands, "confirmReview").mockRejectedValueOnce(new Error("Konfirmasi gagal; coba lagi."));
  fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "31" } });
  await confirmDraft();
  expect(screen.getAllByRole("button", { name: "Mengonfirmasi…" }).every(button => button.hasAttribute("disabled"))).toBe(true);
  expect(confirm).not.toHaveBeenCalled();
  release();
  expect(await screen.findByRole("alert")).toHaveTextContent("Konfirmasi gagal; coba lagi.");
  expect(service.getState().documents[0].status).not.toBe("CONFIRMED");
  await confirmDraft();
  await waitFor(() => expect(screen.getByText("Dokumen vendor")).toBeInTheDocument());
  expect(saveSpy).toHaveBeenCalledTimes(1);
  expect(confirm.mock.calls[1][0].revision).toBe(2);
});

it.each([["doc-21", "Form A5"], ["doc-24", "Penawaran Harga"]])("keeps %s until explicit deletion and preserves the other vendor documents", async (id, label) => {
  const service = openReview(id);
  const before = service.runtime.documents.queries.getSnapshot();
  fireEvent.click(screen.getByRole("button", { name: `Hapus ${label}` }));
  expect(service.runtime.documents.queries.getSnapshot()).toBe(before);
  fireEvent.click(within(screen.getByRole("dialog", { name: `Hapus ${label}?` })).getByRole("button", { name: "Batal" }));
  expect(service.runtime.documents.queries.getSnapshot()).toBe(before);
  if (id === "doc-21") fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "31" } });
  fireEvent.click(screen.getByRole("button", { name: `Hapus ${label}` }));
  fireEvent.click(within(screen.getByRole("dialog", { name: `Hapus ${label}?` })).getByRole("button", { name: `Hapus ${label}` }));
  expect(await screen.findByText("Dokumen vendor")).toBeInTheDocument();
  expect(service.runtime.documents.queries.getSnapshot().documents.find(d => d.id === id)?.removedAt).toBeTruthy();
  expect(service.runtime.documents.queries.getSnapshot().documents.filter(d => d.id !== id)).toEqual(before.documents.filter(d => d.id !== id));
  expect(screen.queryByRole("dialog", { name: "Perubahan belum disimpan" })).not.toBeInTheDocument();
});

it("retains a failed deletion dialog and draft until retry succeeds", async () => {
  const service = openReview("doc-21");
  const before = service.runtime.documents.queries.getSnapshot();
  const remove = vi.spyOn(service.commands, "removeVendorDocument").mockRejectedValueOnce(new Error("Data telah berubah. Buka kembali versi terbaru."));
  fireEvent.change(screen.getByLabelText("TKDN jasa (%)"), { target: { value: "31" } });
  fireEvent.click(screen.getByRole("button", { name: "Hapus Form A5" }));
  const dialog = () => within(screen.getByRole("dialog", { name: "Hapus Form A5?" }));
  fireEvent.click(dialog().getByRole("button", { name: "Hapus Form A5" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Data telah berubah");
  expect(service.runtime.documents.queries.getSnapshot()).toBe(before);
  expect(screen.getByLabelText("TKDN jasa (%)")).toHaveValue("31");
  fireEvent.click(dialog().getByRole("button", { name: "Hapus Form A5" }));
  expect(await screen.findByText("Dokumen vendor")).toBeInTheDocument();
  expect(remove).toHaveBeenCalledTimes(2);
});

it.each([
  ["/pengadaan/proc-terminal?tab=hea&hasil=result-33", "/pengadaan/proc-terminal?tab=hea&hasil=result-33"],
  ["https://example.com?tab=hea", "/pengadaan/proc-terminal?tab=ringkasan&vendor=vendor-nusa"],
])("returns to the evaluation origin and rejects unrelated destinations: %s", async (origin, expected) => {
  const { router } = openReview("doc-21", origin);
  fireEvent.click(screen.getByRole("button", { name: "Kembali ke pengadaan" }));
  await screen.findByText("Dokumen vendor");
  expect(router.state.location.pathname + router.state.location.search).toBe(expected);
});
