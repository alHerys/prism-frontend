import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { WorkspacePreferencesProvider, useWorkspacePreferences } from "./workspace-preferences";
import { ToastProvider, useToast } from "./toast-provider";
import type { NotificationCategory } from "../kernel/workspace-preferences";
import { useRef } from "react";
function Actions({ category }: { category: NotificationCategory }) {
  const { setNotification } = useWorkspacePreferences();
  const toast = useToast();
  const complete = useRef<() => void>(() => {});
  return <><button onClick={() => setNotification(category,false)}>Matikan</button><button onClick={() => setNotification(category,true)}>Aktifkan</button><button onClick={() => toast("Operasi berhasil",false,category)}>Sukses</button><button onClick={() => toast("Operasi gagal",true,category)}>Gagal</button><button onClick={() => toast("Periksa data sebelum konfirmasi.")}>Pemeriksaan wajib</button><button onClick={() => { complete.current = () => toast("Ekspor selesai",false,category); }}>Mulai ekspor</button><button onClick={() => complete.current()}>Selesaikan ekspor</button></>;
}
afterEach(cleanup);
it.each(["procurement","evaluation","export","publication"] as const)("mutes only optional %s success feedback and always shows errors and review instructions",category => {
  render(<WorkspacePreferencesProvider><ToastProvider><Actions category={category}/></ToastProvider></WorkspacePreferencesProvider>);
  fireEvent.click(screen.getByText("Matikan")); fireEvent.click(screen.getByText("Sukses"));
  expect(screen.queryByText("Operasi berhasil")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Gagal")); expect(screen.getByRole("alert")).toHaveTextContent("Operasi gagal");
  fireEvent.click(screen.getByText("Pemeriksaan wajib")); expect(screen.getByRole("status")).toHaveTextContent("Periksa data sebelum konfirmasi.");
  fireEvent.click(screen.getByText("Aktifkan")); fireEvent.click(screen.getByText("Sukses")); expect(screen.getByRole("status")).toHaveTextContent("Operasi berhasil");
});
it("uses current notification preferences when an operation completes after settings change",() => {
  render(<WorkspacePreferencesProvider><ToastProvider><Actions category="export"/></ToastProvider></WorkspacePreferencesProvider>);
  fireEvent.click(screen.getByText("Mulai ekspor"));
  fireEvent.click(screen.getByText("Matikan"));
  fireEvent.click(screen.getByText("Selesaikan ekspor"));
  expect(screen.queryByText("Ekspor selesai")).not.toBeInTheDocument();
});
