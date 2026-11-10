import { ShieldCheck } from "lucide-react";
import { cn } from "../../utils/cn";
import Card, { CardHeader } from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import { TONE_ICONS, TONE_STYLES } from "../ui/statusConfig";

/**
 * AlertCard — list of items needing attention (near-expiry batches, failed syncs, overdue claims…).
 * items: [{ id, tone: error|warning|info|success, title, description, time, action }]
 */
export default function AlertCard({ title = "Alerts", subtitle, items = [], actions, emptyTitle = "All clear", emptyDescription = "Nothing needs your attention right now.", className }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      {items.length === 0 ? (
        <EmptyState compact icon={ShieldCheck} title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const tone = TONE_STYLES[item.tone] || TONE_STYLES.info;
            const Icon = TONE_ICONS[item.tone] || TONE_ICONS.info;
            return (
              <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", tone.chip)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-ink">{item.title}</p>
                  {item.description ? <p className="text-table text-ink-muted">{item.description}</p> : null}
                  {item.time ? <p className="mt-0.5 text-caption text-ink-subtle">{item.time}</p> : null}
                </div>
                {item.action ? <div className="shrink-0">{item.action}</div> : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
