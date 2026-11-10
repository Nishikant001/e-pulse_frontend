import { cn } from "../../utils/cn";
import { TONE_STYLES } from "./statusConfig";
import Skeleton from "./Skeleton";
import TrendIndicator from "./TrendIndicator";
import ErrorState from "./ErrorState";

/**
 * KpiCard — presentational KPI tile. It renders whatever it is given; it holds NO data of its own.
 *   <KpiCard title="Total Secondary Sales" value="₹2.48 Cr" icon={IndianRupee}
 *            trend={{ direction: "up", value: "+12.6%" }} comparison="vs last month" status="brand" />
 * Props: title, value, icon, trend {direction, value, sentiment?}, comparison, status
 * (brand|success|warning|error|info|neutral — tints the icon chip), footer, loading, error, onRetry, onClick.
 */
export default function KpiCard({ title, value, icon: Icon, trend, comparison, status = "brand", footer, loading = false, error = false, onRetry, onClick, className }) {
  const t = TONE_STYLES[status] || TONE_STYLES.brand;
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button", onClick } : {})}
      className={cn(
        // min-w-0: without it, a grid/flex item's minimum width defaults to its content's intrinsic width — a long
        // unbroken value (e.g. a currency figure below the "compact" threshold, like "₹32,807.64") then forces the
        // whole grid track wider than the viewport on a narrow screen instead of letting the card shrink.
        "flex w-full min-w-0 flex-col rounded-card border border-line bg-surface p-5 text-left shadow-card transition-shadow duration-200",
        onClick && "cursor-pointer hover:shadow-hover",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-body font-medium text-ink-muted">{title}</p>
        {Icon ? (
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-control", t.chip)}>
            <Icon className="size-[1.125rem]" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-3 space-y-3" role="status" aria-label={`Loading ${title}`}>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      ) : error ? (
        <ErrorState compact title="Unable to load" message="This figure could not be loaded." onRetry={onRetry} className="items-start! px-0! py-4! text-left!" />
      ) : (
        <>
          <p className="mt-2 break-words text-kpi font-semibold tracking-tight text-ink tabular-nums">{value ?? "—"}</p>
          {trend || comparison ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {trend ? <TrendIndicator direction={trend.direction} value={trend.value} sentiment={trend.sentiment} /> : null}
              {comparison ? <span className="text-caption text-ink-subtle">{comparison}</span> : null}
            </div>
          ) : null}
          {footer ? <div className="mt-3 border-t border-line pt-3 text-caption text-ink-muted">{footer}</div> : null}
        </>
      )}
    </Wrapper>
  );
}
