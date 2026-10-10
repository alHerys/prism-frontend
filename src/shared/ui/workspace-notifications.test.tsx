import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { WorkspacePreferencesProvider, useWorkspacePreferences } from "./workspace-preferences";
import { ToastProvider, useToast } from "./toast-provider";
import type { NotificationCategory } from "../kernel/workspace-preferences";
function Actions({ category }: { category: NotificationCategory }) {
  const { setNotification } = useWorkspacePreferences();
  const toast = useToast();
  return <><button onClick={() => setNotification(category,false)}>Matikan</button><button onClick={() => setNotification(category,true)}>Aktifkan</button><button onClick={() => toast("Operasi berhasil",false,category)}>Sukses</button><button onClick={() => toast("Operasi gagal",true,category)}>Gagal</button><button onClick={() => toast("Periksa data sebelum konfirmasi.")}>Pemeriksaan wajib</button></>;
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
