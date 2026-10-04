import type { ReactNode } from "react";
import "./components.css";

export function TableToolbar({ children }: { children: ReactNode }) {
  return <div className="toolbar table-toolbar">{children}</div>;
}
