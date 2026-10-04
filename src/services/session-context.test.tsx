import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it } from "vitest";
import { createLocalSession } from "../infrastructure/local/service";

import { SessionProvider, useSessionService, useSessionState } from "./session-context";

afterEach(cleanup);
function SessionScreen() {
  const service = useSessionService();
  const state = useSessionState();
  return <>
    <output>{state.procurements.length} pengadaan</output>
    <button onClick={() => void service.createProcurement({ name: "Baru", number: "P-1", functionName: "Maintenance" })}>Buat</button>
    <Link to="/lain">Lain</Link>
  </>;
}
it("keeps session state when route content remounts without leaking into another instance", async () => {
  const service = createLocalSession(false);
  const other = createLocalSession(false);
  render(<SessionProvider service={service}><MemoryRouter><Routes>
    <Route path="/" element={<SessionScreen />} />
    <Route path="/lain" element={<SessionScreen key="lain" />} />
  </Routes></MemoryRouter></SessionProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Buat" }));
  expect(await screen.findByText("1 pengadaan")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Lain" }));
  expect(screen.getByText("1 pengadaan")).toBeInTheDocument();
  expect(other.getState().procurements).toEqual([]);
});
