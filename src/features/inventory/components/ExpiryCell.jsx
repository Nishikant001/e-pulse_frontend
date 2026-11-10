import { formatDate } from "../../../utils/format";

/** Expiry date plus a plain-text "in 40 days / 10 days ago" hint (days come from the API; text, not colour alone). */
export default function ExpiryCell({ date, days }) {
  if (!date) return <span className="text-ink-subtle">—</span>;
  const hint = days == null ? null : days < 0 ? `expired ${Math.abs(days)} d ago` : days === 0 ? "expires today" : `in ${days} d`;
  return (
    <span className="block whitespace-nowrap">
      {formatDate(date)}
      {hint ? <span className="block text-caption text-ink-subtle">{hint}</span> : null}
    </span>
  );
}
