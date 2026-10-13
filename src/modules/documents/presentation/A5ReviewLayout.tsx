import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { FilePdf } from "@phosphor-icons/react/dist/csr/FilePdf";
import { SidebarSimple } from "@phosphor-icons/react/dist/csr/SidebarSimple";
import { X } from "@phosphor-icons/react/dist/csr/X";
import "./a5-review.css";

/** Presentation state only: both panes stay mounted to preserve their draft/view. */
export function A5ReviewLayout({ name, source, editor, busy, onBack, actions, tabs }: {
  name: string;
  source: ReactNode;
  editor: ReactNode;
  busy: boolean;
  onBack: () => void;
  actions?: ReactNode;
  tabs?: ReactNode;
}) {
  const [open, setOpen] = useState(() => typeof window.matchMedia !== "function" || window.matchMedia("(min-width: 900px)").matches);
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousOpen = useRef(open);
  useEffect(() => {
    if (open && !previousOpen.current) closeButton.current?.focus();
    previousOpen.current = open;
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return <>
    <header className="focus-head a5-review-header">
      <div className="review-header-context">
        <button className="icon-button review-back" aria-label="Kembali ke pengadaan" title="Kembali ke pengadaan" disabled={busy} onClick={onBack}><ArrowLeft size={24} aria-hidden="true" /></button>
        <FilePdf className="a5-review-file-icon" size={24} aria-hidden="true" />
        <h1 title={name}>{name}</h1>
      </div>
      <div className="a5-review-header-actions">
        {actions}
        <button ref={trigger} className={`btn small${open ? " selected" : ""}`} aria-expanded={open} aria-controls={panelId} onClick={() => open ? close() : setOpen(true)}>
          <SidebarSimple aria-hidden="true" />{open ? "Tutup nilai" : "Periksa nilai"}
        </button>
      </div>
    </header>
    {tabs}
    <main className={`focus-content a5-review-workspace${open ? " drawer-open" : ""}`}>
      <div className="a5-review-source">{source}</div>
      <aside id={panelId} className="review-drawer" aria-label="Panel koreksi" inert={!open} onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); close(); }
      }}>
        <div className="review-drawer-content">
          <button ref={closeButton} className="icon-button review-drawer-close" aria-label="Tutup panel koreksi" onClick={close}><X size={20} aria-hidden="true" /></button>
          {editor}
        </div>
      </aside>
    </main>
  </>;
}
