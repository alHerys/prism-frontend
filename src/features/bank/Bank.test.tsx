import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { FIXTURE_PREFERENCES } from "../../infrastructure/local/fixtures";
import { createLocalSession } from "../../infrastructure/local/service";

import { A5_FIXTURES, HEA_RESULTS } from "../../infrastructure/local/fixtures";
import HistoryPage from "../history/HistoryPage";
import BankPage from "./BankPage";
afterEach(cleanup);
describe("Bank Data and history workflows", () => {
  it("requires selection and comparability before descriptive statistics are shown", async () => {
    const service = createLocalSession();
    render(<BankPage service={service} />);
    await userEvent.click(screen.getByRole("tab", { name: "Statistik Harga" }));
    expect(
      screen.getByText("Pilih referensi yang sebanding"),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("tab", { name: "Pencarian Referensi" }),
    );
    for (const year of ["2024", "2025", "2026"]) {
      await userEvent.click(
        screen.getByLabelText(
          `Pilih ${service.getState().historicalItems.find((item) => item.period === year)?.documentName}`,
        ),
      );
      await userEvent.click(
        screen.getByLabelText(
          `Sebanding ${service.getState().historicalItems.find((item) => item.period === year)?.documentName}`,
        ),
      );
    }
    await waitFor(() =>
      expect(
        screen.getByText("3 referensi dipilih · 3 dinyatakan sebanding"),
      ).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /Lihat statistik/ }));
    expect(screen.getByText("Median / m²")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Harga pengecatan tangki/ }),
    ).toBeInTheDocument();
  });
  it("keeps reference selections while filtering and distinguishes a single observation", async () => {
    const service = createLocalSession();
    render(<BankPage service={service} />);
    await userEvent.click(
      screen.getByRole("tab", { name: "Pencarian Referensi" }),
    );
    await userEvent.click(
      screen.getByLabelText(
        `Pilih ${service.getState().historicalItems.find((item) => item.period === "2024")?.documentName}`,
      ),
    );
    fireEvent.change(screen.getByLabelText("Cari referensi OE"), {
      target: { value: "tidak ditemukan" },
    });
    expect(screen.getByText("Referensi belum ditemukan")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Lihat statistik/ }));
    expect(
      screen.getByText("Satu pengamatan belum membentuk tren"),
    ).toBeInTheDocument();
  });
  it("filters history and presents an empty result instead of unrelated activities", async () => {
    render(<HistoryPage service={createLocalSession()} />);
    expect(screen.getAllByText("Pengadaan dibuat").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText("Cari aktivitas atau hasil"), {
      target: { value: "absen" },
    });
    expect(
      screen.getByText("Belum ada aktivitas pada pilihan ini"),
    ).toBeInTheDocument();
    expect(screen.queryAllByText("Pengadaan dibuat")).toHaveLength(0);
  });
  it("keeps full precision on the snapshot while presenting rounded rupiah and Indonesian labels", async () => {
    const service = createLocalSession();
    const docs = service
      .getState()
      .documents.filter((d) => d.kind === "FORM_A5");
    for (const doc of docs) {
      const revised = await service.reviewDocument(
        doc.id,
        A5_FIXTURES[doc.fixtureId],
        doc.revision,
      );
      await service.confirmDocument(doc.id, revised.revision, true);
    }
    await service.setPreferences("proc-terminal", FIXTURE_PREFERENCES, 0);
    await service.confirmPreferences("proc-terminal", 1);
    const snapshot = await service.evaluateHEA(
      "proc-terminal",
      docs.map((d) => d.id),
    );
    render(<HistoryPage service={service} />);
    await userEvent.click(screen.getByRole("tab", { name: "Hasil Evaluasi" }));
    await userEvent.click(screen.getByRole("button", { name: /Lihat hasil/ }));
    expect(
      screen.getByTitle(
        `Rp 1.261.794.759,${HEA_RESULTS["a5-nusa"].split(".")[1]}`,
      ),
    ).toHaveTextContent("Rp1.261.794.759");
    expect(snapshot.rows[0].hea).toBe(HEA_RESULTS["a5-nusa"]);
    await userEvent.click(screen.getByRole("tab", { name: "Aktivitas" }));
    expect(screen.getByText("Evaluasi selesai")).toBeInTheDocument();
    expect(screen.queryByText("EVALUATED")).not.toBeInTheDocument();
  });
});
