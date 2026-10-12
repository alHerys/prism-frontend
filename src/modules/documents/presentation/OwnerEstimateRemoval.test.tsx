import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { createApplication } from "../../../app/bootstrap/application";
import { ApplicationProviders } from "../../../app/providers/ApplicationProviders";
import { ToastProvider } from "../../../shared/ui/toast-provider";
import { UploadPanel } from "./UploadPanel";
import { currentOwnerEstimate } from "../application/queries";

afterEach(cleanup);

function setup() {
  const runtime = createLocalRuntime(true, true);
  const application = createApplication(runtime);
  render(<MemoryRouter><ApplicationProviders application={application}><ToastProvider><UploadPanel procurementId="proc-showcase" scope="procurement" /></ToastProvider></ApplicationProviders></MemoryRouter>);
  return { runtime, application };
}

it("keeps OE until explicit confirmation and restores the uploader after deletion", async () => {
  const { runtime } = setup();
  const before = runtime.documents.queries.getSnapshot();
  expect(screen.getByRole("link", { name: "Lihat" })).toBeInTheDocument();
  expect(screen.queryByText("Terkonfirmasi")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
  const dialog = screen.getByRole("dialog", { name: "Hapus OE?" });
  expect(runtime.documents.queries.getSnapshot()).toBe(before);
  fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
  expect(runtime.documents.queries.getSnapshot()).toBe(before);
  fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Hapus OE" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Pilih berkas dokumen" })).toBeInTheDocument();
  expect(currentOwnerEstimate(runtime.documents.queries.getSnapshot().documents, "proc-showcase")).toBeUndefined();
});

it("keeps a failed deletion visible and lets the evaluator retry without losing the source", async () => {
  const { runtime, application } = setup();
  const before = runtime.documents.queries.getSnapshot();
  const remove = vi.spyOn(application.documents.commands, "removeOwnerEstimate").mockRejectedValueOnce(new Error("Data telah berubah. Buka kembali versi terbaru."));
  fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Hapus OE" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Data telah berubah");
  expect(runtime.documents.queries.getSnapshot()).toBe(before);
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Hapus OE" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(remove).toHaveBeenCalledTimes(2);
});
