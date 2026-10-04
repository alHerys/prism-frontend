import type { ReactNode } from "react";
import "./components.css";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "error" | "info";
  children: ReactNode;
}) {
  return (
    <span className={`badge ${tone === "neutral" ? "" : tone}`}>
      {children}
    </span>
  );
}
