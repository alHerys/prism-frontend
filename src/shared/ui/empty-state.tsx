import { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen";
import type { ReactNode } from "react";
import "./components.css";

export function EmptyState({
  title,
  children,
  headingLevel = 3,
}: {
  title: string;
  children?: ReactNode;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3';
  return (
    <div className="empty">
      <FolderOpenIcon aria-hidden="true" />
      <Heading>{title}</Heading>
      <div className="empty-copy">{children}</div>
    </div>
  );
}
