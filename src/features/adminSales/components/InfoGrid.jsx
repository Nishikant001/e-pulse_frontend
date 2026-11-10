import { cn } from "../../../utils/cn";

/** InfoGrid — label/value pairs in 1–3 responsive columns. items: [{ label, value }] (falsy values render "—"). */
export default function InfoGrid({ items, className, columns = "sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3", columns, className)}>
      {items.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="text-caption text-ink-subtle">{label}</dt>
          <dd className="break-words text-body text-ink">{value || value === 0 ? value : <span className="text-ink-subtle">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
