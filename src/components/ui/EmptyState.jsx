import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";

/** EmptyState — "nothing here yet" with an optional next action. */
export default function EmptyState({ icon: Icon = Inbox, title = "Nothing to show", description, action, className, compact = false }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-card-title font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-body text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
