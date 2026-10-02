import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { ProcurementTable } from "./ProcurementTable";
import { HEAPanel } from "./Procurement";
import { demoService } from "../domain";
import { ToastProvider } from "../ui";
afterEach(cleanup);
describe("Preferensi evaluasi", () => {
  it("tidak mengonfirmasi atau mengevaluasi preferensi lama ketika formulir memiliki perubahan", async () => {
    const initial = demoService.getState().procurements[0];
    await act(async () => {
      await demoService.setPreferences(
        initial.id,
        { preferensi_barang: "0.15", preferensi_jasa: "0.075" },
        initial.preferenceRevision,
      );
    });
    render(
      <MemoryRouter>
        <ToastProvider>
          <HEAPanel procurement={demoService.getState().procurements[0]} />
        </ToastProvider>
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
      demoService.getState().procurements[0].preferences?.preferensi_barang,
    ).toBe("0.15");
  });
});


describe("Pencarian pengadaan", () => {
  it("menemukan pengadaan melalui vendor dan dokumen tanpa menampilkan pengadaan lain", () => {
    const state = demoService.getState();
    render(<MemoryRouter><ProcurementTable items={state.procurements} /></MemoryRouter>);
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
