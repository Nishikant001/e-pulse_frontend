import AlertCard from "../../../components/dashboard/AlertCard";
import Badge from "../../../components/ui/Badge";
import Card, { CardHeader } from "../../../components/ui/Card";
import Skeleton from "../../../components/ui/Skeleton";
import { alertText, TONE_LABEL } from "./alertText";

/**
 * AlertsPanel — items needing attention. Live alerts are limited to conditions the current data can prove
 * (near-expiry / expired stock, low stock). Credit-limit, SAP-failure and claim alerts appear only in sample data.
 * Each alert carries a text severity (Critical / Warning / Info / Success) in addition to its colour and icon.
 */
export default function AlertsPanel({ data, loading }) {
  if (loading || !data) {
    return (
      <Card className="min-w-0">
        <CardHeader title="Alerts" />
        <div role="status" aria-label="Loading alerts" className="space-y-4 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </Card>
    );
  }
  const sample = data.source === "sample";
  const items = data.alerts.map((a) => {
    const { title, description } = alertText(a, data.meta.nearExpiryThresholdsDays);
    return {
      id: a.id,
      tone: a.tone,
      title,
      description,
      time: sample ? undefined : "As of now",
      action: <Badge tone={a.tone === "error" ? "error" : a.tone} size="sm">{TONE_LABEL[a.tone] || "Info"}</Badge>,
    };
  });
  return <AlertCard className="min-w-0" title="Alerts" subtitle={sample ? "Sample data" : "Detected from current stock data"} items={items} emptyTitle="No alerts" emptyDescription="Nothing needs attention right now." />;
}
