import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Eye, EyeOff, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../../utils/cn";
import { findNavTrail, isLive, visibleNavigation } from "../../config/navigation";
import Tooltip from "../ui/Tooltip";
import BrandLogo from "../ui/BrandLogo";

// Visual themes. "light" = Distributor portal (unchanged). "admin" / "super" = dark console sidebar for the Admin and Super Admin portals.
const THEMES = {
  light: {
    root: "bg-surface border-r border-line", brandBorder: "border-line", title: "text-ink", sub: "text-ink-subtle",
    mark: "bg-gradient-to-br from-brand-500 to-brand-700",
    idle: "text-ink-muted hover:bg-neutral-100 hover:text-ink", active: "bg-brand-50 text-brand-700", groupActive: "text-brand-700", groupActiveRail: "bg-brand-50",
    bar: "bg-brand-600", rule: "border-line", chev: "text-ink-subtle", planned: "text-ink-subtle/80", dot: "bg-line-strong",
    foot: "border-line", toggle: "text-ink-muted hover:bg-neutral-100 hover:text-ink",
  },
  admin: {
    root: "bg-gradient-to-b from-console-900 to-console-950 border-r border-white/5", brandBorder: "border-white/10", title: "text-white", sub: "text-brand-200",
    mark: "bg-gradient-to-br from-brand-400 to-brand-600 ring-1 ring-white/20",
    idle: "text-slate-300 hover:bg-white/8 hover:text-white", active: "bg-brand-500/20 text-white ring-1 ring-inset ring-brand-400/30", groupActive: "text-white", groupActiveRail: "bg-brand-500/20",
    bar: "bg-brand-400", rule: "border-white/10", chev: "text-slate-400", planned: "text-slate-500", dot: "bg-slate-600",
    foot: "border-white/10", toggle: "text-slate-300 hover:bg-white/8 hover:text-white",
  },
  super: {
    root: "bg-gradient-to-b from-super-950 to-console-950 border-r border-white/5", brandBorder: "border-white/10", title: "text-white", sub: "text-super-300",
    mark: "bg-gradient-to-br from-super-500 to-super-700 ring-1 ring-white/20",
    idle: "text-slate-300 hover:bg-white/8 hover:text-white", active: "bg-super-500/20 text-white ring-1 ring-inset ring-super-400/30", groupActive: "text-white", groupActiveRail: "bg-super-500/20",
    bar: "bg-super-400", rule: "border-white/10", chev: "text-slate-400", planned: "text-slate-500", dot: "bg-slate-600",
    foot: "border-white/10", toggle: "text-slate-300 hover:bg-white/8 hover:text-white",
  },
};

const rowBase = "group relative flex w-full items-center gap-3 rounded-control text-body transition-colors duration-150";
const PLANNED_HINT = "Planned module — not available yet";

function BrandMark({ collapsed, th }) {
  return (
    <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b px-4", th.brandBorder, collapsed && "justify-center px-0")}>
      {collapsed ? <BrandLogo tile variant="mark" className="size-8" tileClassName="p-1" /> : <BrandLogo tile className="h-11" tileClassName="w-full justify-start px-3 py-1" />}
    </div>
  );
}

function PlannedRow({ icon: Icon, label, collapsed, nested, th }) {
  const content = (
    <span aria-disabled="true" className={cn(rowBase, "cursor-default", th.planned, nested ? "px-3 py-1.5 text-table" : "px-3 py-2", collapsed && "justify-center px-0")}>
      {Icon ? <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" /> : null}
      {collapsed ? <span className="sr-only">{label} (planned, not available yet)</span> : <span className="flex-1 truncate">{label}<span className="sr-only"> (planned, not available yet)</span></span>}
      {collapsed ? null : <span className={cn("size-1.5 shrink-0 rounded-full", th.dot)} aria-hidden="true" />}
    </span>
  );
  return <Tooltip content={`${label} — ${PLANNED_HINT}`} placement="right" className="w-full">{content}</Tooltip>;
}

/**
 * Sidebar — e-Pulse navigation. Driven entirely by a navigation model (config/navigation.js).
 *   variant "fixed"   : desktop/tablet rail (collapsible to icons)
 *   variant "overlay" : inside the mobile/tablet drawer (always expanded)
 * Live items are NavLinks; planned items are muted, non-interactive and announced as "planned".
 */
export default function Sidebar({ navigation, tone = "light", collapsed = false, variant = "fixed", onNavigate, onToggleCollapsed, onRequestExpand, showPlanned = true, onTogglePlanned }) {
  const th = THEMES[tone] || THEMES.light;
  const { pathname } = useLocation();
  const nav = visibleNavigation(navigation, showPlanned);
  const activeGroupId = findNavTrail(navigation, pathname)?.group.id ?? null;
  const [openGroup, setOpenGroup] = useState(activeGroupId);

  // Keep the group of the current page open when the route changes.
  useEffect(() => {
    if (activeGroupId) setOpenGroup(activeGroupId);
  }, [activeGroupId]);

  const rail = collapsed && variant === "fixed";
  const linkClass = (isActive, nested) =>
    cn(
      rowBase,
      nested ? "px-3 py-1.5 text-table" : "px-3 py-2 font-medium",
      isActive ? th.active : th.idle,
      rail && "justify-center px-0",
    );

  const activeBar = <span className={cn("absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full", th.bar)} aria-hidden="true" />;

  const renderGroup = (group) => {
    const Icon = group.icon;

    // Single-link group (Dashboard) or planned single item (Notifications, Audit Logs, Settings)
    if (!group.items) {
      if (!isLive(group)) return <PlannedRow icon={Icon} label={group.label} collapsed={rail} th={th} />;
      const link = (
        <NavLink to={group.to} end={group.end} onClick={onNavigate} className={({ isActive }) => linkClass(isActive, false)}>
          {({ isActive }) => (
            <>
              {isActive && !rail ? activeBar : null}
              <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
              {rail ? <span className="sr-only">{group.label}</span> : <span className="flex-1 truncate">{group.label}</span>}
            </>
          )}
        </NavLink>
      );
      return rail ? <Tooltip content={group.label} placement="right" className="w-full">{link}</Tooltip> : link;
    }

    const isOpen = !rail && openGroup === group.id;
    const isActiveGroup = activeGroupId === group.id;
    const panelId = `nav-group-${group.id}`;
    const liveCount = group.items.filter(isLive).length;

    const header = (
      <button
        type="button"
        aria-expanded={rail ? undefined : isOpen}
        aria-controls={rail ? undefined : panelId}
        aria-label={rail ? group.label : undefined}
        onClick={() => {
          if (rail) onRequestExpand?.(group.id);
          else setOpenGroup(isOpen ? null : group.id);
        }}
        className={cn(rowBase, "px-3 py-2 font-medium", isActiveGroup ? th.groupActive : th.idle, rail && "justify-center px-0", isActiveGroup && rail && th.groupActiveRail)}
      >
        <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
        {rail ? null : (
          <>
            <span className="flex-1 truncate text-left">{group.label}</span>
            {liveCount === 0 ? <span className={cn("size-1.5 shrink-0 rounded-full", th.dot)} title={PLANNED_HINT} aria-hidden="true" /> : null}
            <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200", th.chev, isOpen && "rotate-180")} aria-hidden="true" />
          </>
        )}
      </button>
    );

    return (
      <>
        {rail ? <Tooltip content={group.label} placement="right" className="w-full">{header}</Tooltip> : header}
        {rail ? null : (
          <div id={panelId} inert={!isOpen} className={cn("grid transition-[grid-template-rows] duration-200 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <ul className="min-h-0 overflow-hidden">
              <li className="pt-1">
                <ul className={cn("ml-[1.375rem] space-y-0.5 border-l pl-3", th.rule)}>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      {isLive(item) ? (
                        <NavLink to={item.to} onClick={onNavigate} className={({ isActive }) => linkClass(isActive, true)}>
                          {({ isActive }) => (
                            <>
                              {isActive ? <span className={cn("absolute -left-[0.9375rem] top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full", th.bar)} aria-hidden="true" /> : null}
                              <span className="flex-1 truncate">{item.label}</span>
                            </>
                          )}
                        </NavLink>
                      ) : (
                        <PlannedRow label={item.label} nested th={th} />
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        )}
      </>
    );
  };

  const toggleBtn = cn("flex w-full items-center gap-3 rounded-control px-3 py-2 text-table transition-colors duration-150", th.toggle);

  return (
    <div
      className={cn(
        "flex flex-col",
        th.root,
        variant === "fixed" ? "fixed inset-y-0 left-0 z-40 transition-[width] duration-200 ease-out" : "h-full w-full",
      )}
      style={variant === "fixed" ? { width: rail ? "var(--sidebar-width-rail)" : "var(--sidebar-width)" } : undefined}
    >
      <BrandMark collapsed={rail} th={th} />

      <nav aria-label="Main navigation" className="dms-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        <ul className="space-y-1">
          {nav.map((group) => (
            <li key={group.id}>{renderGroup(group)}</li>
          ))}
        </ul>
      </nav>

      <div className={cn("shrink-0 space-y-0.5 border-t p-3", th.foot)}>
        {onTogglePlanned ? (
          rail ? (
            <Tooltip content={showPlanned ? "Hide planned modules" : "Show planned modules"} placement="right" className="w-full">
              <button type="button" onClick={onTogglePlanned} aria-label={showPlanned ? "Hide planned modules" : "Show planned modules"} aria-pressed={showPlanned} className={cn(toggleBtn, "justify-center px-0")}>
                {showPlanned ? <Eye className="size-[1.125rem]" aria-hidden="true" /> : <EyeOff className="size-[1.125rem]" aria-hidden="true" />}
              </button>
            </Tooltip>
          ) : (
            <button type="button" onClick={onTogglePlanned} aria-pressed={showPlanned} className={toggleBtn}>
              {showPlanned ? <Eye className="size-[1.125rem]" aria-hidden="true" /> : <EyeOff className="size-[1.125rem]" aria-hidden="true" />}
              {showPlanned ? "Hide planned modules" : "Show planned modules"}
            </button>
          )
        ) : null}
        {onToggleCollapsed ? (
          <Tooltip content={rail ? "Expand sidebar" : "Collapse sidebar"} placement="right" className="w-full" disabled={!rail}>
            <button type="button" onClick={onToggleCollapsed} aria-label={rail ? "Expand sidebar" : "Collapse sidebar"} className={cn(toggleBtn, rail && "justify-center px-0")}>
              {rail ? <PanelLeftOpen className="size-[1.125rem]" aria-hidden="true" /> : <PanelLeftClose className="size-[1.125rem]" aria-hidden="true" />}
              {rail ? null : "Collapse"}
            </button>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}
