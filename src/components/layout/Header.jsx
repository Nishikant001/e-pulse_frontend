import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Search, ShieldCheck, Crown } from "lucide-react";
import { cn } from "../../utils/cn";
import { getPageInfo } from "../../config/pageInfo";
import { logout } from "../../utils/session";
import Breadcrumb from "../ui/Breadcrumb";
import DateRangePicker from "../ui/DateRangePicker";
import IconButton from "../ui/IconButton";
import InfoHint from "../ui/InfoHint";
import Modal from "../ui/Modal";
import Tooltip from "../ui/Tooltip";
import UserMenu from "../ui/UserMenu";
import { useDateRange } from "./dateRangeContext";
import GlobalSearch from "./GlobalSearch";
import HelpMenu from "./HelpMenu";
import NotificationBell from "./NotificationBell";
import SapStatusIndicator from "./SapStatusIndicator";
import ScopeSelector from "./ScopeSelector";
import { useBreadcrumbs } from "./useBreadcrumbs";

/**
 * Header — sticky application header, one row, never wraps.
 * Left : navigation button (tablet/mobile) + breadcrumb over page title (+ the page's (i) help icon). Truncates, never overflows.
 * Right: search · date range · ERP status · notifications · help · scope · user. Lower-priority items drop out as the width shrinks
 *        (date range ≥ xl, ERP status ≥ 2xl, scope ≥ xl and only where it adds information) so the title always keeps its room.
 */
export default function Header({ portal, identity, showMenuButton, onOpenNav, onLogout, notifications = [], unreadCount = 0 }) {
  const { items, title } = useBreadcrumbs(portal);
  const { pathname } = useLocation();
  const info = getPageInfo(pathname);
  const { range, setRange } = useDateRange();
  const [mobileSearch, setMobileSearch] = useState(false);
  // The Distributor portal's scope is the signed-in distributor itself — the user menu already shows it, so no duplicate chip.
  const showScope = Boolean(identity.scope) && portal.id !== "distributor";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
      {portal.tone ? <span className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5", portal.tone === "super" ? "bg-gradient-to-r from-super-600 via-super-400 to-brand-400" : "bg-gradient-to-r from-brand-700 via-brand-400 to-info-500")} aria-hidden="true" /> : null}
      {showMenuButton ? <IconButton icon={Menu} label="Open navigation" onClick={onOpenNav} tooltipPlacement="bottom" /> : null}

      <div className="flex min-w-0 flex-1 items-center">
        <div className="min-w-0">
          <Breadcrumb items={items} nowrap className="hidden max-w-full sm:block" />
          <div className="flex min-w-0 items-center gap-1">
            <p className="truncate text-card-title font-semibold leading-6 text-ink">{title}</p>
            <InfoHint text={info} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden w-44 lg:block xl:w-60">
          <GlobalSearch navigation={portal.navigation} />
        </div>
        <IconButton icon={Search} label="Search pages" className="lg:hidden" onClick={() => setMobileSearch(true)} />

        <div className="hidden xl:block">
          <Tooltip content="Applies to screens that support date filtering" placement="bottom">
            <span>
              <DateRangePicker value={range} onChange={setRange} compact />
            </span>
          </Tooltip>
        </div>

        {portal.sapStatus ? (
          <div className="hidden 2xl:block">
            <SapStatusIndicator status={portal.sapStatus} />
          </div>
        ) : null}

        <NotificationBell items={notifications} unreadCount={unreadCount} />
        <div className="hidden sm:block">
          <HelpMenu designSystemPath={portal.designSystemPath} />
        </div>

        {portal.tone ? (
          <span className={cn("hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold ring-1 ring-inset md:inline-flex", portal.tone === "super" ? "bg-super-600/10 text-super-700 ring-super-600/25" : "bg-brand-50 text-brand-700 ring-brand-200")}>
            {portal.tone === "super" ? <Crown className="size-3.5" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
            {portal.tone === "super" ? "Super Admin" : "Admin"}
          </span>
        ) : null}
        <div className="mx-1 hidden h-8 w-px bg-line md:block" aria-hidden="true" />
        {showScope ? <div className="hidden 2xl:block"><ScopeSelector scopes={[identity.scope]} value={identity.scope.id} /></div> : null}
        <UserMenu user={identity} onLogout={onLogout || logout} />
      </div>

      <Modal open={mobileSearch} onClose={() => setMobileSearch(false)} title="Search" size="sm">
        <GlobalSearch navigation={portal.navigation} embedded autoFocus onNavigate={() => setMobileSearch(false)} />
      </Modal>
    </header>
  );
}
