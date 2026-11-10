import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import Popover from "./Popover";

/**
 * Dropdown — action menu (role="menu"). Wrap ONE trigger element (Button, IconButton, Avatar button…).
 * items: [{ key, label, icon, onClick, to, danger, disabled, divider, header, hint }]
 * Keyboard: Enter/Space/ArrowDown opens, ArrowUp/Down/Home/End move, Escape closes, Tab closes.
 */
export default function Dropdown({ children, items, align = "end", label = "Actions", width = "w-56" }) {
  const anchorRef = useRef(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const trigger = Children.only(children);
  const enhanced = isValidElement(trigger) ? cloneElement(trigger, { "aria-haspopup": "menu", "aria-expanded": open, "aria-controls": open ? menuId : undefined }) : trigger;

  useEffect(() => {
    if (!open) return undefined;
    // Wait a frame so the popover has been positioned and is visible before moving focus into it.
    const frame = requestAnimationFrame(() => {
      document.getElementById(menuId)?.querySelector('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, menuId]);

  const onMenuKeyDown = (e) => {
    const nodes = Array.from(document.getElementById(menuId)?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') || []);
    const idx = nodes.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      nodes[(idx + 1) % nodes.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      nodes[(idx - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      nodes[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (e.key === "Tab") {
      close();
    }
  };

  const itemClass = (item) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-body transition-colors duration-100",
      item.disabled ? "cursor-not-allowed text-ink-subtle/70" : item.danger ? "text-error-700 hover:bg-error-50 focus:bg-error-50" : "text-ink hover:bg-neutral-100 focus:bg-neutral-100",
      "focus:outline-none",
    );

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {enhanced}
      </span>
      <Popover open={open} onClose={close} anchorRef={anchorRef} placement={align === "end" ? "bottom-end" : "bottom-start"} role="menu" id={menuId} ariaLabel={label} onKeyDown={onMenuKeyDown} className={cn(width, "p-1")}>
        {items.map((item, i) => {
          if (item.divider) return <div key={item.key || `d${i}`} role="separator" className="my-1 h-px bg-line" />;
          if (item.header) {
            return (
              <div key={item.key || `h${i}`} className="px-2.5 py-1.5 text-caption font-medium uppercase tracking-wide text-ink-subtle">
                {item.header}
              </div>
            );
          }
          const Icon = item.icon;
          const content = (
            <>
              {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
              <span className="flex-1 truncate">{item.label}</span>
              {item.hint ? <span className="text-caption text-ink-subtle">{item.hint}</span> : null}
            </>
          );
          const common = { role: "menuitem", "aria-disabled": item.disabled || undefined, tabIndex: -1, className: itemClass(item) };
          if (item.to && !item.disabled) {
            return (
              <Link key={item.key || item.label} to={item.to} {...common} onClick={close}>
                {content}
              </Link>
            );
          }
          return (
            <button
              key={item.key || item.label}
              type="button"
              {...common}
              onClick={() => {
                if (item.disabled) return;
                close();
                item.onClick?.();
              }}
            >
              {content}
            </button>
          );
        })}
      </Popover>
    </>
  );
}
