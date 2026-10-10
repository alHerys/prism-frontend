import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { List } from "@phosphor-icons/react/dist/csr/List";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { X } from "@phosphor-icons/react/dist/csr/X";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useProcurementData } from "../../modules/procurement/presentation/binding";
import { Hint } from "../../shared/ui/hint";
import { AppRoutes } from "../router/AppRoutes";

const links = [
  ["/", "Dashboard", SquaresFour],
  ["/pengadaan", "Pengadaan", Folder],
  ["/bank", "Bank Data OE", Database],
  ["/riwayat", "Riwayat & Statistik", ClockCounterClockwise],
] as const;
const descriptions: Record<string, string> = {
  "/": "Pantau pengadaan, pemeriksaan dokumen, dan pekerjaan yang perlu ditindaklanjuti.",
  "/pengadaan": "Kelola vendor, dokumen, dan hasil evaluasi dalam satu ruang kerja.",
  "/bank": "Telusuri dokumen OE historis, bandingkan referensi, dan susun estimasi.",
  "/riwayat": "Tinjau aktivitas, hasil tersimpan, dan jejak perubahan pengadaan.",
};
function subscribeViewport(listener: () => void) {
  const media = window.matchMedia("(max-width: 1023px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const narrowViewport = () => window.matchMedia("(max-width: 1023px)").matches;
function Navigation({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  return (
    <nav className="nav" aria-label="Navigasi utama">
      {links.map(([url, label, Icon], index) => {
        const link = <NavLink to={url} end={url === "/"} aria-label={label} onClick={onNavigate}>
          {({ isActive }) => <><Icon size={21} weight={isActive ? "fill" : "regular"} aria-hidden="true" /><span>{label}</span></>}
        </NavLink>;
        return (
        <div key={url} className="nav-entry">
          {index === 0 || index === 2 ? <p className="nav-caption">{index === 0 ? "RUANG KERJA" : "REFERENSI & LAPORAN"}</p> : null}
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
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = useProcurementData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const drawer = useRef<HTMLDivElement>(null);
  const narrow = useSyncExternalStore(subscribeViewport, narrowViewport, () => false);
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  const focus = location.pathname.includes("/review/") || location.pathname.includes("/vendor/");
  const procurement = state.procurements.find(p => location.pathname === `/pengadaan/${p.id}`);
  const active = links.find(([url]) => url === "/" ? location.pathname === url : location.pathname.startsWith(url));
  const title = procurement?.name || active?.[1] || "Halaman tidak ditemukan";
  const description = procurement ? `${procurement.number} · ${procurement.functionName}` : descriptions[active?.[0] || ""];
  const pending = state.documents.filter(document => document.status !== "CONFIRMED").length;
  const content = <AppRoutes />;
  if (focus) return content;
  const closeNavigation = () => setMobileOpen(false);
  return (
    <div className={`app ${!narrow && collapsed ? "nav-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Lewati navigasi</a>
      {!narrow && <aside className="sidebar">
        <Brand />
        <Hint label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"}>
          <button className="sidebar-toggle" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"} aria-expanded={!collapsed}>
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
          </button>
        </Hint>
        <Navigation collapsed={collapsed} />
        <div className="sidebar-foot">
          <img src="/pertamina.svg" alt="Pertamina Patra Niaga" />
          <p>Regional Kalimantan</p>
          <Link to="/pengadaan" className="sidebar-continuation"><Folder size={18} aria-hidden="true" /><span>{pending} dokumen perlu ditinjau</span><CaretRight size={16} aria-hidden="true" /></Link>
        </div>
      </aside>}
      <main className="workspace" id="main-content" tabIndex={-1}>
        <header className="topbar">
          {narrow && <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild><button className="icon-button mobile-menu" aria-label="Buka navigasi"><List size={22} /></button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="navigation-scrim" />
              <Dialog.Content className="navigation-drawer" ref={drawer} onOpenAutoFocus={event => {
                event.preventDefault();
                drawer.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
              }}>
                <Dialog.Title className="sr-only">Navigasi ruang kerja</Dialog.Title>
                <Dialog.Description className="sr-only">Pilih halaman PRISM. Tekan Escape untuk menutup navigasi.</Dialog.Description>
                <div className="drawer-heading"><Brand onNavigate={closeNavigation} /><Dialog.Close asChild><button className="icon-button" aria-label="Tutup navigasi"><X size={20} /></button></Dialog.Close></div>
                <Navigation onNavigate={closeNavigation} />
                <div className="sidebar-foot"><img src="/pertamina.svg" alt="Pertamina Patra Niaga" /><p>Regional Kalimantan</p></div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>}
          <form className="shell-search" role="search" onSubmit={event => {
            event.preventDefault();
            navigate(`/pengadaan?cari=${encodeURIComponent(search)}`);
          }}>
            <MagnifyingGlass size={20} aria-hidden="true" />
            <input aria-label={location.pathname === "/" ? "Cari pengadaan" : "Cari pengadaan di ruang kerja"} name="cari" placeholder="Cari pengadaan…" value={search} onChange={event => setSearch(event.target.value)} />
          </form>
          <div className="shell-context">
            <Hint label="Buka riwayat aktivitas"><Link className="icon-button" to="/riwayat" aria-label="Buka riwayat aktivitas"><ClockCounterClockwise size={21} /></Link></Hint>
            <div className="workspace-identity"><img src="/pertamina-symbol.png" alt="" /><span>Ruang kerja PRISM<small>Evaluasi pengadaan</small></span></div>
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
    </div>
  );
}
