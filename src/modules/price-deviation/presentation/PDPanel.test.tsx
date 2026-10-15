import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useLocation } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createLocalRuntime } from "../../../infrastructure/local/runtime";
import { createApplication } from "../../../app/bootstrap/application";
import { ApplicationProviders } from "../../../app/providers/ApplicationProviders";
import { PDPanel } from "./PDPanel";
import { ResultPanel } from "../../evaluations/presentation/ResultPanel";
import { priceData, priceProcurement } from "../testing/fixtures";

beforeEach(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);
function Navigation() {
  const navigate = useNavigate(), location = useLocation();
  return <><button onClick={() => navigate(-1)}>Back</button><output aria-label="URL">{location.search}</output></>;
}
function setup(entry = "/?tab=harga", data = priceData()) {
  const runtime = createLocalRuntime(), download = vi.fn(), recordExport = vi.fn();
  const read = () => ({ ...data, procurements: [priceProcurement], events: [] });
  const application = createApplication({ ...runtime,
    procurement: { ...runtime.procurement, queries: { getSnapshot: read, subscribe: () => () => {} } },
    priceDeviation: { ...runtime.priceDeviation, queries: { getSnapshot: () => data, subscribe: () => () => {} } },
    evaluations: { ...runtime.evaluations, gateway: { recordExport } },
  }, { download });
  render(<MemoryRouter initialEntries={[entry]}><ApplicationProviders application={application}><Navigation /><PDPanel procurement={priceProcurement} ResultView={ResultPanel} /></ApplicationProviders></MemoryRouter>);
  return { data, download };
}
async function choose(name: string) {
  screen.getByRole("combobox", { name: "Vendor Harga Timpang" }).focus();
  await userEvent.keyboard("{Enter}");
  fireEvent.click(await screen.findByRole("option", { name }));
}
it("starts without a result, changes compositions and exports only the chosen vendor", async () => {
  const { data, download } = setup();
  expect(screen.getByText("Pilih vendor untuk melihat hasil Harga Timpang.")).toBeInTheDocument();
  expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Ekspor Excel" })).not.toBeInTheDocument();
  await choose("Supplier A");
  expect(screen.getByLabelText("URL")).toHaveTextContent("vendor=a");
  expect(within(screen.getByRole("figure", { name: "Komposisi Seluruh Item" })).getByText("100% · 2 item")).toBeInTheDocument();
  expect(screen.getByText("Penawaran: a-offer.xlsx")).toBeInTheDocument();
  await choose("Supplier B");
  expect(within(screen.getByRole("figure", { name: "Komposisi Seluruh Item" })).getByText("100% · 3 item")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Ekspor Excel" }));
  expect(download.mock.calls[0][0]).toEqual(data.snapshots[1]);
  await choose("Supplier C");
  expect(screen.getByText("Belum ada penawaran harga untuk vendor ini")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Buka dokumen vendor" })).toHaveAttribute("href", "/pengadaan/p?tab=ringkasan&vendor=c");
  expect(screen.queryByRole("figure")).not.toBeInTheDocument();
});
it("restores a clear selection with Back and ignores a conflicting result parameter", async () => {
  setup("/?tab=harga&vendor=a&hasil=result-b");
  expect(screen.getByText("Penawaran: a-offer.xlsx")).toBeInTheDocument();
  expect(screen.getByLabelText("URL")).not.toHaveTextContent("hasil=");
  await choose("Supplier B");
  await userEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByText("Penawaran: a-offer.xlsx")).toBeInTheDocument();
});
it("rejects a vendor from another procurement and never auto-selects from hasil", async () => {
  setup("/?tab=harga&vendor=foreign&hasil=result-a");
  expect(screen.getByRole("combobox", { name: "Vendor Harga Timpang" })).toHaveTextContent("Pilih vendor");
  expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  expect(screen.getByLabelText("URL")).not.toHaveTextContent("vendor=");
  await choose("Supplier A");
  await userEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("combobox", { name: "Vendor Harga Timpang" })).toHaveTextContent("Pilih vendor");
  expect(screen.queryByRole("figure")).not.toBeInTheDocument();
});
it("shows an unavailable selector and procurement guidance when no vendor exists", () => {
  setup("/?tab=harga", { vendors: [], documents: [], snapshots: [] });
  expect(screen.getByRole("combobox", { name: "Vendor Harga Timpang" })).toBeDisabled();
  expect(screen.getByText("Belum ada vendor")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Buka identitas & vendor" })).toHaveAttribute("href", "/pengadaan/p?tab=ringkasan");
  expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Ekspor Excel" })).not.toBeInTheDocument();
});
