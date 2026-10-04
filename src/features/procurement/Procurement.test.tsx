import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalSession } from "../../infrastructure/local/service";

import { SessionProvider } from "../../services/session-context";
import { ToastProvider } from "../../shared/ui/feedback";

import { HEAPanel } from "../hea/HEAPanel";
import { ProcurementTable } from "./ProcurementTable.tsx";
afterEach(cleanup);
describe("Preferensi evaluasi", () => {
  it("tidak mengonfirmasi atau mengevaluasi preferensi lama ketika formulir memiliki perubahan", async () => {
    const service = createLocalSession(true, true);
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
        <SessionProvider service={service}><ToastProvider>
          <HEAPanel procurement={service.getState().procurements[0]} />
        </ToastProvider></SessionProvider>
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
    const service = createLocalSession(true, true);
    const state = service.getState();
    render(<MemoryRouter><SessionProvider service={service}><ProcurementTable items={state.procurements} /></SessionProvider></MemoryRouter>);
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
