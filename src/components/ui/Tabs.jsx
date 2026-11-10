import { useId, useRef, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Tabs — accessible tablist (arrow keys, Home/End) that renders the active tab's `content`.
 * tabs: [{ id, label, icon, count, disabled, content }]
 * Controlled (value/onChange) or uncontrolled (defaultValue). variant: "underline" | "pills".
 */
export default function Tabs({ tabs, value, defaultValue, onChange, variant = "underline", className, panelClassName }) {
  const baseId = useId();
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.id);
  const current = value ?? inner;
  const listRef = useRef(null);

  const select = (id) => {
    if (value === undefined) setInner(id);
    onChange?.(id);
  };

  const onKeyDown = (e) => {
    const enabled = tabs.filter((t) => !t.disabled);
    const idx = enabled.findIndex((t) => t.id === current);
    let next = null;
    if (e.key === "ArrowRight") next = enabled[(idx + 1) % enabled.length];
    else if (e.key === "ArrowLeft") next = enabled[(idx - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    if (next) {
      e.preventDefault();
      select(next.id);
      listRef.current?.querySelector(`[data-tab="${next.id}"]`)?.focus();
    }
  };

  const active = tabs.find((t) => t.id === current);

  return (
    <div className={className}>
      <div ref={listRef} role="tablist" onKeyDown={onKeyDown} className={cn("dms-scroll flex gap-1 overflow-x-auto", variant === "underline" ? "border-b border-line" : "rounded-control bg-neutral-100 p-1")}>
        {tabs.map((t) => {
          const selected = t.id === current;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              data-tab={t.id}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              onClick={() => select(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-body font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
                variant === "underline"
                  ? cn("-mb-px border-b-2 px-3 py-2.5", selected ? "border-brand-600 text-brand-700" : "border-transparent text-ink-muted hover:text-ink")
                  : cn("rounded-md px-3 py-1.5", selected ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink"),
              )}
            >
              {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
              {t.label}
              {t.count !== undefined ? <span className={cn("rounded-full px-1.5 text-caption tabular-nums", selected ? "bg-brand-100 text-brand-700" : "bg-neutral-200 text-neutral-700")}>{t.count}</span> : null}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined ? (
        <div role="tabpanel" id={`${baseId}-panel-${active.id}`} aria-labelledby={`${baseId}-tab-${active.id}`} tabIndex={0} className={cn("pt-4 focus:outline-none", panelClassName)}>
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
