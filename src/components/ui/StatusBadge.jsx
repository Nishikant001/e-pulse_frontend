import { cn } from "../../utils/cn";
import { getStatusMeta, TONE_STYLES } from "./statusConfig";

/**
 * StatusBadge — consistent status pill: icon + text label + colour (never colour alone).
 *   <StatusBadge status="Near Expiry" domain="inventory" />
 *   <StatusBadge status={order.status} domain="salesOrder" />
 * `label` overrides the text; unknown statuses render as a neutral badge.
 */
export default function StatusBadge({ status, domain, label, size = "md", showIcon = true, className }) {
  const meta = getStatusMeta(status, domain);
  const Icon = meta.icon;
  const t = TONE_STYLES[meta.tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[11px] leading-4" : "px-2.5 py-0.5 text-caption",
        t.badge,
        className,
      )}
    >
      {showIcon ? <Icon className={cn("size-3.5 shrink-0", meta.spin && "animate-spin")} aria-hidden="true" /> : null}
      {label || meta.label}
    </span>
  );
}
