import type { ReactNode } from "react";
import "./components.css";

export function SourcePanel({
  title,
  children,
  id,
  className = "",
  action,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`source-panel component-source-panel ${className}`}
      aria-label={title}
    >
      <div className="panel-header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
