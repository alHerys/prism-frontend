import { useEffect } from "react";
import type { RefObject } from "react";
import { useNavigate } from "react-router";
const destinations: Record<string, string> = { d: "/", p: "/pengadaan", b: "/bank", r: "/riwayat", s: "/pengaturan", h: "/bantuan" };
export function useWorkspaceShortcuts(search: RefObject<HTMLInputElement | null>) {
  const navigate = useNavigate();
  useEffect(() => {
    let prefixAt = 0;
    function keydown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"], dialog[open]')) { prefixAt = 0; return; }
      const key = event.key.toLowerCase();
      const commandSearch = key === "k" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
      if (commandSearch && search.current) { event.preventDefault(); search.current.focus(); prefixAt = 0; return; }
      const target = event.target;
      const editing = target instanceof HTMLElement && (target.isContentEditable || !!target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"],[role="combobox"]'));
      if (editing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) { prefixAt = 0; return; }
      if (key === "/" && search.current) { event.preventDefault(); search.current.focus(); prefixAt = 0; return; }
      if (prefixAt && Date.now() - prefixAt < 800 && destinations[key]) { event.preventDefault(); navigate(destinations[key]); prefixAt = 0; return; }
      prefixAt = key === "g" ? Date.now() : 0;
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [navigate, search]);
}
