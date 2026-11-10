import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "../../utils/cn";
import { flattenLive } from "../../config/navigation";
import Popover from "../ui/Popover";

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * GlobalSearch — jump-to-page search over the portal navigation (keyboard: "/" or Ctrl/⌘+K to focus).
 * Entity search (products, retailers, invoices…) needs a backend search API and arrives in a later phase.
 * embedded: render results inline (used inside the mobile search dialog) instead of a popover.
 */
export default function GlobalSearch({ navigation, embedded = false, autoFocus = false, onNavigate, className }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const anchorRef = useRef(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const entries = useMemo(() => flattenLive(navigation), [navigation]);
  const q = query.trim().toLowerCase();
  const results = useMemo(() => (q ? entries.filter((e) => `${e.label} ${e.group}`.toLowerCase().includes(q)).slice(0, 8) : []), [entries, q]);

  useEffect(() => {
    if (embedded) return undefined;
    const onKey = (e) => {
      const slash = e.key === "/" && !isTypingTarget(document.activeElement) && !e.ctrlKey && !e.metaKey;
      const chord = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (slash || chord) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [embedded]);

  const go = (entry) => {
    if (!entry) return;
    setQuery("");
    setOpen(false);
    navigate(entry.to);
    onNavigate?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      if (results[active]) {
        e.preventDefault();
        go(results[active]);
      }
    } else if (e.key === "Escape") {
      if (query) {
        e.stopPropagation();
        setQuery("");
      }
      setOpen(false);
    }
  };

  const list = (
    <ul id={listId} role="listbox" aria-label="Search results" className="p-1">
      {results.map((r, i) => (
        <li
          key={r.id}
          id={`${listId}-${i}`}
          role="option"
          aria-selected={i === active}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setActive(i)}
          onClick={() => go(r)}
          className={cn("flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-body", i === active ? "bg-brand-50 text-brand-800" : "text-ink")}
        >
          <span className="min-w-0 flex-1 truncate">{r.label}</span>
          {r.group ? <span className="shrink-0 text-caption text-ink-subtle">{r.group}</span> : null}
          {i === active ? <CornerDownLeft className="size-3.5 shrink-0 text-brand-600" aria-hidden="true" /> : null}
        </li>
      ))}
    </ul>
  );
  const noResults = q && results.length === 0 ? <p className="px-4 py-3 text-body text-ink-muted">No matching pages for “{query.trim()}”.</p> : null;
  const showPanel = q.length > 0 && (embedded || open);

  return (
    <div ref={anchorRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search pages"
        aria-expanded={showPanel && results.length > 0}
        aria-controls={showPanel && results.length > 0 ? listId : undefined}
        aria-activedescendant={showPanel && results.length > 0 ? `${listId}-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="Search pages…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-9 w-full rounded-control border border-line-strong bg-surface-muted pl-9 pr-9 text-body text-ink placeholder:text-ink-subtle transition-colors duration-150 hover:border-ink-subtle focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/25"
      />
      {embedded ? null : <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line-strong bg-surface px-1.5 font-mono text-[11px] text-ink-subtle xl:block">/</kbd>}

      {embedded ? (
        showPanel ? <div className="mt-2 rounded-card border border-line bg-surface">{results.length ? list : noResults}</div> : null
      ) : (
        <Popover open={showPanel} onClose={() => setOpen(false)} anchorRef={anchorRef} matchWidth placement="bottom-start" className="max-h-80 overflow-y-auto">
          {results.length ? list : noResults}
        </Popover>
      )}
    </div>
  );
}
