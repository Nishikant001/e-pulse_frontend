import { cn } from "../../utils/cn";
import { TONE_STYLES } from "./statusConfig";

/** ProgressBar — role="progressbar" with value text. tone: brand | success | warning | error | info. */
export default function ProgressBar({ value = 0, max = 100, tone = "brand", label, showValue = false, size = "md", className }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const t = TONE_STYLES[tone] || TONE_STYLES.brand;
  return (
    <div className={className}>
      {label || showValue ? (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-caption">
          <span className="font-medium text-ink-muted">{label}</span>
          {showValue ? <span className="tabular-nums text-ink-subtle">{Math.round(pct)}%</span> : null}
        </div>
      ) : null}
      <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)} aria-label={label || "Progress"} className={cn("w-full overflow-hidden rounded-full bg-neutral-100", size === "sm" ? "h-1.5" : "h-2")}>
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", t.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
