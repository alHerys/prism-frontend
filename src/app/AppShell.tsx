import { CaretLeft } from "@phosphor-icons/react/dist/csr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { Database } from "@phosphor-icons/react/dist/csr/Database";
import { Folder } from "@phosphor-icons/react/dist/csr/Folder";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate
} from "react-router";
import { useProcurementData } from "../modules/procurement/presentation/binding";
import { Hint } from "../shared/ui/components";
import { AppRoutes } from "./AppRoutes";
const links = [
  ["/", "Dashboard", SquaresFour],
  ["/pengadaan", "Pengadaan", Folder],
  ["/bank", "Bank Data OE", Database],
  ["/riwayat", "Riwayat & Statistik", ClockCounterClockwise],
] as const;
const descriptions: Record<string, string> = {
  "/": "Pantau pengadaan, pemeriksaan dokumen, dan pekerjaan yang perlu ditindaklanjuti.",
  "/pengadaan":
    "Kelola vendor, dokumen, dan hasil evaluasi dalam satu ruang kerja.",
  "/bank":
    "Telusuri dokumen OE historis, bandingkan referensi, dan susun estimasi.",
  "/riwayat":
    "Tinjau aktivitas, hasil tersimpan, dan jejak perubahan pengadaan.",
};
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = useProcurementData();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const focus = location.pathname.includes("/review/") || location.pathname.includes("/vendor/");
  const procurement = state.procurements.find(
    (p) => location.pathname === `/pengadaan/${p.id}`,
  );
  const active = links.find(([url]) =>
    url === "/" ? location.pathname === url : location.pathname.startsWith(url),
  );
  const title = procurement?.name || active?.[1] || "Halaman tidak ditemukan";
  const description = procurement
    ? `${procurement.number} · ${procurement.functionName}`
    : descriptions[active?.[0] || ""];
  const content = <AppRoutes />;
  if (focus) return content;
  return (
    <div className={`app ${collapsed ? "nav-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Lewati navigasi
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="PRISM Dashboard">
          <img className="logo-full" src="/prism_expand.svg" alt="PRISM" />
          <img
            className="logo-symbol"
            src="/prism_shrink.svg"
            alt="PRISM"
          />
        </Link>
        <Hint label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"}>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Perluas navigasi" : "Ringkas navigasi"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
          </button>
        </Hint>
        <nav className="nav" aria-label="Navigasi utama">
          {links.map(([url, label, Icon]) => (
            <Hint key={url} label={label}>
              <NavLink to={url} end={url === "/"} aria-label={label}>
                {({ isActive }) => (
                  <>
                    <Icon
                      size={21}
                      weight={isActive ? "fill" : "regular"}
                      aria-hidden="true"
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </Hint>
          ))}
        </nav>
        <div className="sidebar-foot">
          PT Pertamina Patra Niaga
          <br />
          Regional Kalimantan
        </div>
      </aside>
      <main className="workspace" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div className="shell-heading">
            {procurement && (
              <Link className="shell-back" to="/pengadaan">
                <CaretLeft size={13} /> Semua pengadaan
              </Link>
            )}
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div id="page-header-actions" />
          {location.pathname === "/" && <form
            className="shell-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/pengadaan?cari=${encodeURIComponent(search)}`);
            }}
          >
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input
              aria-label="Cari pengadaan"
              name="cari"
              placeholder="Cari pengadaan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>}
        </header>
        {content}
      </main>
    </div>
  );
}
