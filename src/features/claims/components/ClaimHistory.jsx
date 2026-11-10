import StatusBadge from "../../../components/ui/StatusBadge";
import { formatDateTime } from "../../../utils/format";

/** Append-only status trail, oldest first. */
export default function ClaimHistory({ history }) {
  if (!history?.length) return <p className="px-5 py-6 text-body text-ink-muted">No history yet.</p>;
  return (
    <ol className="divide-y divide-line">
      {history.map((h) => (
        <li key={h.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3">
          <div className="flex items-center gap-2">
            {h.from ? <><StatusBadge status={h.from} domain="claim" size="sm" /><span aria-hidden="true" className="text-ink-subtle">→</span></> : null}
            <StatusBadge status={h.to} domain="claim" size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-body text-ink">{h.actor}{h.comment ? <span className="text-ink-muted"> — {h.comment}</span> : null}</div>
            <div className="text-caption text-ink-subtle">{formatDateTime(h.at)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
