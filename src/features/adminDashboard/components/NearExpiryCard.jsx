import { Clock, Hourglass, TriangleAlert } from "lucide-react";
import Button from "../../../components/ui/Button";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import ProgressBar from "../../../components/ui/ProgressBar";
import Skeleton from "../../../components/ui/Skeleton";
import { TONE_STYLES } from "../../../components/ui/statusConfig";
import Tooltip from "../../../components/ui/Tooltip";
import { cn } from "../../../utils/cn";
import { formatINRCompact, formatNumber } from "../../../utils/format";

/**
 * NearExpiryCard — overview only. The expiry WORKFLOW (transfer, return, push-sales) belongs to later phases.
 * "View Batches" stays inactive (and says why) until the Admin batch view exists; pass `onViewBatches` to enable it.
 */
export default function NearExpiryCard({ data, loading, onViewBatches }) {
  const t = data?.meta.nearExpiryThresholdsDays || { critical: 30, high: 60, medium: 90 };
  const tiers = [
    { key: "critical", label: "Critical", window: `under ${t.critical} days`, tone: "error", icon: TriangleAlert },
    { key: "high", label: "High", window: `${t.critical}–${t.high - 1} days`, tone: "warning", icon: Hourglass },
    { key: "medium", label: "Medium", window: `${t.high}–${t.medium - 1} days`, tone: "info", icon: Clock },
  ];
  const ne = data?.nearExpiry;

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Near Expiry Inventory"
        subtitle={`Stock expiring in under ${t.medium} days · as of now`}
        actions={
          onViewBatches ? (
            <Button size="sm" variant="secondary" onClick={onViewBatches}>
              View Batches
            </Button>
          ) : (
            <Tooltip content="The Admin batch view is planned and not available yet" placement="bottom">
              <Button size="sm" variant="secondary" aria-disabled="true" className="cursor-not-allowed opacity-60" onClick={(e) => e.preventDefault()}>
                View Batches
              </Button>
            </Tooltip>
          )
        }
      />
      <CardBody>
        {loading || !ne ? (
          <div role="status" aria-label="Loading near expiry inventory" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24" rounded="rounded-card" />
              ))}
            </div>
            <Skeleton className="h-10" />
          </div>
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-3">
              {tiers.map(({ key, label, window, tone, icon: Icon }) => {
                const b = ne.buckets[key];
                const s = TONE_STYLES[tone];
                return (
                  <li key={key} className={cn("rounded-card border p-4", s.border, s.surface)}>
                    <p className={cn("flex items-center gap-1.5 text-table font-semibold", s.text)}>
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </p>
                    <p className="text-caption text-ink-muted">{window}</p>
                    <p className="mt-2 text-section font-semibold tabular-nums text-ink">{formatINRCompact(b.value, { fixed: 1 })}</p>
                    <p className="text-caption text-ink-muted">{formatNumber(b.batches)} {b.batches === 1 ? "batch" : "batches"}</p>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-4 grid grid-cols-3 gap-3 rounded-card bg-surface-muted p-4">
              <div>
                <dt className="text-caption text-ink-subtle">Batches</dt>
                <dd className="text-card-title font-semibold tabular-nums text-ink">{formatNumber(ne.totals.batches)}</dd>
              </div>
              <div>
                <dt className="text-caption text-ink-subtle">Products</dt>
                <dd className="text-card-title font-semibold tabular-nums text-ink">{formatNumber(ne.totals.products)}</dd>
              </div>
              <div>
                <dt className="text-caption text-ink-subtle">Stock value</dt>
                <dd className="text-card-title font-semibold tabular-nums text-ink">{formatINRCompact(ne.totals.value, { fixed: 1 })}</dd>
              </div>
            </dl>

            <ProgressBar className="mt-4" tone="warning" label="Near-expiry stock as a share of inventory value" value={ne.shareOfInventoryPct} max={100} showValue />

            {ne.expired.batches > 0 ? (
              <p className="mt-3 text-table text-error-700">
                Already expired and still in stock: {formatNumber(ne.expired.batches)} {ne.expired.batches === 1 ? "batch" : "batches"} · {formatINRCompact(ne.expired.value, { fixed: 1 })}
              </p>
            ) : null}
            <p className="mt-3 text-caption text-ink-subtle">Severity windows ({t.critical} / {t.high} / {t.medium} days) are engineering defaults pending business confirmation.</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
