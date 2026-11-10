import { FilterX } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";

/**
 * FilterBar — responsive row of filter controls with a "Clear filters" action.
 * Compose with SearchFilter / DateRangeFilter / SelectFilter and the preset filters from components/forms.
 *   <FilterBar activeCount={2} onReset={reset}>…filters…</FilterBar>
 */
export default function FilterBar({ children, activeCount = 0, onReset, className, trailing }) {
  return (
    <div role="group" aria-label="Filters" className={cn("flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface p-3 shadow-card", className)}>
      {children}
      <div className="ml-auto flex items-center gap-2">
        {trailing}
        {onReset ? (
          <Button variant="ghost" size="sm" leftIcon={FilterX} onClick={onReset} disabled={activeCount === 0}>
            Clear filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
