import { Activity } from "lucide-react";
import { cn } from "../../utils/cn";
import Card, { CardHeader } from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import Skeleton from "../ui/Skeleton";
import { TONE_STYLES } from "../ui/statusConfig";

/** ActivityCard — vertical timeline. items: [{ id, title, description, time, icon, tone }] */
export default function ActivityCard({ title = "Recent activity", subtitle, items = [], loading = false, error = false, onRetry, actions, emptyTitle = "No recent activity", className }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      {loading ? (
        <div className="space-y-4 p-5" role="status" aria-label={`Loading ${title}`}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-7" rounded="rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState compact title="Unable to load activity" onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState compact icon={Activity} title={emptyTitle} />
      ) : (
        <ol className="px-5 py-4">
          {items.map((item, i) => {
            const tone = TONE_STYLES[item.tone] || TONE_STYLES.brand;
            const Icon = item.icon;
            return (
              <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                {i < items.length - 1 ? <span className="absolute left-3.5 top-8 h-[calc(100%-2rem)] w-px bg-line" aria-hidden="true" /> : null}
                <span className={cn("relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full", tone.chip)}>{Icon ? <Icon className="size-3.5" aria-hidden="true" /> : <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden="true" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-ink">{item.title}</p>
                  {item.description ? <p className="text-table text-ink-muted">{item.description}</p> : null}
                  {item.time ? <p className="mt-0.5 text-caption text-ink-subtle">{item.time}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
