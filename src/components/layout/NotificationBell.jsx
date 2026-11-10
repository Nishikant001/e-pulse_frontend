import { useId, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import EmptyState from "../ui/EmptyState";
import IconButton from "../ui/IconButton";
import Popover from "../ui/Popover";

/**
 * NotificationBell — bell with unread badge and a popover list.
 * items: [{ id, title, description, time }]. With no items it shows an empty state
 * (the notification backend arrives in a later phase — nothing here is fake data).
 */
export default function NotificationBell({ items = [], unreadCount = 0, onItemClick }) {
  const anchorRef = useRef(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  return (
    <div ref={anchorRef} className="inline-flex">
      <IconButton
        icon={Bell}
        label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        badge={unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
      />
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} placement="bottom-end" role="dialog" id={panelId} ariaLabel="Notifications" className="w-[min(22rem,calc(100vw-1rem))]">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-body font-semibold text-ink">Notifications</h2>
        </div>
        {items.length === 0 ? (
          <EmptyState compact icon={BellOff} title="You're all caught up" description="New alerts about expiry, claims and integrations will appear here." />
        ) : (
          <ul className="dms-scroll max-h-80 divide-y divide-line overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => { setOpen(false); onItemClick?.(n); }} className="w-full px-4 py-3 text-left transition-colors duration-100 hover:bg-neutral-50">
                  <p className="text-body font-medium text-ink">{n.title}</p>
                  {n.description ? <p className="text-table text-ink-muted">{n.description}</p> : null}
                  {n.time ? <p className="mt-0.5 text-caption text-ink-subtle">{n.time}</p> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Popover>
    </div>
  );
}
