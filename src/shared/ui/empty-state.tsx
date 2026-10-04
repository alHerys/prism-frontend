import { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen";
import type { ReactNode } from "react";
import "./components.css";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <FolderOpenIcon aria-hidden="true" />
      <h3>{title}</h3>
      <div className="empty-copy">{children}</div>
    </div>
  );
}
