import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { X } from "@phosphor-icons/react/dist/csr/X";

export function PriceTableSearch({ query, onQueryChange, children }: {
  query: string;
  onQueryChange: (query: string) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    setOpen(false);
    onQueryChange("");
    trigger.current?.focus();
  }
  return <div className="price-table-search" data-open={open}>
    <div className="price-search-summary" aria-hidden={open}>{children}</div>
    <div className="price-search-field" id={id} inert={!open} aria-hidden={!open} onTransitionEnd={event => { if (open && event.target === event.currentTarget && event.propertyName === "clip-path") input.current?.focus(); }}>
      <MagnifyingGlass size={20} aria-hidden="true" />
      <input ref={input} aria-label="Cari Detail Item" placeholder="Cari item, harga, atau klasifikasi…" value={query} onChange={event => onQueryChange(event.target.value)} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); close(); } }} />
    </div>
    <button ref={trigger} type="button" className="icon-button price-search-trigger" aria-label={open ? "Tutup pencarian item" : "Cari item"} aria-expanded={open} aria-controls={id} onClick={() => {
      if (open) close();
      else { setOpen(true); requestAnimationFrame(() => input.current?.focus()); }
    }}>{open ? <X size={20} aria-hidden="true" /> : <MagnifyingGlass size={20} aria-hidden="true" />}</button>
  </div>;
}
