import { LogOut } from "lucide-react";
import Avatar from "./Avatar";
import Dropdown from "./Dropdown";

/**
 * UserMenu — avatar button + account menu. Purely presentational: the caller supplies the identity
 * (name / subtitle / email) and the menu actions, so the same component serves Admin, Distributor and Retailer.
 */
export default function UserMenu({ user, items = [], onLogout, align = "end", showDetails = true }) {
  const name = user?.name || "User";
  const menu = [
    { key: "identity", header: user?.email || user?.subtitle || "Signed in" },
    ...items,
    ...(items.length ? [{ key: "sep", divider: true }] : []),
    ...(onLogout ? [{ key: "logout", label: "Sign out", icon: LogOut, danger: true, onClick: onLogout }] : []),
  ];
  return (
    <Dropdown items={menu} align={align} label="Account menu" width="w-64">
      <button type="button" aria-label={`Account menu for ${name}`} className="flex items-center gap-2.5 rounded-control p-1 pr-2 transition-colors duration-150 hover:bg-neutral-100">
        <Avatar name={name} size="sm" />
        {showDetails ? (
          <span className="hidden min-w-0 text-left md:block">
            <span className="block max-w-36 truncate text-body font-medium leading-tight text-ink">{name}</span>
            {user?.subtitle ? <span className="block max-w-36 truncate text-caption leading-tight text-ink-subtle">{user.subtitle}</span> : null}
          </span>
        ) : null}
      </button>
    </Dropdown>
  );
}
