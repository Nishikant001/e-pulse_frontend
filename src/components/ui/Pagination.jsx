import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push("…start");
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < totalPages - 1) items.push("…end");
  items.push(totalPages);
  return items;
}

/**
 * Pagination — 1-based `page`. Fully controlled: works for client-side and server-side paging.
 * Shows "Showing 1–10 of 45", page-size selector, previous/next and a compact page window.
 */
export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100], className }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "inline-flex size-8 items-center justify-center rounded-md text-table transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-table text-ink-muted", className)}>
      <div className="flex items-center gap-3">
        <p aria-live="polite">{total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}</p>
        {onPageSizeChange ? (
          <label className="hidden items-center gap-2 sm:flex">
            <span className="text-ink-subtle">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-line-strong bg-surface px-2 text-table text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button type="button" className={cn(btn, "hover:bg-neutral-100")} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="px-2 tabular-nums sm:hidden">
          {page} / {totalPages}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, totalPages).map((p) =>
            typeof p === "string" ? (
              <span key={p} className="px-1 text-ink-subtle" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(btn, "tabular-nums", p === page ? "bg-brand-600 font-medium text-white" : "hover:bg-neutral-100")}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button type="button" className={cn(btn, "hover:bg-neutral-100")} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
