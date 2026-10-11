import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { List } from "@phosphor-icons/react/dist/csr/List";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { Gear } from "@phosphor-icons/react/dist/csr/Gear";
import { Question } from "@phosphor-icons/react/dist/csr/Question";
import { SignOut } from "@phosphor-icons/react/dist/csr/SignOut";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useProcurementData } from "../../modules/procurement/presentation/binding";
import { Hint } from "../../shared/ui/hint";
import { AppRoutes } from "../router/AppRoutes";
import { useWorkspacePreferences } from "../../shared/ui/workspace-preferences";
import { useHelpSearch } from "../../shared/ui/help-search";
import { useToast } from "../../shared/ui/toast-provider";
import { useWorkspaceShortcuts } from "./useWorkspaceShortcuts";
import "../../shared/styles/features/workspace.css";

const links = [
  ["/", "Dashboard", SquaresFour],
  ["/pengadaan", "Pengadaan", Folder],
  ["/bank", "Bank Data OE", Database],
  ["/riwayat", "Riwayat & Statistik", ClockCounterClockwise],
] as const;
const generalLinks = [["/pengaturan", "Pengaturan", Gear], ["/bantuan", "Bantuan", Question]] as const;
const descriptions: Record<string, string> = {
  "/": "Pantau pengadaan, pemeriksaan dokumen, dan pekerjaan yang perlu ditindaklanjuti.",
  "/pengadaan": "Kelola vendor, dokumen, dan hasil evaluasi dalam satu ruang kerja.",
  "/bank": "Telusuri dokumen OE historis, bandingkan referensi, dan susun estimasi.",
  "/riwayat": "Tinjau aktivitas, hasil tersimpan, dan jejak perubahan pengadaan.",
  "/pengaturan": "Atur profil, pemberitahuan, dan tampilan ruang kerja Anda.",
  "/bantuan": "Temukan panduan penggunaan PRISM dan pintasan untuk ruang kerja Anda.",
};
function subscribeViewport(listener: () => void) {
  const media = window.matchMedia("(max-width: 1023px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
function GeneralNavigation({ onNavigate, collapsed = false, onLogout }: { onNavigate?: () => void; collapsed?: boolean; onLogout: (element: HTMLElement) => void }) {
  return <nav className="nav general-navigation" aria-label="Navigasi umum">
    <p className="nav-group-label">UMUM</p>
    {generalLinks.map(([url,label,Icon]) => {
      const link = <NavLink to={url} aria-label={label} onClick={onNavigate}>{({ isActive }) => <><Icon size={21} weight={isActive ? "fill" : "regular"} aria-hidden="true" /><span>{label}</span></>}</NavLink>;
      return <div key={url} className="nav-entry">{collapsed ? <Hint label={label}>{link}</Hint> : link}</div>;
    })}
    <div className="nav-entry">{collapsed ? <Hint label="Keluar"><button className="nav-logout" aria-label="Keluar" onClick={event => onLogout(event.currentTarget)}><SignOut size={21} aria-hidden="true" /><span>Keluar</span></button></Hint> : <button className="nav-logout" aria-label="Keluar" onClick={event => onLogout(event.currentTarget)}><SignOut size={21} aria-hidden="true" /><span>Keluar</span></button>}</div>
  </nav>;
}
const narrowViewport = () => window.matchMedia("(max-width: 1023px)").matches;
function Navigation({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  return (
    <nav className="nav" aria-label="Navigasi utama">
      {links.map(([url, label, Icon]) => {
        const link = <NavLink to={url} end={url === "/"} aria-label={label} onClick={onNavigate}>
          {({ isActive }) => <><Icon size={21} weight={isActive ? "fill" : "regular"} aria-hidden="true" /><span>{label}</span></>}
        </NavLink>;
        return (
        <div key={url} className="nav-entry">
          {collapsed ? <Hint label={label}>{link}</Hint> : link}
        </div>
        );
      })}
    </nav>
  );
}
function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return <Link className="brand" to="/" aria-label="PRISM Dashboard" onClick={onNavigate}>
    <img className="logo-full" src="/prism_expand.svg" alt="PRISM" />
    <img className="logo-symbol" src="/prism_shrink.svg" alt="PRISM" />
  </Link>;
}
function SidebarFooter() {
  return <div className="sidebar-foot">
    <p className="sidebar-organization"><span>PT Pertamina Patra Niaga</span><span>Regional Kalimantan</span></p>
    <div className="sidebar-brand-stripe" aria-hidden="true" />
  </div>;
}
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = useProcurementData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { preferences } = useWorkspacePreferences();
  const helpSearch = useHelpSearch();
  const toast = useToast();
  const searchInput = useRef<HTMLInputElement>(null);
  const mobileMenu = useRef<HTMLButtonElement>(null);
  const logoutOpener = useRef<HTMLElement | null>(null);
  const logoutCancel = useRef<HTMLButtonElement>(null);
  useWorkspaceShortcuts(searchInput);
  useEffect(() => {
    document.documentElement.dataset.workspaceAccent = preferences.accent;
    return () => { delete document.documentElement.dataset.workspaceAccent; };
  }, [preferences.accent]);
  const drawer = useRef<HTMLDivElement>(null);
  const narrow = useSyncExternalStore(subscribeViewport, narrowViewport, () => false);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  const focus = location.pathname.includes("/review/") || location.pathname.includes("/vendor/");
  const procurement = state.procurements.find(p => location.pathname === `/pengadaan/${p.id}`);
  const active = [...links, ...generalLinks].find(([url]) => url === "/" ? location.pathname === url : location.pathname.startsWith(url));
  const title = procurement?.name || active?.[1] || "Halaman tidak ditemukan";
  const description = procurement ? `${procurement.number} · ${procurement.functionName}` : descriptions[active?.[0] || ""];
  const content = <AppRoutes />;
  if (focus) return content;
  const closeNavigation = () => setMobileOpen(false);
  const openLogout = (element: HTMLElement) => { logoutOpener.current = element; setMobileOpen(false); setLogoutOpen(true); };
  const isHelp = location.pathname === "/bantuan";
  const initials = preferences.profile.name.trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toLocaleUpperCase("id-ID") || "PR";
  return (
    <div className={`app ${!narrow && collapsed ? "nav-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Lewati navigasi</a>
      {!narrow && <aside className="sidebar">
        <div className="sidebar-content">
        <Brand />
        <Navigation collapsed={collapsed} />
        <GeneralNavigation collapsed={collapsed} onLogout={openLogout} />
        <SidebarFooter />
        </div>
        <Hint label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"}>
          <button className="sidebar-toggle" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-expanded={!collapsed}>
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
          </button>
        </Hint>
      </aside>}
      <main className="workspace" id="main-content" tabIndex={-1}>
        <header className="topbar">
          {narrow && <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild><button className="icon-button mobile-menu" ref={mobileMenu} aria-label="Buka navigasi"><List size={22} /></button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="navigation-scrim" />
              <Dialog.Content className="navigation-drawer" ref={drawer} onCloseAutoFocus={event => { if (logoutOpen) event.preventDefault(); }} onOpenAutoFocus={event => {
                event.preventDefault();
                drawer.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
              }}>
                <Dialog.Title className="sr-only">Navigasi ruang kerja</Dialog.Title>
                <Dialog.Description className="sr-only">Pilih halaman PRISM. Tekan Escape untuk menutup navigasi.</Dialog.Description>
                <div className="navigation-drawer-content">
                <div className="drawer-heading"><Brand onNavigate={closeNavigation} /></div>
                <Navigation onNavigate={closeNavigation} />
                <GeneralNavigation onNavigate={closeNavigation} onLogout={openLogout} />
                <SidebarFooter />
                </div>
                <Dialog.Close asChild><button className="sidebar-toggle drawer-close" aria-label="Tutup navigasi"><CaretLeft size={16} aria-hidden="true" /></button></Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>}
          <form className="shell-search" role="search" onSubmit={event => {
            event.preventDefault();
            if (!isHelp) navigate(`/pengadaan?cari=${encodeURIComponent(search)}`);
          }}>
            <MagnifyingGlass size={20} aria-hidden="true" />
            <input ref={searchInput} aria-label={isHelp ? "Cari artikel bantuan" : location.pathname === "/" ? "Cari pengadaan" : "Cari pengadaan di ruang kerja"} name="cari" placeholder={isHelp ? "Cari artikel bantuan…" : "Cari pengadaan…"} value={isHelp ? helpSearch.query : search} onChange={event => isHelp ? helpSearch.setQuery(event.target.value) : setSearch(event.target.value)} />
          </form>
          <div className="shell-context">
            <Link to="/pengaturan" className="workspace-identity workspace-profile" aria-label="Buka profil ruang kerja"><span className="workspace-avatar" aria-hidden="true">{initials}</span><span className="workspace-profile-name">{preferences.profile.name || "Ruang kerja PRISM"}<small>{preferences.profile.role || "Evaluasi pengadaan"}</small></span></Link>
          </div>
        </header>
        <section className="shell-surface">
          <header className="shell-page-heading">
            <div className="shell-heading">
              {procurement && <Link className="shell-back" to="/pengadaan"><CaretLeft size={13} /> Semua pengadaan</Link>}
              <h1>{title}</h1><p>{description}</p>
            </div>
            <div id="page-header-actions" />
          </header>
          {content}
        </section>
      </main>
      <Dialog.Root open={logoutOpen} onOpenChange={setLogoutOpen}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal logout-dialog" onOpenAutoFocus={event => { event.preventDefault(); logoutCancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); (logoutOpener.current?.isConnected ? logoutOpener.current : mobileMenu.current)?.focus(); }}><Dialog.Title asChild><h2>Keluar dari PRISM?</h2></Dialog.Title><Dialog.Description asChild><p>Fitur keluar belum tersedia. Data dan pekerjaan Anda tidak akan diubah.</p></Dialog.Description><div className="modal-actions"><button ref={logoutCancel} className="btn" onClick={() => setLogoutOpen(false)}>Tetap di PRISM</button><button className="btn logout-confirm" onClick={() => { setLogoutOpen(false); toast("Logout belum tersedia. Anda tetap berada di PRISM."); }}>Keluar</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}
