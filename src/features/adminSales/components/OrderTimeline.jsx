import { Check, Circle, CircleX } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatDateTime } from "../../../utils/format";

/**
 * OrderTimeline — (1) progress through the order lifecycle, derived from the order's current status; (2) the events that are
 * actually recorded (created, deliveries, invoices, SAP). No history is invented: a status change that has no recorded time
 * is shown as progress only, never with a made-up timestamp.
 */
export default function OrderTimeline({ stages, events, cancelled }) {
  return (
    <div className="space-y-5">
      <ol className="grid gap-2 sm:grid-cols-5" aria-label="Order progress">
        {stages.map((s) => (
          <li key={s.key} className={cn("flex items-center gap-2 rounded-control border px-3 py-2 text-table", s.current ? "border-brand-300 bg-brand-50 text-brand-800" : s.reached ? "border-success-200 bg-success-50 text-success-700" : "border-line bg-surface text-ink-subtle")}>
            {cancelled ? <CircleX className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" /> : s.reached ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <Circle className="size-4 shrink-0" aria-hidden="true" />}
            <span className="font-medium">{s.label}</span>
            <span className="sr-only">{cancelled ? "— not reached (order cancelled)" : s.current ? "— current stage" : s.reached ? "— completed" : "— not reached yet"}</span>
          </li>
        ))}
      </ol>
      <div>
        <h4 className="mb-2 text-body font-semibold text-ink">Recorded events</h4>
        {events.length === 0 ? (
          <p className="text-table text-ink-muted">No events recorded yet.</p>
        ) : (
          <ol className="space-y-3 border-l border-line pl-4">
            {events.map((e) => (
              <li key={e.key} className="relative">
                <span className="absolute -left-[1.3125rem] top-1.5 size-2.5 rounded-full border-2 border-surface bg-brand-500" aria-hidden="true" />
                <p className="text-body font-medium text-ink">{e.label}</p>
                <p className="text-caption text-ink-subtle">
                  <time dateTime={e.at}>{formatDateTime(e.at)}</time>
                  {e.detail ? ` · ${e.detail}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
