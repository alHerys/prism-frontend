import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it } from "vitest";
import { createLocalRuntime } from "../../infrastructure/local/runtime";
import { createApplication } from "../../app/bootstrap/application";
import { ApplicationProviders } from "../../app/providers/ApplicationProviders";

import { useProcurementCommands, useProcurementData } from "../../modules/procurement/presentation/binding";

afterEach(cleanup);
function SessionScreen() {
  const service = useProcurementCommands();
  const state = useProcurementData();
  return <>
    <output>{state.procurements.length} pengadaan</output>
    <button onClick={() => void service.createProcurement({ name: "Baru", number: "P-1", functionName: "Maintenance" })}>Buat</button>
    <Link to="/lain">Lain</Link>
  </>;
}
it("keeps session state when route content remounts without leaking into another instance", async () => {
  const service = createLocalRuntime(false);
  const other = createLocalRuntime(false);
  render(<ApplicationProviders application={createApplication(service)}><MemoryRouter><Routes>
    <Route path="/" element={<SessionScreen />} />
    <Route path="/lain" element={<SessionScreen key="lain" />} />
  </Routes></MemoryRouter></ApplicationProviders>);
  fireEvent.click(screen.getByRole("button", { name: "Buat" }));
  expect(await screen.findByText("1 pengadaan")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Lain" }));
  expect(screen.getByText("1 pengadaan")).toBeInTheDocument();
  expect(other.procurement.queries.getSnapshot().procurements).toEqual([]);
});
