import { BarChart3 } from "lucide-react";
import Card, { CardBody, CardHeader } from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import Skeleton from "../ui/Skeleton";

/**
 * ChartCard — consistent frame for any chart (Recharts etc.). It only handles the chrome and the
 * loading / error / empty states; pass the chart as children (give it a ResponsiveContainer).
 */
export default function ChartCard({ title, subtitle, actions, loading = false, error = false, onRetry, empty = false, emptyTitle = "No data for this period", height = 280, footer, className, children }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      <CardBody>
        <div style={{ height }} className="w-full">
          {loading ? (
            <div role="status" aria-label={`Loading ${title}`} className="flex h-full flex-col justify-end gap-3">
              <Skeleton className="h-full min-h-56 w-full" rounded="rounded-card" />
            </div>
          ) : error ? (
            <ErrorState compact title="Unable to load chart" onRetry={onRetry} />
          ) : empty ? (
            <EmptyState compact icon={BarChart3} title={emptyTitle} description="Try changing the date range or filters." />
          ) : (
            children
          )}
        </div>
      </CardBody>
      {footer ? <div className="border-t border-line px-5 py-3 text-caption text-ink-muted">{footer}</div> : null}
    </Card>
  );
}
