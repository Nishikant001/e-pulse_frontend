import Card, { CardBody, CardHeader } from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import ProgressBar from "../ui/ProgressBar";

/** ProgressCard — stacked progress bars (target vs achieved, credit utilisation…). items: [{ id, label, value, max, tone, hint }] */
export default function ProgressCard({ title, subtitle, items = [], actions, className }) {
  return (
    <Card className={className}>
      <CardHeader title={title} subtitle={subtitle} actions={actions} />
      {items.length === 0 ? (
        <EmptyState compact title="No progress data" />
      ) : (
        <CardBody className="space-y-5">
          {items.map((item) => (
            <div key={item.id}>
              <ProgressBar label={item.label} value={item.value} max={item.max} tone={item.tone} showValue />
              {item.hint ? <p className="mt-1 text-caption text-ink-subtle">{item.hint}</p> : null}
            </div>
          ))}
        </CardBody>
      )}
    </Card>
  );
}
