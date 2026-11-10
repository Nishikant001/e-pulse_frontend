import { AlertTriangle, Boxes, Ban, CheckCircle2, IndianRupee, PackageSearch, TimerReset } from "lucide-react";
import { formatINRCompact, formatNumber } from "../../../utils/format";
import KpiCard from "../../../components/ui/KpiCard";
import { useBreakpoint } from "../../../hooks/useMediaQuery";

/** KPI strip for Current Stock. Every figure comes from GET /inventory/summary (same filters as the table). */
export default function InventoryKpis({ summary, loading, error, onRetry }) {
  const s = summary;
  const nearDays = s?.nearExpiryDays ?? 90;
  // On phones the strip is 2-up and drops the footer lines so the table is reachable without scrolling past a wall of cards.
  const compact = useBreakpoint() === "mobile";
  const common = { loading, error, onRetry, className: compact ? "p-3!" : undefined };
  const f = (text) => (compact ? undefined : text);
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-7">
      <KpiCard {...common} title="Total stock value" icon={IndianRupee} status="brand" value={s ? formatINRCompact(s.totalStockValue) : ""} footer={f("At purchase cost")} />
      <KpiCard {...common} title="Total SKUs" icon={PackageSearch} status="info" value={s ? formatNumber(s.totalSkus) : ""} footer={f("With stock on hand")} />
      <KpiCard {...common} title="Total batches" icon={Boxes} status="info" value={s ? formatNumber(s.totalBatches) : ""} footer={f("With stock on hand")} />
      <KpiCard {...common} title="Saleable stock" icon={CheckCircle2} status="success" value={s ? formatNumber(s.saleableQty) : ""} footer={f("Units a sale may use")} />
      <KpiCard {...common} title="Non-saleable stock" icon={Ban} status="error" value={s ? formatNumber(s.nonSaleableQty) : ""} footer={f("Held, expired or damaged")} />
      <KpiCard {...common} title="Low stock items" icon={AlertTriangle} status="warning" value={s ? formatNumber(s.lowStockItems) : ""} footer={f("At or below reorder level")} />
      <KpiCard {...common} title="Near expiry items" icon={TimerReset} status="warning" value={s ? formatNumber(s.nearExpiryItems) : ""} footer={f(`Expiring within ${nearDays} days`)} />
    </div>
  );
}
