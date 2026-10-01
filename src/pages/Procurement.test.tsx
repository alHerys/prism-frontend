import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
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
