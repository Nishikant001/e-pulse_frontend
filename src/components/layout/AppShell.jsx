import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useBreakpoint } from "../../hooks/useMediaQuery";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { rangeFromPreset } from "../../utils/dateRanges";
import DialogShell from "../ui/DialogShell";
import { DateRangeContext } from "./dateRangeContext";
import Header from "./Header";
import Sidebar from "./Sidebar";

/**
 * AppShell — portal-agnostic application frame: sidebar + header + routed content.
 *
 *   Desktop (≥1024px) : expanded sidebar, collapsible to an icon rail (preference remembered)
 *   Tablet (768–1023) : icon rail; the menu button opens the full navigation as a drawer
 *   Mobile (<768)     : no rail; the menu button opens the navigation drawer
 *
 * `portal` (config/portals.js) supplies the navigation, identity and SAP status, so the same shell can host
 * /distributor (today: /dashboard/*), /admin/* and /retailer/* later without being rewritten.
 */
export default function AppShell({ portal, identity: identityProp, onLogout }) {
  const bp = useBreakpoint();
  const { pathname } = useLocation();
  // A portal whose identity comes from the server (Admin) passes it in; the Distributor portal reads its stored profile.
  const ownIdentity = useMemo(() => (identityProp ? null : portal.getIdentity()), [identityProp, portal]);
  const identity = identityProp || ownIdentity;
  const [collapsedPref, setCollapsedPref] = useLocalStorage("dms.sidebar.collapsed", false);
  const [showPlanned, setShowPlanned] = useLocalStorage("dms.sidebar.showPlanned", false);
  const [navOpen, setNavOpen] = useState(false);
  const [range, setRange] = useState(() => rangeFromPreset(portal.defaultRangePresetId));
  const dateRange = useMemo(() => ({ range, setRange }), [range]);

  // Close the drawer after navigating, and whenever the viewport becomes desktop.
  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    if (bp === "desktop") setNavOpen(false);
  }, [bp]);

  const railWidth = "var(--sidebar-width-rail)";
  const fullWidth = "var(--sidebar-width)";
  const railMode = bp === "tablet" || (bp === "desktop" && collapsedPref);
  const contentOffset = bp === "mobile" ? "0px" : railMode ? railWidth : fullWidth;

  return (
    <DateRangeContext.Provider value={dateRange}>
      <a href="#main-content" className="sr-only rounded-control bg-brand-600 px-4 py-2 text-body font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110]">
        Skip to main content
      </a>

      {bp !== "mobile" ? (
        <Sidebar
          navigation={portal.navigation}
          portalLabel={portal.label}
          tone={portal.tone}
          collapsed={railMode}
          showPlanned={showPlanned}
          onTogglePlanned={() => setShowPlanned((v) => !v)}
          onToggleCollapsed={bp === "desktop" ? () => setCollapsedPref((v) => !v) : () => setNavOpen(true)}
          onRequestExpand={() => (bp === "desktop" ? setCollapsedPref(false) : setNavOpen(true))}
        />
      ) : null}

      <DialogShell open={navOpen && bp !== "desktop"} onClose={() => setNavOpen(false)} align="left" ariaLabel="Main navigation" panelClassName="h-full w-72 max-w-[85vw] border-r border-line">
        <Sidebar
          navigation={portal.navigation}
          portalLabel={portal.label}
          tone={portal.tone}
          variant="overlay"
          showPlanned={showPlanned}
          onTogglePlanned={() => setShowPlanned((v) => !v)}
          onNavigate={() => setNavOpen(false)}
        />
      </DialogShell>

      <div className="min-h-screen transition-[padding] duration-200 ease-out" style={{ paddingLeft: contentOffset }}>
        <Header portal={portal} identity={identity} showMenuButton={bp !== "desktop"} onOpenNav={() => setNavOpen(true)} onLogout={onLogout} />
        <main id="main-content" tabIndex={-1} className="p-4 focus:outline-none sm:p-6">
          <div key={pathname}>
            <div className="dms-page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </DateRangeContext.Provider>
  );
}
