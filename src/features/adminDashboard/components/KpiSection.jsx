import { Boxes, Building2, Hourglass, IndianRupee, RotateCcw, ShoppingCart, Store, Wallet } from "lucide-react";
import KpiCard from "../../../components/ui/KpiCard";
import { formatINRCompact, formatNumber } from "../../../utils/format";
import { trendOf } from "./kpiHelpers";

const PLACEHOLDERS = ["Total Secondary Sales", "Today's Orders", "Active Distributors", "Active Retailers", "Current Inventory", "Near Expiry Stock", "Sales Returns", "Outstanding"];

/** KpiSection — the 8 management KPIs, rendered with the shared KpiCard (no new KPI component). */
export default function KpiSection({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {PLACEHOLDERS.map((title) => (
          <KpiCard key={title} title={title} loading />
        ))}
      </div>
    );
  }

  const k = data.kpis;
  const outstanding = k.outstanding.value;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="Total Secondary Sales" icon={IndianRupee} status="brand" value={formatINRCompact(k.totalSecondarySales.value)} trend={trendOf(k.totalSecondarySales.changePct)} comparison="vs previous period" />
      <KpiCard title="Today's Orders" icon={ShoppingCart} status="info" value={formatNumber(k.todaysOrders.value)} trend={trendOf(k.todaysOrders.changePct)} comparison="vs yesterday" />
      <KpiCard title="Active Distributors" icon={Building2} status="success" value={formatNumber(k.activeDistributors.value)} footer={`of ${formatNumber(k.activeDistributors.registered)} registered · in selected period`} />
      <KpiCard title="Active Retailers" icon={Store} status="brand" value={formatNumber(k.activeRetailers.value)} footer={`of ${formatNumber(k.activeRetailers.registered)} registered · in selected period`} />
      <KpiCard title="Current Inventory" icon={Boxes} status="brand" value={formatINRCompact(k.currentInventory.value)} comparison="as of now" footer={`${formatNumber(k.currentInventory.units)} units · ${formatNumber(k.currentInventory.batches)} batches`} />
      <KpiCard title="Near Expiry Stock" icon={Hourglass} status="warning" value={formatINRCompact(k.nearExpiryStock.value)} comparison="expiring in under 90 days" footer={`${formatNumber(k.nearExpiryStock.batches)} batches`} />
      <KpiCard title="Sales Returns" icon={RotateCcw} status="warning" value={formatINRCompact(k.salesReturns.value)} trend={trendOf(k.salesReturns.changePct, { higherIsBad: true })} comparison="vs previous period" footer={`${formatNumber(k.salesReturns.count)} returns posted`} />
      <KpiCard
        title="Outstanding"
        icon={Wallet}
        status="warning"
        value={outstanding === null ? "—" : formatINRCompact(outstanding)}
        comparison="receivables as of now"
        footer={outstanding === null ? "No receivable ledger found yet" : undefined}
      />
    </div>
  );
}
