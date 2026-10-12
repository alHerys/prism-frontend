import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { VendorCollection } from "./VendorCollection";

afterEach(cleanup);

it("switches layouts without losing vendor destinations and distinguishes availability from confirmation", () => {
  const state = createLocalRuntime().procurement.queries.getSnapshot();
  const vendors = state.vendors.map((vendor, index) => index ? vendor : { ...vendor, createdAt: "2026-10-12T10:00:00Z" });
  render(<MemoryRouter><VendorCollection vendors={vendors} documents={state.documents} /></MemoryRouter>);
  const linkName = "PT Nusa Teknik Mandiri · Buka dokumen";
  const destination = screen.getByRole("link", { name: linkName }).getAttribute("href");
  expect(screen.getByRole("button", { name: "Petak" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Tabel" }));
  const table = screen.getByRole("table", { name: "vendor" });
  expect(within(table).getAllByRole("columnheader").map(header => header.textContent)).toEqual(["Nama Vendor", "Tanggal Ditambahkan", "DokumenFilter"]);
  const nusa = screen.getByRole("link", { name: linkName });
  expect(nusa).toHaveAttribute("href", destination);
  expect(within(nusa.closest("tr")!).getByLabelText("Form A5: tersedia")).toBeInTheDocument();
  expect(within(nusa.closest("tr")!).getByLabelText("Penawaran Harga: tersedia")).toBeInTheDocument();
  expect(nusa.closest("tr")!.querySelector("time")).toHaveAttribute("dateTime", "2026-10-12T10:00:00Z");
  const borneo = screen.getByRole("link", { name: "PT Borneo Teknik Nusantara · Buka dokumen" }).closest("tr")!;
  expect(within(borneo).getByLabelText("Penawaran Harga: belum tersedia")).toBeInTheDocument();
  expect(within(borneo).getByText("Tidak tercatat")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Petak" }));
  expect(screen.getByRole("link", { name: linkName })).toHaveAttribute("href", destination);
});
