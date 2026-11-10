import { cn } from "../../../utils/cn";
import { formatINR } from "../../../utils/format";

/**
 * TotalsPanel — document totals, all values supplied by the backend (nothing is calculated here).
 * totals: { subtotal|grossAmount, discount, taxable, cgst, sgst, igst, roundOff, grandTotal }
 */
export default function TotalsPanel({ totals, className }) {
  const gross = totals.subtotal ?? totals.grossAmount ?? 0;
  const rows = [
    ["Subtotal", gross],
    ["Discount", -Math.abs(totals.discount || 0), true],
    ["Taxable amount", totals.taxable],
    ["CGST", totals.cgst],
    ["SGST", totals.sgst],
    ["IGST", totals.igst],
    ["Round off", totals.roundOff || 0],
  ];
  return (
    <dl className={cn("space-y-2 rounded-card border border-line bg-surface-muted p-4 text-body", className)}>
      {rows.map(([label, value, negative]) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <dt className="text-ink-muted">{label}</dt>
          <dd className={cn("tabular-nums text-ink", negative && value !== 0 && "text-success-700")}>{formatINR(value)}</dd>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 border-t border-line-strong pt-3">
        <dt className="text-card-title font-semibold text-ink">Grand total</dt>
        <dd className="text-card-title font-semibold tabular-nums text-ink">{formatINR(totals.grandTotal)}</dd>
      </div>
    </dl>
  );
}
