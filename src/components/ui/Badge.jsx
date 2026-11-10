import { cn } from "../../utils/cn";
import { TONE_STYLES } from "./statusConfig";

/** Badge — small label. tone: brand | success | warning | error | info | neutral. */
export default function Badge({ tone = "neutral", variant = "soft", size = "md", dot = false, icon: Icon, className, children }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.neutral;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px] leading-4" : "px-2.5 py-0.5 text-caption",
        variant === "outline" ? cn("bg-surface ring-1 ring-inset", t.badge.split(" ").filter((c) => c.startsWith("text-") || c.startsWith("ring-")).join(" ")) : cn("ring-1 ring-inset", t.badge),
        className,
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", t.dot)} aria-hidden="true" /> : null}
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
