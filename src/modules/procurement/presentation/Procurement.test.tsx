import { ResultPanel } from "../../evaluations/presentation/ResultPanel";
import { createTestSession } from "../../../infrastructure/local/test-session";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { createApplication } from "../../../app/bootstrap/application";
import { ApplicationProviders } from "../../../app/providers/ApplicationProviders";


import { ToastProvider } from "../../../shared/ui/toast-provider";

import { HEAPanel } from "../../hea/presentation/HEAPanel";
import { ProcurementTable } from "./ProcurementTable.tsx";
afterEach(cleanup);
describe("Preferensi evaluasi", () => {
  it("evaluates all current confirmed A5 files without a selection panel", async () => {
    const runtime = createLocalRuntime(true, true);
    const application = createApplication(runtime);
    const before = runtime.documents.queries.getSnapshot();
    const procurement = before.procurements.find(p => p.id === "proc-showcase")!;
    const a5 = before.documents.filter(d => d.procurementId === procurement.id && d.kind === "FORM_A5");
    await runtime.documents.gateway.removeVendorDocument(procurement.id, a5[1].id, a5[1].revision);
    await runtime.documents.gateway.uploadDocument({ procurementId: procurement.id, vendorId: a5[0].vendorId, kind: "FORM_A5", sourceId: a5[0].sourceId, name: "Unconfirmed.pdf" });
    const evaluate = vi.spyOn(application.hea.commands, "evaluateHEA");
    render(<MemoryRouter><ApplicationProviders application={application}><ToastProvider><HEAPanel procurement={procurement} ResultView={ResultPanel} /></ToastProvider></ApplicationProviders></MemoryRouter>);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Progres evaluasi" })).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Evaluasi HEA" })); });
    expect(evaluate).toHaveBeenCalledWith(procurement.id, [a5[0].id]);
    const snapshot = await evaluate.mock.results[0].value;
    expect(snapshot.inputs).toMatchObject({ documents: [expect.objectContaining({ id: a5[0].id })] });
  });
  it("tidak mengonfirmasi atau mengevaluasi preferensi lama ketika formulir memiliki perubahan", async () => {
    const runtime = createLocalRuntime(true, true);
    const service = createTestSession(true, false, runtime);
    const initial = service.getState().procurements[0];
    await act(async () => {
      await service.setPreferences(
        initial.id,
        { preferensi_barang: "0.15", preferensi_jasa: "0.075" },
        initial.preferenceRevision,
      );
    });
    render(
      <MemoryRouter>
        <ApplicationProviders application={createApplication(runtime)}><ToastProvider>
          <HEAPanel procurement={service.getState().procurements[0]} ResultView={ResultPanel} />
        </ToastProvider></ApplicationProviders>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: "Konfirmasi preferensi" }),
    ).toBeEnabled();
    fireEvent.change(screen.getByLabelText("Preferensi barang (%)"), {
      target: { value: "20" },
    });
    expect(
      screen.getByRole("button", { name: "Konfirmasi preferensi" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Evaluasi HEA" })).toBeDisabled();
    expect(
      service.getState().procurements[0].preferences?.preferensi_barang,
    ).toBe("0.15");
  });
});


describe("Pencarian pengadaan", () => {
  it("menemukan pengadaan melalui vendor dan dokumen tanpa menampilkan pengadaan lain", () => {
    const runtime = createLocalRuntime(true, true);
    const service = createTestSession(true, false, runtime);
    const state = service.getState();
    render(<MemoryRouter><ApplicationProviders application={createApplication(runtime)}><ProcurementTable items={state.procurements} /></ApplicationProviders></MemoryRouter>);
    const search = screen.getByRole("textbox", { name: "Cari pengadaan" });
    for (const query of [state.vendors[0].name, state.documents[0].name]) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getByRole("link", { name: state.procurements[0].name })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: state.procurements[1].name })).not.toBeInTheDocument();
    }
    fireEvent.change(search, { target: { value: "tidak-ada-hasil" } });
    expect(screen.getByText("Pengadaan tidak ditemukan")).toBeInTheDocument();
  });
});
