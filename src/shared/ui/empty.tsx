import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";

export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return <EmptyState title={title}>{children}</EmptyState>;
}
