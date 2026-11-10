import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

/** Breadcrumb — items: [{ label, to? }]. The last item is the current page. */
export default function Breadcrumb({ items = [], className, nowrap = false }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cn("flex items-center gap-1 text-caption text-ink-subtle", nowrap ? "flex-nowrap overflow-hidden whitespace-nowrap" : "flex-wrap")}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className={cn("flex items-center gap-1", nowrap && (last ? "min-w-0 truncate" : "shrink-0"))}>
              {i > 0 ? <ChevronRight className="size-3.5 shrink-0 text-line-strong" aria-hidden="true" /> : null}
              {item.to && !last ? (
                <Link to={item.to} className="rounded transition-colors duration-150 hover:text-brand-700 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && "font-medium text-ink-muted")}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
