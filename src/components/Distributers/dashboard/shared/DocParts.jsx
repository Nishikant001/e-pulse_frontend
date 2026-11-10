import { cn } from "../../../../utils/cn";
import { formatINR } from "../../../../utils/format";

/**
 * Small presentational pieces shared by the Distributor document screens (purchase orders, deliveries, invoices, returns, notes).
 * They only render what they are given — nothing is calculated here.
 */

/** TotalsSummary — right-aligned totals block. rows: [[label, amount]], grand: [label, amount]. Amounts are numbers. */
export function TotalsSummary({ rows, grand, className }) {
  return (
    <dl className={cn("space-y-2 rounded-card border border-line bg-surface-muted p-4 text-body", className)}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="tabular-nums text-ink">{formatINR(value)}</dd>
        </div>
      ))}
      {grand ? (
        <div className="flex items-center justify-between gap-4 border-t border-line-strong pt-3">
          <dt className="text-card-title font-semibold text-ink">{grand[0]}</dt>
          <dd className="text-card-title font-semibold tabular-nums text-ink">{formatINR(grand[1])}</dd>
        </div>
      ) : null}
    </dl>
  );
}

/** LineFigures — compact read-only figures under a form line (e.g. Net / CGST / SGST / IGST / Total). items: [[label, text, strong?]] */
export function LineFigures({ items, className }) {
  return (
    <dl className={cn("mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-control bg-surface-muted p-3 text-table sm:grid-cols-3 xl:grid-cols-5", className)}>
      {items.map(([label, value, strong]) => (
        <div key={label}>
          <dt className="text-caption text-ink-subtle">{label}</dt>
          <dd className={strong ? "font-semibold text-ink" : "text-ink"}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** AddressBlock — a titled address (or a muted fallback line) for detail panels. */
export function AddressBlock({ title, address, fallback = "Not specified" }) {
  const text = address ? [address.street1, address.street2, address.city, address.region, address.pincode || address.postalCode, address.country].filter(Boolean).join(", ") : "";
  return (
    <div className="min-w-0">
      <p className="text-caption text-ink-subtle">{title}</p>
      <p className="text-body text-ink">{text || <span className="text-ink-subtle">{fallback}</span>}</p>
    </div>
  );
}
