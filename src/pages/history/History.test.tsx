import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { createLocalRuntime } from "../../infrastructure/local/runtime";
import { createApplication } from "../../app/bootstrap/application";
import { ApplicationProviders } from "../../app/providers/ApplicationProviders";
import HistoryPage from "./HistoryPage";
afterEach(cleanup);
it("shows activity and its statistics without the removed result browser", async () => {
  const application = createApplication(createLocalRuntime(true, true));
  render(<ApplicationProviders application={application}><HistoryPage /></ApplicationProviders>);
  expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Aktivitas", "Statistik Aktivitas"]);
  expect(screen.queryByRole("button", { name: /Lihat hasil|Ekspor Excel/ })).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Rincian snapshot")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("tab", { name: "Statistik Aktivitas" }));
  expect(screen.getByRole("heading", { name: "Aktivitas per hari" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Hasil evaluasi tersimpan" })).not.toBeInTheDocument();
});
