import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { createApplication } from "../../../app/bootstrap/application";
import { ApplicationProviders } from "../../../app/providers/ApplicationProviders";
import { HEAReportDialog } from "./HEAReportDialog";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function mount(previewHEA: () => Promise<Uint8Array>) {
  const runtime = createLocalRuntime(true, true);
  const application = createApplication(runtime, { download: vi.fn(), previewHEA });
  const snapshot = runtime.evaluations.queries.getSnapshot().snapshots.find(s => s.module === "HEA")!;
  return render(<ApplicationProviders application={application}><HEAReportDialog snapshot={snapshot} onClose={vi.fn()} /></ApplicationProviders>);
}

it("releases its PDF blob on close and does not create one for a cancelled preview", async () => {
  const createObjectURL = vi.fn(() => "blob:report");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  let finish!: (bytes: Uint8Array) => void;
  const view = mount(() => new Promise(resolve => { finish = resolve; }));
  expect(screen.getByRole("status")).toHaveTextContent("Menyiapkan laporan PDF");
  await act(async () => { finish(new Uint8Array([1, 2])); });
  expect(screen.getByTitle("PDF detail perhitungan HEA")).toHaveAttribute("src", "blob:report#view=FitH");
  view.unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  const cancelled = mount(() => new Promise(resolve => { finish = resolve; }));
  cancelled.unmount();
  await act(async () => { finish(new Uint8Array([3])); });
  expect(createObjectURL).toHaveBeenCalledTimes(1);
});

it("offers a retry after generation fails and restores the viewer", async () => {
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:retry"), revokeObjectURL: vi.fn() });
  const preview = vi.fn<() => Promise<Uint8Array>>()
    .mockRejectedValueOnce(new Error("PDF belum dapat dibuat."))
    .mockResolvedValueOnce(new Uint8Array([1]));
  mount(preview);
  expect(await screen.findByRole("alert")).toHaveTextContent("PDF belum dapat dibuat.");
  fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  expect(await screen.findByTitle("PDF detail perhitungan HEA")).toHaveAttribute("src", "blob:retry#view=FitH");
  expect(preview).toHaveBeenCalledTimes(2);
});
