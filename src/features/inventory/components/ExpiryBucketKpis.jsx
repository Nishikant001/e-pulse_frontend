import { AlertTriangle, Ban, Boxes, IndianRupee, Info } from "lucide-react";
import KpiCard from "../../../components/ui/KpiCard";
import { formatINRCompact, formatNumber } from "../../../utils/format";

/**
 * KPI strip for the Near Expiry page: total stock nearing expiry (critical + high + medium — item 12), plus the
 * bucket breakdown. All from GET /inventory/expiry-summary (services/inventoryQuery.service.js#getExpiryBucketSummary).
 */
export default function ExpiryBucketKpis({ summary, loading, error, onRetry }) {
  const s = summary;
  const totals = s ? ["critical", "high", "medium"].reduce((a, k) => ({ batches: a.batches + s[k].batches, products: a.products + s[k].products, units: a.units + s[k].units, value: a.value + s[k].value }), { batches: 0, products: 0, units: 0, value: 0 }) : null;
  const common = { loading, error, onRetry };
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiCard {...common} title="Near-expiry stock" icon={Boxes} status="warning" value={totals ? formatNumber(totals.units) : ""} footer={totals ? `${formatNumber(totals.batches)} batches · ${formatNumber(totals.products)} products` : undefined} />
      <KpiCard {...common} title="Near-expiry value" icon={IndianRupee} status="warning" value={totals ? formatINRCompact(totals.value) : ""} footer="At purchase cost" />
      <KpiCard {...common} title="Critical (< 30 days)" icon={AlertTriangle} status="error" value={s ? formatNumber(s.critical.units) : ""} footer={s ? `${formatNumber(s.critical.batches)} batches` : undefined} />
      <KpiCard {...common} title="Monitor (60–89 days)" icon={Info} status="info" value={s ? formatNumber(s.medium.units) : ""} footer={s ? `${formatNumber(s.medium.batches)} batches` : undefined} />
    </div>
  );
}

/** Small standalone card for the Expired Stock page (one number, not a breakdown). */
export function ExpiredStockKpi({ summary, loading, error, onRetry }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiCard loading={loading} error={error} onRetry={onRetry} title="Expired stock" icon={Ban} status="error" value={summary ? formatNumber(summary.expired.units) : ""} footer={summary ? `${formatNumber(summary.expired.batches)} batches · ${formatNumber(summary.expired.products)} products` : undefined} />
      <KpiCard loading={loading} error={error} onRetry={onRetry} title="Expired value" icon={IndianRupee} status="error" value={summary ? formatINRCompact(summary.expired.value) : ""} footer="At purchase cost" />
    </div>
  );
}
