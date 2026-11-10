import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * SearchInput — controlled search box. onChange receives the string value.
 * With debounceMs > 0 the parent is notified after the user stops typing.
 */
export default function SearchInput({ value = "", onChange, placeholder = "Search…", debounceMs = 0, label = "Search", className, size = "md", autoFocus, inputRef }) {
  const [local, setLocal] = useState(value);
  const timer = useRef(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const emit = (next) => {
    setLocal(next);
    clearTimeout(timer.current);
    if (debounceMs > 0) timer.current = setTimeout(() => onChange?.(next), debounceMs);
    else onChange?.(next);
  };

  return (
    <div className={cn("relative", className)} role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={local}
        autoFocus={autoFocus}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => emit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && local) {
            e.stopPropagation();
            emit("");
          }
        }}
        className={cn(
          "w-full rounded-control border border-line-strong bg-surface pl-9 pr-8 text-body text-ink placeholder:text-ink-subtle transition-colors duration-150",
          "hover:border-ink-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25",
          "[&::-webkit-search-cancel-button]:hidden",
          size === "sm" ? "h-8 text-caption" : "h-9",
        )}
      />
      {local ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => emit("")}
          className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-ink-subtle hover:bg-neutral-100 hover:text-ink"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
