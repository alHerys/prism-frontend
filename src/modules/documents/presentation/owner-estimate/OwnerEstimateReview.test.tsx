import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { transferableAbortController } from "node:util";
import { createLocalRuntime } from "../../../../infrastructure/local/runtime";
import { createApplication } from "../../../../app/bootstrap/application";
import { ApplicationProviders } from "../../../../app/providers/ApplicationProviders";
import { ToastProvider } from "../../../../shared/ui/toast-provider";
import { Review } from "../Review";

beforeEach(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); vi.stubGlobal("AbortController", transferableAbortController().constructor); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function setup() {
  const runtime = createLocalRuntime(true, true);
  const application = createApplication(runtime);
  const router = createMemoryRouter([
    { path: "/pengadaan/:id/review/:documentId", element: <Review /> },
    { path: "/pengadaan/:id", element: <h1>Dokumen pengadaan</h1> },
  ], { initialEntries: ["/pengadaan/proc-showcase", "/pengadaan/proc-showcase/review/doc-27"], initialIndex: 1 });
  render(<ApplicationProviders application={application}><ToastProvider><RouterProvider router={router} /></ToastProvider></ApplicationProviders>);
  const cell = (field = "material", row = 14) => screen.getByRole("treegrid").querySelector<HTMLTableCellElement>(`[data-source-row="${row}"] [data-field="${field}"]`)!;
  function change(value: string) {
    fireEvent.doubleClick(cell());
    fireEvent.change(screen.getByLabelText("Jumlah Harga Material 1.2"), { target: { value } });
    fireEvent.blur(screen.getByLabelText("Jumlah Harga Material 1.2"));
  }
  return { runtime, application, router, cell, change };
}
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const dialog = () => within(screen.getByRole("dialog", { name: "Perubahan belum disimpan" }));

it("starts read-only, edits with keyboard, preserves hidden drafts and cancels a cell with Escape", () => {
  const { cell, change } = setup();
  expect(screen.getByRole("treegrid").querySelector("input,textarea")).toBeNull();
  click("Edit OE");
  fireEvent.keyDown(cell(), { key: "Enter" });
  const input = screen.getByLabelText("Jumlah Harga Material 1.2");
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: "300.000" } });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(cell()).toHaveTextContent("200.000");
  expect(screen.queryByRole("button", { name: "Simpan Perubahan" })).toBeNull();
  change("300.000");
  expect(cell()).toHaveAttribute("data-changed", "true");
  click("Tutup Semua");
  fireEvent.change(screen.getByLabelText("Cari nomor atau uraian pekerjaan"), { target: { value: "perlindungan" } });
  expect(screen.getByRole("treegrid")).toHaveTextContent("pipa baja 4 inci");
  click("Hapus pencarian OE"); click("Buka Semua");
  expect(cell()).toHaveTextContent("300.000");
  fireEvent.doubleClick(cell());
  fireEvent.keyDown(screen.getByLabelText("Jumlah Harga Material 1.2"), { key: "Tab" });
  expect(cell("services")).toHaveFocus();
  change("200.000,00");
  click("Keluar Mode Edit");
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("offers all leave options, discards to stored values and saves atomically before leaving", async () => {
  const { runtime, cell, change } = setup();
  const original = structuredClone(runtime.documents.queries.getSnapshot().documents.find(d => d.id === "doc-27")!);
  click("Edit OE"); change("300.000"); click("Keluar Mode Edit");
  fireEvent.click(dialog().getByRole("button", { name: "Lanjut Mengedit" }));
  expect(cell()).toHaveTextContent("300.000");
  click("Keluar Mode Edit"); fireEvent.click(dialog().getByRole("button", { name: "Buang Perubahan" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(cell()).toHaveTextContent("200.000");
  expect(runtime.documents.queries.getSnapshot().documents.find(d => d.id === original.id)).toEqual(original);
  click("Edit OE"); change("300.000"); click("Kembali ke pengadaan");
  fireEvent.click(dialog().getByRole("button", { name: "Simpan Perubahan" }));
  await screen.findByRole("heading", { name: "Dokumen pengadaan" });
  const stored = runtime.documents.queries.getSnapshot().documents.find(d => d.id === original.id)!;
  expect(stored.status).toBe("CONFIRMED");
  expect(stored.revision).toBe(original.revision + 1);
  expect(stored.ownerEstimate?.candidate).toEqual(original.ownerEstimate?.candidate);
  expect(stored.ownerEstimate?.reviewed?.rows.find(row => row.sourceRow === 14)?.material.value).toBe("300000");
});

it("blocks browser Back, preserves a failed save and proceeds after discard", async () => {
  const { router, application, cell, change } = setup();
  vi.spyOn(application.documents.commands, "saveAndConfirmOwnerEstimate").mockRejectedValueOnce(new Error("Revisi sudah berubah."));
  click("Edit OE"); change("300.000");
  await act(() => router.navigate(-1));
  fireEvent.click(dialog().getByRole("button", { name: "Simpan Perubahan" }));
  await waitFor(() => expect(dialog().getByRole("alert")).toHaveTextContent("Revisi sudah berubah."));
  fireEvent.click(dialog().getByRole("button", { name: "Lanjut Mengedit" }));
  expect(cell()).toHaveTextContent("300.000");
  const unload = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(unload); expect(unload.defaultPrevented).toBe(true);
  await act(() => router.navigate(-1));
  fireEvent.click(dialog().getByRole("button", { name: "Buang Perubahan" }));
  await screen.findByRole("heading", { name: "Dokumen pengadaan" });
});

it("opens and focuses an invalid hidden price before saving and keeps the draft", async () => {
  const { change } = setup();
  click("Edit OE"); change("-1"); click("Tutup Semua");
  fireEvent.change(screen.getByLabelText("Cari nomor atau uraian pekerjaan"), { target: { value: "tidak ada" } });
  click("Simpan Perubahan");
  const input = await screen.findByLabelText("Jumlah Harga Material 1.2");
  await waitFor(() => expect(input).toHaveFocus());
  expect(input).toHaveValue("-1");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Cari nomor atau uraian pekerjaan")).toHaveValue("");
});

it("confirms an unchanged initial extraction in view mode and keeps replaced OE read-only", async () => {
  const { runtime, router } = setup();
  let newId = "";
  await act(async () => {
    const current = runtime.documents.queries.getSnapshot().documents.find(d => d.id === "doc-27")!;
    const fresh = await runtime.documents.gateway.uploadDocument({ procurementId: "proc-showcase", kind: "OE", sourceId: "oe-terminal", name: "OE baru.xlsx", replacement: { id: current.id, revision: current.revision } });
    newId = fresh.id;
    await router.navigate(`/pengadaan/proc-showcase/review/${newId}`);
  });
  expect(screen.getByRole("treegrid").querySelector("input,textarea")).toBeNull();
  click("Konfirmasi Data");
  await waitFor(() => expect(screen.getByText("Terkonfirmasi", { exact: true })).toBeInTheDocument());
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(runtime.documents.queries.getSnapshot().documents.find(d => d.id === newId)?.revision).toBe(2);
  await act(() => router.navigate("/pengadaan/proc-showcase/review/doc-27"));
  expect(screen.getByRole("button", { name: "Edit OE" })).toBeDisabled();
  expect(screen.getByText(/Data ditampilkan sebagai arsip/)).toBeInTheDocument();
});

it("pins the edit revision and retains the draft when another operation changes the stored OE", async () => {
  const { runtime, cell, change } = setup();
  const original = runtime.documents.queries.getSnapshot().documents.find(d => d.id === "doc-27")!;
  click("Edit OE"); change("300.000");
  await act(async () => {
    await runtime.ownerEstimate.saveAndConfirm({ documentId: original.id, expectedRevision: original.revision, acknowledged: true, edits: [{ rowId: "doc-27/Rincian OE:r14", field: "material", value: "400000" }] });
  });
  click("Simpan Perubahan");
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("berubah"));
  expect(cell()).toHaveTextContent("300.000");
  click("Keluar Mode Edit"); fireEvent.click(dialog().getByRole("button", { name: "Buang Perubahan" }));
  await waitFor(() => expect(cell()).toHaveTextContent("400.000"));
});
