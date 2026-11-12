import { Boxes, FileText, RefreshCw, RotateCcw, ShoppingCart } from "lucide-react";
import ActivityCard from "../../../components/dashboard/ActivityCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { getStatusMeta } from "../../../components/ui/statusConfig";
import { formatRelative } from "../dashboardModel";

const MODULE_ICON = { "Sales Orders": ShoppingCart, "Sales Invoices": FileText, "Sales Returns": RotateCcw, Inventory: Boxes, "SAP Integration": RefreshCw };

/**
 * ActivityPanel — recent business activity with timestamp, module, action, status and optional reference.
 * Live: the latest sales orders / invoices / returns. It is NOT an audit log (Audit Logs arrive in a later phase).
 */
export default function ActivityPanel({ data, loading, onRetry }) {
  const items = (data?.activity || []).map((a) => ({
    id: a.id,
    title: a.action,
    tone: getStatusMeta(a.status).tone,
    icon: MODULE_ICON[a.module],
    description: (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{[a.module, a.reference, a.distributor].filter(Boolean).join(" · ")}</span>
        <StatusBadge status={a.status} size="sm" />
      </span>
    ),
    time: (
      <time dateTime={a.at} title={new Date(a.at).toLocaleString("en-IN")}>
        {formatRelative(a.at)}
      </time>
    ),
  }));

  return (
    <ActivityCard
      className="min-w-0"
      title="Recent Activity"
      subtitle="Latest sales orders, invoices and returns across distributors"
      items={items}
      loading={loading || !data}
      onRetry={onRetry}
      emptyTitle="No recent activity"
    />
  );
}
