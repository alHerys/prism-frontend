import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { createApplication } from "../../../app/bootstrap/application";
import { ApplicationProviders } from "../../../app/providers/ApplicationProviders";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { useProcurementData } from "./binding";
import { ProcurementTable } from "./ProcurementTable";

function LiveTable() {
  const state = useProcurementData();
  return <ProcurementTable items={state.procurements} />;
}

function renderTable() {
  const application = createApplication(createLocalRuntime(true, true));
  render(<MemoryRouter><ApplicationProviders application={application}><LiveTable /></ApplicationProviders></MemoryRouter>);
  return application;
}

function names() {
  return within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("link")[0].textContent);
}

const tank = "Pengecatan Tangki Penyimpanan";
const terminal = "Penggantian Jalur Pipa Terminal";
const showcase = "Penggantian Jalur Pipa";

afterEach(cleanup);

describe("Kontrol tabel pengadaan", () => {
  it("mengurutkan setiap kolom bisnis dan hanya menunjukkan arah pada kolom aktif", async () => {
    const user = userEvent.setup();
    const application = renderTable();
    await act(() => application.procurement.commands.addVendor("proc-terminal", "Vendor tambahan"));
    expect(names()).toEqual([tank, showcase, terminal]);
    expect(screen.getByRole("columnheader", { name: "Pengadaan" })).toHaveAttribute("aria-sort", "ascending");

    await user.click(screen.getByRole("button", { name: "Vendor" }));
    expect(names()).toEqual([tank, showcase, terminal]);
    await user.click(screen.getByRole("button", { name: "Vendor" }));
    expect(names()).toEqual([terminal, showcase, tank]);
    expect(screen.getByRole("columnheader", { name: "Vendor" })).toHaveAttribute("aria-sort", "descending");

    await user.click(screen.getByRole("button", { name: "Dokumen" }));
    expect(names()).toEqual([tank, showcase, terminal]);
    await user.click(screen.getByRole("button", { name: "Dokumen" }));
    expect(names()).toEqual([showcase, terminal, tank]);

    await user.click(screen.getByRole("button", { name: "Kesiapan" }));
    expect(names()).toEqual([terminal, tank, showcase]);
    await user.click(screen.getByRole("button", { name: "Kesiapan" }));
    expect(names()).toEqual([tank, showcase, terminal]);

    await user.click(screen.getByRole("button", { name: "Pengadaan" }));
    await user.click(screen.getByRole("button", { name: "Pengadaan" }));
    expect(names()).toEqual([terminal, showcase, tank]);
    const header = within(screen.getByRole("table")).getAllByRole("row")[0];
    expect(header.querySelectorAll(".table-sort svg")).toHaveLength(1);
    expect(header.querySelectorAll("[aria-sort]")).toHaveLength(1);
  });

  it("menerapkan pilihan menu pada data dan mempertahankan pencarian setelah Escape", async () => {
    const user = userEvent.setup();
    renderTable();
    const trigger = screen.getByRole("button", { name: "Filter dan urutkan pengadaan" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const menu = screen.getByRole("dialog", { name: "Filter dan urutkan pengadaan" });
    expect(within(menu).getByRole("button", { name: "Tutup filter pengadaan" })).toHaveFocus();
    await user.tab();
    expect(within(menu).getByRole("radio", { name: "Nama pengadaan" })).toHaveFocus();
    await user.click(within(menu).getByRole("radio", { name: "Jumlah vendor" }));
    await user.click(within(menu).getByRole("radio", { name: "Menurun" }));
    expect(names()).toEqual([showcase, terminal, tank]);
    await user.click(within(menu).getByRole("radio", { name: "Terkonfirmasi" }));
    expect(names()).toEqual([showcase, tank]);
    await user.click(within(menu).getByRole("radio", { name: "Perlu ditinjau" }));
    expect(names()).toEqual([terminal]);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    const search = screen.getByRole("textbox", { name: "Cari pengadaan" });
    await user.type(search, "Nusa");
    expect(names()).toEqual([terminal]);
    await user.click(trigger);
    await user.click(screen.getByRole("radio", { name: "Semua kesiapan" }));
    await user.click(screen.getByRole("button", { name: "Tutup filter pengadaan" }));
    expect(trigger).toHaveFocus();
    expect(search).toHaveValue("Nusa");
    expect(names()).toEqual([showcase, terminal]);
    expect(screen.queryByRole("combobox", { name: "Filter kesiapan pengadaan" })).not.toBeInTheDocument();
  });

  it("mempertahankan paging dan data baru serta kembali ke halaman awal saat sort berubah", async () => {
    const user = userEvent.setup();
    const application = renderTable();
    for (let index = 0; index < 8; index++) {
      await act(() => application.procurement.commands.createProcurement({ name: `Pengadaan tambahan ${index}`, number: `TABLE-${index}`, functionName: "Maintenance" }));
    }
    expect(screen.queryByText(/^Menampilkan/)).not.toBeInTheDocument();
    expect(names()).toHaveLength(10);
    await user.click(screen.getByRole("button", { name: "Selanjutnya" }));
    expect(screen.getByLabelText("Halaman 2 dari 2")).toBeInTheDocument();
    expect(names()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Dokumen" }));
    expect(screen.getByLabelText("Halaman 1 dari 2")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Cari pengadaan" }), "Pengadaan tambahan 7");
    expect(names()).toEqual(["Pengadaan tambahan 7"]);
    expect(screen.getByRole("button", { name: "Selanjutnya" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Jumlah pengadaan per halaman" })).toBeInTheDocument();
  });
});
